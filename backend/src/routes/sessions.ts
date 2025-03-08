import { Request, Response, Router } from "express";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "User ID not found" });
      return;
    }

    const {
      jobTitle,
      department,
      location,
      employmentType,
      experienceLevel,
      jobDescription,
      requiredSkills,
      preferredSkills,
      educationRequired,
      educationPreferred,
      responsibilities,
    } = req.body;

    // Validate required fields
    if (!jobTitle || !jobDescription || !requiredSkills || !responsibilities) {
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
        jobTitle,
        department,
        location,
        employmentType,
        experienceLevel,
        jobDescription,
        requiredSkills,
        preferredSkills,
        educationRequired,
        educationPreferred,
        responsibilities,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error("Session creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

export default router;
