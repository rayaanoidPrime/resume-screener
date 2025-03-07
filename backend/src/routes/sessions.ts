import { Router } from "express";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";
import { evaluateResume } from "../services/evaluation";

const router = Router();

router.post("/", authenticateToken, (req, res) => {
  const { jobDescription } = req.body;
  const userId = req.user?.id;

  if (!jobDescription || !userId) {
    res.status(400).json({
      error: !jobDescription
        ? "Job description is required"
        : "User ID not found in token",
    });
  } else {
    prisma.session
      .create({
        data: {
          userId,
          jobDescription,
        },
      })
      .then((session) => {
        res.status(201).json({ sessionId: session.id });
      })
      .catch((error) => {
        console.error("Session creation error:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  }
});

// Evaluate all resumes in a session
router.post("/:sessionId/evaluate", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session with job description
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { jobDescription: true },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Get all resumes for the session
    const resumes = await prisma.resume.findMany({
      where: {
        candidate: { sessionId },
        status: "processed",
      },
      include: {
        candidate: true,
      },
    });

    // Evaluate each resume
    const evaluationPromises = resumes.map(async (resume) => {
      const { keywordScore, totalScore } = evaluateResume(
        session.jobDescription,
        resume.extractedText || ""
      );

      // Create evaluation record
      const evaluation = await prisma.evaluation.create({
        data: {
          candidateId: resume.candidateId,
          keywordScore,
          totalScore,
        },
      });

      return {
        candidateId: resume.candidateId,
        keywordScore,
        totalScore,
      };
    });

    const results = await Promise.all(evaluationPromises);
    res.status(200).json(results);
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
