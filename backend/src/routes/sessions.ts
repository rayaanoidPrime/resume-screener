import { Request, Response, Router, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "User ID not found" });
      return;
    }

    const sessionData = req.body;

    // Validate required fields
    if (
      !sessionData.jobTitle ||
      !sessionData.jobDescription ||
      !sessionData.requiredSkills ||
      !sessionData.responsibilities ||
      sessionData.minExperience === undefined ||
      sessionData.maxExperience === undefined
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const userExists = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!userExists) {
      console.log(`User with ID ${req.user.id} not found`);
      res.status(404).json({ error: "User not found" });
      return;
    }

    const session = await prisma.session.create({
      data: {
        userId: req.user.id,
        ...sessionData,
      },
    });

    // Create default buckets
    const defaultBuckets = ["Excellent", "Good", "No Go"];
    for (const name of defaultBuckets) {
      await prisma.bucket.create({
        data: {
          name,
          sessionId: session.id,
          isDefault: true,
        },
      });
    }

    res.status(201).json(session);
  } catch (error) {
    console.error("Session creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all buckets for a session
router.get(
  "/:sessionId/buckets",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: req.user?.id },
      });
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const buckets = await prisma.bucket.findMany({ where: { sessionId } });
      res.json(buckets);
    } catch (error) {
      console.error("Bucket retrieval error:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error: Bucket retrieval error" });
    }
  }
);

// create a bucket
router.post(
  "/:sessionId/buckets",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "User ID not found" });
        return;
      }

      const sessionId = req.params.sessionId;
      const { name } = req.body;
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: req.user.id },
      });
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const bucket = await prisma.bucket.create({
        data: { name, sessionId, isDefault: false },
      });
      res.status(201).json(bucket);
    } catch (error) {
      console.error("Bucket creation error:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error: Bucket creation error" });
    }
  }
);

// Update the bucket of a candidate
router.put(
  "/candidates/:candidateId/bucket",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "User ID not found" });
        return;
      }

      const { candidateId } = req.params;
      const { bucketId } = req.body;

      // find candidate with id
      const candidate = await prisma.candidate.findFirst({
        where: { id: candidateId },
        include: { session: true },
      });
      if (!candidate || candidate.session.userId !== req.user.id) {
        res.status(404).json({ error: "Candidate not found" });
        return;
      }

      // find bucket with id
      const bucket = await prisma.bucket.findFirst({
        where: { id: bucketId, sessionId: candidate.sessionId },
      });
      if (!bucket) {
        res.status(400).json({ error: "Invalid bucket" });
        return;
      }

      const updatedCandidate = await prisma.candidate.update({
        where: { id: candidateId },
        data: { bucketId },
        include: { bucket: true },
      });
      res.status(200).json(updatedCandidate);
    } catch (error) {
      console.error("Bucket update error:", error);
      res
        .status(500)
        .json({ error: "Internal server error: Bucket update error" });
    }
  }
);

// Get all candidates for a session
router.get(
  "/:sessionId/candidates",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.sessionId;
      const candidates = await prisma.candidate.findMany({
        where: { sessionId },
        include: {
          resumes: { include: { evaluation: true } },
          bucket: true,
          notes: true,
        },
      });
      res.status(200).json(candidates);
    } catch (error) {
      console.error("Candidates retrieval error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get ranked list of candidates/resumes for a session
router.get("/:sessionId/rankings", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session to verify it exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Get all evaluated resumes for the session with their evaluations
    const evaluatedResumes = await prisma.resume.findMany({
      where: {
        candidate: { sessionId },
        status: "processed",
        evaluation: { isNot: null }, // Only get evaluated resumes
      },
      include: {
        candidate: true,
        evaluation: true,
      },
      orderBy: {
        evaluation: {
          totalScore: "desc", // Sort by total score descending
        },
      },
    });

    // Format the response
    const rankings = evaluatedResumes.map((resume) => ({
      resumeId: resume.id,
      candidateId: resume.candidateId,
      filePath: resume.filePath,
      scores: {
        keywordScore: resume.evaluation?.keywordScore || 0,
        totalScore: resume.evaluation?.totalScore || 0,
      },
      structuredData: resume.structuredData,
    }));

    res.status(200).json(rankings);
  } catch (error) {
    console.error("Rankings retrieval error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get session details
router.get("/:sessionId", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Check if user has access to this session
    if (session.userId !== req.user?.id) {
      res.status(403).json({ error: "Unauthorized access to session" });
      return;
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Session retrieval error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all sessions for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "User ID not found" });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Sessions retrieval error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get resume details
router.get(
  "/:sessionId/resumes/:resumeId",
  authenticateToken,
  async (req, res) => {
    try {
      const { sessionId, resumeId } = req.params;

      // First check if the session exists and belongs to the user
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (session.userId !== req.user?.id) {
        res.status(403).json({ error: "Unauthorized access to session" });
        return;
      }

      // Get resume with its evaluation
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          evaluation: true,
        },
      });

      if (!resume) {
        res.status(404).json({ error: "Resume not found" });
        return;
      }

      // Determine mimeType from filePath
      const mimeType = resume.filePath.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : resume.filePath.toLowerCase().endsWith(".doc")
        ? "application/msword"
        : resume.filePath.toLowerCase().endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/octet-stream";

      // Format the response
      const response = {
        filePath: resume.filePath,
        extractedText: resume.extractedText || "",
        mimeType,
        structuredData: resume.structuredData,
        metricScores: {
          keywordScore: resume.evaluation?.keywordScore || 0,
          totalScore: resume.evaluation?.totalScore || 0,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Resume details retrieval error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete a bucket
router.delete(
  "/:sessionId/buckets/:bucketId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "User ID not found" });
        return;
      }

      const { sessionId, bucketId } = req.params;

      // Verify session exists and belongs to user
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: req.user.id },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Check if bucket exists and belongs to session
      const bucket = await prisma.bucket.findFirst({
        where: { id: bucketId, sessionId },
      });

      if (!bucket) {
        res.status(404).json({ error: "Bucket not found" });
        return;
      }

      // Don't allow deletion of default buckets
      if (bucket.isDefault) {
        res.status(400).json({ error: "Cannot delete default buckets" });
        return;
      }

      // Move all candidates from the bucket being deleted to their original buckets
      await prisma.$executeRaw`
        UPDATE "Candidate"
        SET "bucketId" = "originalBucketId"
        WHERE "bucketId" = ${bucketId}
      `;

      // Delete the bucket
      await prisma.bucket.delete({
        where: { id: bucketId },
      });

      // Return updated candidates
      const candidates = await prisma.candidate.findMany({
        where: { sessionId },
        include: {
          resumes: { include: { evaluation: true } },
          bucket: true,
        },
      });

      res
        .status(200)
        .json({ message: "Bucket deleted successfully", candidates });
    } catch (error) {
      console.error("Bucket deletion error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Reset all candidates to original buckets
router.post(
  "/:sessionId/buckets/reset",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "User ID not found" });
        return;
      }

      const { sessionId } = req.params;

      // Verify session exists and belongs to user
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: req.user.id },
      });

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Alternative solution
      await prisma.$executeRaw`
        UPDATE "Candidate"
        SET "bucketId" = "originalBucketId"
        WHERE "sessionId" = ${sessionId}
      `;

      // Then fetch the updated candidates
      const candidates = await prisma.candidate.findMany({
        where: { sessionId },
        include: {
          resumes: { include: { evaluation: true } },
          bucket: true,
          notes: true,
        },
      });

      res.status(200).json(candidates);
    } catch (error) {
      console.error("Reset candidates error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
