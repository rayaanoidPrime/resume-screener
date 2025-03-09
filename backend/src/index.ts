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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ensure uploads directory exists
import { mkdirSync } from "fs";
import { errorLogger, errorResponder } from "./middleware/errorHandler";
try {
  mkdirSync("uploads");
} catch (error) {
  // Directory already exists
}

// Routes
app.use("/auth", authRoutes);
app.use("/sessions", resumeRoutes); // Mount resume routes first
app.use("/sessions", sessionRoutes); // Then mount session routes

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

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    errorLogger(err, req, res, next);
    errorResponder(err, req, res, next);
  }
);

// Global error handler for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  console.error("Stack:", error.stack);
  // Graceful shutdown
  process.exit(1);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
