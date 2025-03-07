import Queue from "bull";
import { prisma } from "../prisma/client";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import fs from "fs/promises";
import path from "path";

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  "node_modules/pdfjs-dist/build/pdf.worker.mjs"
);

// Create the queue
const resumeQueue = new Queue(
  "resume-processing",
  process.env.REDIS_URL || "redis://localhost:6379"
);

// Define job data interface
interface ResumeJobData {
  filePath: string;
  sessionId: string;
  mimeType: string;
}

// Extract text from PDF
async function extractPdfText(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const buffer = await fs.readFile(filePath);

    // Ensure we have a valid buffer
    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Invalid file data: not a buffer");
    }

    // Convert Buffer to Uint8Array
    const data = new Uint8Array(buffer);

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => "str" in item)
        .map((item) => (item as any).str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Extract text from DOCX
async function extractDocxText(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const buffer = await fs.readFile(filePath);

    // Ensure we have a valid buffer
    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Invalid file data: not a buffer");
    }

    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX");
  }
}

// Process jobs
resumeQueue.process(async (job) => {
  const { filePath, sessionId, mimeType } = job.data as ResumeJobData;

  try {
    // Update progress to 25%
    await job.progress(25);

    // Check if file exists and is readable
    try {
      await fs.access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`File not found or not readable at path: ${filePath}`);
    }

    // Extract text based on file type
    let extractedText = "";
    try {
      if (mimeType === "application/pdf") {
        extractedText = await extractPdfText(filePath);
      } else {
        extractedText = await extractDocxText(filePath);
      }
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error("Failed to extract text from file");
    }

    // Update progress to 50%
    await job.progress(50);

    // Create candidate and resume records
    const candidate = await prisma.candidate.create({
      data: {
        sessionId,
        resumes: {
          create: {
            filePath,
            extractedText,
            status: extractedText ? "processed" : "review_needed",
          },
        },
      },
      include: {
        resumes: true,
      },
    });

    // Update progress to 100%
    await job.progress(100);

    return {
      candidateId: candidate.id,
      resumeId: candidate.resumes[0].id,
      status: candidate.resumes[0].status,
    };
  } catch (error) {
    console.error("Resume processing error:", error);
    throw error;
  }
});

// Handle failed jobs
resumeQueue.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

export { resumeQueue };
