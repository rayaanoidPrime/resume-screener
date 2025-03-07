import express from "express";
import dotenv from "dotenv";
import { prisma } from "./prisma/client";
import authRoutes from "./routes/auth";
import sessionRoutes from "./routes/sessions";
import resumeRoutes from "./routes/resumes";
import cors from "cors";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
//cors
app.use(cors());

// Ensure uploads directory exists
import { mkdirSync } from "fs";
try {
  mkdirSync("uploads");
} catch (error) {
  // Directory already exists
}

// Routes
app.use("/auth", authRoutes);
app.use("/sessions", sessionRoutes);
app.use("/sessions", resumeRoutes); // Mount on /sessions for /sessions/:sessionId/resumes

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "Server is running" });
  } catch (error) {
    console.error("Health check failed:", error);
    res
      .status(500)
      .json({ status: "Server is running but database connection failed" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
