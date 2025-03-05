import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export class ValidationError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error("Server Error:", err);

  // Check for MongoDB duplicate key error
  if (err.message && err.message.includes("E11000 duplicate key error")) {
    // Extract the field name from the error message
    const fieldMatch = err.message.match(/index:\s+(\w+)_1/);
    const field = fieldMatch ? fieldMatch[1] : "email";

    // Create a more user-friendly error
    err = new ValidationError(`${field} already exists`);
  }

  // Check for Apollo-specific errors that might contain a wrapped error
  if (err.originalError) {
    err = err.originalError;
  }

  // Determine the status code
  const statusCode = err.statusCode || 500;

  // Prepare the error message based on environment
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  // Prepare error response
  const errorResponse: any = {
    error: {
      message,
      code: err.name || "Error",
    },
  };

  // Add stack trace in non-production environments
  if (process.env.NODE_ENV !== "production") {
    errorResponse.error.stack = err.stack;
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
};
