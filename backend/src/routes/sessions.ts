import { Router } from "express";
import { prisma } from "../prisma/client";
import { authenticateToken } from "../middleware/auth";

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

export default router;
