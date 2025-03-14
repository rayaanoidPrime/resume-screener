import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { prisma } from "./prisma/client";
import authRoutes from "./routes/auth";
import sessionRoutes from "./routes/sessions";
import resumeRoutes from "./routes/resumes";
import notesRoutes from "./routes/notes";
import cors from "cors";
import { errorLogger, errorResponder } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/sessions", resumeRoutes);
app.use("/sessions", sessionRoutes);
app.use("/notes", notesRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorLogger(err, req, res, next);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorResponder(err, req, res, next);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
