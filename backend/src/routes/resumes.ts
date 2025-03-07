import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import fs from "fs/promises";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";

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
  upload.single("resume"),
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Extract text based on file type
      let extractedText = "";
      try {
        if (file.mimetype === "application/pdf") {
          extractedText = await extractPdfText(file.path);
        } else {
          extractedText = await extractDocxText(file.path);
        }
      } catch (error) {
        console.error("Text extraction error:", error);
      }

      // Create candidate and resume records
      const candidate = await prisma.candidate.create({
        data: {
          sessionId,
          resumes: {
            create: {
              filePath: file.path,
              extractedText,
              status: extractedText ? "processed" : "review_needed",
            },
          },
        },
        include: {
          resumes: true,
        },
      });

      const resume = candidate.resumes[0];
      res.status(200).json({
        resumeId: resume.id,
        extractedText: resume.extractedText,
        status: resume.status,
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
