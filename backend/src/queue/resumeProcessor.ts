import Queue from "bull";
import { prisma } from "../prisma/client";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";
import { createAIProvider } from "../ai/providers";
import { aiConfig } from "../ai/config";
import { parseResumePrompt } from "../ai/prompts";

// Create AI provider instance
const aiProvider = createAIProvider(aiConfig);

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
  resumeId: string;
}

async function extractPdfText(filePath: string): Promise<string> {
  try {
    console.log(`Extracting text from PDF: ${filePath}`);

    // Read the file
    const dataBuffer = await fs.readFile(filePath);

    // Parse the PDF
    const data = await pdfParse(dataBuffer);

    console.log(
      `Successfully extracted ${data.text.length} characters from PDF`
    );
    return data.text;
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

// Parse resume text using configured AI provider
async function parseResume(extractedText: string): Promise<any> {
  try {
    const prompt = parseResumePrompt(extractedText);
    return await aiProvider.completion(prompt);
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw new Error("Failed to parse resume");
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

    // Parse resume with GPT
    let structuredData = null;
    try {
      structuredData = await parseResume(extractedText);
      await job.progress(75);
    } catch (error) {
      console.error("GPT parsing error:", error);
      // Continue with the process even if GPT parsing fails
    }

    // Create candidate and resume records
    const candidate = await prisma.candidate.create({
      data: {
        sessionId,
        resumes: {
          create: {
            filePath,
            extractedText,
            structuredData,
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
