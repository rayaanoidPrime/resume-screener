import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import fs from "fs/promises";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";
import { resumeQueue } from "../queue/resumeProcessor";

const router = Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

// Set up pdfjs worker (required for Node.js environment)
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  "node_modules/pdfjs-dist/build/pdf.worker.mjs"
);

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and DOCX files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Extract text from PDF
async function extractPdfText(filePath: string): Promise<string> {
  // Read the file as a buffer
  const buffer = await fs.readFile(filePath);

  // Convert Buffer to Uint8Array (this is what pdfjs-dist requires)
  const data = new Uint8Array(buffer);

  // Load the PDF document
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let fullText = "";

  // Process each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Extract text from the content items
    const pageText = textContent.items
      .filter((item) => "str" in item)
      .map((item) => (item as any).str)
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText.trim();
}

// Extract text from DOCX
async function extractDocxText(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim();
}

// Resume upload endpoint
router.post(
  "/:sessionId/resumes",
  authenticateToken,
  upload.array("files", 10), // Allow up to 10 files
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
        return;
      }

      // Add each file to the processing queue
      const jobPromises = files.map(async (file) => {
        // Ensure file path is absolute
        const absolutePath = path.resolve(file.path);

        const job = await resumeQueue.add({
          filePath: absolutePath,
          sessionId,
          mimeType: file.mimetype,
        });
        return {
          jobId: job.id,
          filePath: file.path, // Keep relative path for response
          mimeType: file.mimetype,
        };
      });

      const results = await Promise.all(jobPromises);
      const jobIds = results.map((r) => r.jobId);

      res.status(202).json({
        message: "Files uploaded and processing started",
        jobIds,
        files: results.map((r) => ({
          jobId: r.jobId,
          filePath: r.filePath,
          mimeType: r.mimeType,
        })),
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get job status endpoint
router.get(
  "/:sessionId/resumes/status",
  authenticateToken,
  async (req, res) => {
    try {
      const { jobIds } = req.query;

      if (!jobIds || typeof jobIds !== "string") {
        res.status(400).json({ error: "Job IDs are required" });
        return;
      }

      const jobIdArray = jobIds.split(",");
      const statuses: Record<string, string> = {};

      for (const jobId of jobIdArray) {
        const job = await resumeQueue.getJob(jobId);

        if (!job) {
          statuses[jobId] = "not_found";
          continue;
        }

        const state = await job.getState();
        statuses[jobId] = state;
      }

      res.status(200).json(statuses);
    } catch (error) {
      console.error("Error fetching job statuses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update resume endpoint
router.patch("/resumes/:resumeId", authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { extractedText } = req.body;

    if (!extractedText) {
      res.status(400).json({ error: "extractedText is required" });
      return;
    }

    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        extractedText,
        status: "processed",
      },
      select: {
        id: true,
        extractedText: true,
        status: true,
      },
    });

    res.status(200).json(updatedResume);
  } catch (error: any) {
    console.error("Resume update error:", error);
    if (error.code === "P2025") {
      res.status(404).json({ error: "Resume not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
