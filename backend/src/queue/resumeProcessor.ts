import Queue from "bull";
import { prisma } from "../prisma/client";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { createAIProvider } from "../ai/providers";
import { aiConfig } from "../ai/config";
import { parseResumePrompt } from "../ai/prompts";
import { evaluateResume } from "../services/evaluation";
import { getFileFromS3 } from "../services/s3";

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
export interface ResumeJobData {
  s3Key: string;
  sessionId: string;
  mimeType: string;
  resumeId: string;
  job: {
    title: string;
    description: string;
    location: string;
    employmentType: string;
    minExperience: number;
    maxExperience: number;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    educationRequired: string[];
    educationPreferred: string[];
  };
}

async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  try {
    console.log("Extracting text from PDF buffer");

    // Parse the PDF buffer
    const data = await pdfParse(fileBuffer);

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
async function extractDocxText(fileBuffer: Buffer): Promise<string> {
  try {
    // Ensure we have a valid buffer
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error("Invalid file data: not a buffer");
    }

    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX");
  }
}

// Parse resume text using configured AI provider
async function parseResume(
  extractedText: string,
  jobData: ResumeJobData["job"]
): Promise<ResumeData> {
  try {
    const prompt = parseResumePrompt(extractedText, jobData);
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
  const {
    s3Key,
    sessionId,
    mimeType,
    job: jobData,
  } = job.data as ResumeJobData;

  try {
    // Update progress to 25%
    await job.progress(25);

    // Get file from S3
    let fileBuffer: Buffer;
    try {
      fileBuffer = await getFileFromS3(s3Key);
    } catch (error: any) {
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }

    // Extract text based on file type
    let extractedText = "";
    try {
      if (mimeType === "application/pdf") {
        extractedText = await extractPdfText(fileBuffer);
      } else {
        extractedText = await extractDocxText(fileBuffer);
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
      structuredData = await parseResume(extractedText, jobData);
      await job.progress(60);

      if (!structuredData) {
        throw new Error("Failed to parse structured data from resume");
      }
    } catch (error) {
      console.error("Resume parsing error:", error);
      // Continue with the process even if GPT parsing fails
    }

    if (!structuredData) {
      throw new Error("Structured data not found");
    }

    // Evaluate resume
    const { keywordScore, qualitativeScore, totalScore } = await evaluateResume(
      jobData,
      extractedText,
      structuredData
    );

    // Fetch default buckets
    const excellentBucket = await prisma.bucket.findFirst({
      where: { sessionId: sessionId, name: "Excellent" },
    });
    const goodBucket = await prisma.bucket.findFirst({
      where: { sessionId: sessionId, name: "Good" },
    });
    const noGoBucket = await prisma.bucket.findFirst({
      where: { sessionId: sessionId, name: "No Go" },
    });

    if (!excellentBucket || !goodBucket || !noGoBucket) {
      throw new Error("Default buckets not found");
    }

    // Assign bucket based on totalScore
    let bucketId;
    if (totalScore >= 0.8) {
      bucketId = excellentBucket.id;
    } else if (totalScore >= 0.5) {
      bucketId = goodBucket.id;
    } else {
      bucketId = noGoBucket.id;
    }

    // Update progress to 80%
    await job.progress(80);

    // Update the existing resume instead of creating a new one
    const updatedResume = await prisma.resume.update({
      where: {
        id: job.data.resumeId,
      },
      data: {
        extractedText,
        structuredData: structuredData as any,
        status:
          extractedText.length > 0 && structuredData
            ? "processed"
            : "needs_review",
      },
    });

    // Update candidate with current original bucket assignment
    await prisma.candidate.update({
      where: { id: updatedResume.candidateId },
      data: { bucketId, originalBucketId: bucketId },
    });

    // Create evaluation record
    const evaluation = await prisma.evaluation.create({
      data: {
        resumeId: updatedResume.id,
        keywordScore,
        qualitativeScore,
        totalScore,
      },
    });

    // Update progress to 100%
    await job.progress(100);

    return {
      resumeId: updatedResume.id,
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
