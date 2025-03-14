import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";
import { resumeQueue } from "../queue/resumeProcessor";
import { uploadFileToS3, generatePresignedUrl } from "../services/s3";
import { ResumeJobData } from "../queue/resumeProcessor";

const router = Router();

// Configure multer for memory storage instead of disk storage
const storage = multer.memoryStorage();

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

// Resume upload endpoint
router.post(
  "/:sessionId/resumes",
  authenticateToken,
  upload.array("files", 100), // Allow up to 100 files
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({ error: "Session ID is required" });
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
        return;
      }

      // Add each file to the processing queue
      const jobPromises = files.map(async (file) => {
        // Upload file to S3
        const s3Key = await uploadFileToS3(
          file.buffer,
          `${uuidv4()}-${file.originalname}`,
          file.mimetype
        );

        // Create a candidate record first
        const candidate = await prisma.candidate.create({
          data: {
            sessionId,
          },
        });

        const session = await prisma.session.findUnique({
          where: {
            id: sessionId,
          },
          select: {
            jobTitle: true,
            jobDescription: true,
            location: true,
            employmentType: true,
            minExperience: true,
            maxExperience: true,
            requiredSkills: true,
            preferredSkills: true,
            responsibilities: true,
            educationRequired: true,
            educationPreferred: true,
          },
        });

        if (!session) {
          throw new Error("Session not found");
        }

        // Create a resume record with S3 key instead of local file path
        const resume = await prisma.resume.create({
          data: {
            candidateId: candidate.id,
            filePath: s3Key, // Store S3 key instead of local file path
            status: "processing",
          },
        });

        const job = await resumeQueue.add({
          job: {
            title: session.jobTitle,
            description: session.jobDescription,
            location: session.location,
            employmentType: session.employmentType,
            minExperience: session.minExperience,
            maxExperience: session.maxExperience,
            requiredSkills: session.requiredSkills,
            preferredSkills: session.preferredSkills,
            responsibilities: session.responsibilities,
            educationRequired: session.educationRequired,
            educationPreferred: session.educationPreferred,
          },
          s3Key, // Pass S3 key instead of file path
          sessionId,
          mimeType: file.mimetype,
          resumeId: resume.id,
        });

        return {
          jobId: job.id,
          resumeId: resume.id,
          s3Key,
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
          resumeId: r.resumeId,
          s3Key: r.s3Key,
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
      console.log("Received status request:", {
        sessionId: req.params.sessionId,
        jobIds: req.query.jobIds,
      });

      const { jobIds } = req.query;
      const { sessionId } = req.params;

      if (!jobIds || typeof jobIds !== "string" || !sessionId) {
        res.status(400).json({ error: "Job IDs and Session ID are required" });
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
