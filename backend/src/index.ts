import express from "express";
import dotenv from "dotenv";
import { prisma } from "./prisma/client";
import authRoutes from "./routes/auth";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

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
