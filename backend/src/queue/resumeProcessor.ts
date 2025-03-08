import Queue from "bull";
import { prisma } from "../prisma/client";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";
import { createAIProvider } from "../ai/providers";
import { aiConfig } from "../ai/config";
import { parseResumePrompt } from "../ai/prompts";
import { evaluateResume } from "../services/evaluation";

export interface ResumeData {
  contact_info: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    portfolio: string | null;
  };
  summary: string | null;
  experience: {
    company: string;
    title: string;
    dates: string;
    location: string;
    description: string[];
  }[];
  education:
    | {
        institution: string;
        degree: string;
        field: string;
        dates: string;
        gpa: string | null;
      }[]
    | null; // Allow null if education is unavailable
  skills: {
    programming_languages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
  };
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link: string;
  }[];
  languages: {
    language: string;
    proficiency: string;
  }[];
  additional: Record<string, string | string[]> | null; // Allow flexible additional data
  confidence: {
    contact_info: "high" | "medium" | "low";
    summary: "high" | "medium" | "low";
    experience: "high" | "medium" | "low";
    education: "high" | "medium" | "low";
    skills: "high" | "medium" | "low";
    certifications: "high" | "medium" | "low";
    projects: "high" | "medium" | "low";
    languages: "high" | "medium" | "low";
    additional: "high" | "medium" | "low";
  };
}

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
async function parseResume(extractedText: string): Promise<ResumeData> {
  try {
    const prompt = parseResumePrompt(extractedText);
    const response = await aiProvider.completion(
      prompt,
      "You are an expert resume parser that outputs only valid JSON."
    );

    try {
      // Clean up the response by removing markdown code blocks if present
      const cleanedResponse =
        typeof response === "string"
          ? response.replace(/^```json\s*|\s*```$/g, "").trim()
          : response;

      return JSON.parse(cleanedResponse) as ResumeData;
    } catch (error) {
      console.error("JSON parsing error:", error);
      console.error("Raw response:", response);
      throw new Error("Failed to parse resume");
    }
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

    // Update progress to 40%
    await job.progress(40);

    // Parse resume with GPT
    let structuredData: ResumeData | null = null;
    try {
      structuredData = await parseResume(extractedText);
      await job.progress(60);

      if (!structuredData) {
        throw new Error("Failed to parse structured data from resume");
      }
    } catch (error) {
      console.error("Resume parsing error:", error);
      // Continue with the process even if GPT parsing fails
    }

    // Get session's job description for evaluation
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { jobDescription: true },
    });

    if (!session?.jobDescription) {
      throw new Error("Session or job description not found");
    }

    if (!structuredData) {
      throw new Error("Structured data not found");
    }

    // Evaluate resume
    const { keywordScore, qualitativeScore, totalScore } = await evaluateResume(
      session.jobDescription,
      extractedText,
      structuredData
    );

    // Update progress to 80%
    await job.progress(80);

    // Create candidate and resume records
    const candidate = await prisma.candidate.create({
      data: {
        sessionId,
        resumes: {
          create: {
            filePath,
            extractedText,
            structuredData: structuredData as any, // Type cast to fix Prisma JSON compatibility
            status:
              extractedText.length > 0 && structuredData
                ? "processed"
                : "needs_review",
          },
        },
      },
      include: {
        resumes: {
          take: 1,
        },
      },
    });

    // Create evaluation record
    const evaluation = await prisma.evaluation.create({
      data: {
        resumeId: candidate.resumes[0].id,
        keywordScore,
        qualitativeScore,
        totalScore,
      },
    });

    // Update progress to 100%
    await job.progress(100);

    return {
      candidateId: candidate.id,
      resumeId: candidate.resumes[0].id,
      status:
        extractedText.length > 0 && structuredData
          ? "processed"
          : "needs_review",
      keywordScore: evaluation.keywordScore,
      totalScore: evaluation.totalScore,
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
