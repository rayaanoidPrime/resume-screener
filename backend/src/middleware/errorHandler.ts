import { Request, Response, NextFunction } from "express";

export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);
  console.error("Stack:", err.stack);
  next(err);
};

export const errorResponder = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for specific error types and send appropriate responses
  if (
    err.name === "TypeError" &&
    err.message.includes("expected blob, string or buffer")
  ) {
    return res.status(400).json({
      error: "Invalid data format provided",
      message:
        "The server received data in an unexpected format. Please check your request.",
    });
  }

  // Default error response
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
};
