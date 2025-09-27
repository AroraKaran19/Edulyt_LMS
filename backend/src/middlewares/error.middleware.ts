import { Request, Response, NextFunction, response } from "express";
import { MongoError } from "mongodb";
import { Error as MongooseError } from "mongoose";

// Define error types for better error handling
interface CustomError extends Error {
  statusCode?: number;
  code?: string | number;
  keyValue?: any;
  errors?: any;
  path?: string;
  value?: any;
}

// Standard error response interface
interface ErrorResponse {
  success: boolean;
  error: {
    message: string;
    type: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path: string;
  };
}

/**
 * Global error handling middleware
 * Catches all errors and formats them into consistent responses
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === "development") {
    console.error("Error Details:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Invalid resource ID format";
    error = {
      ...error,
      message,
      statusCode: 400,
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const message = `Duplicate value for ${field}. This ${field} already exists.`;
    error = {
      ...error,
      message,
      statusCode: 400,
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(", ");
    error = {
      ...error,
      message: message || "Validation failed",
      statusCode: 400,
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please log in again.";
    error = {
      ...error,
      message,
      statusCode: 401,
    };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired. Please log in again.";
    error = {
      ...error,
      message,
      statusCode: 401,
    };
  }

  // MongoDB connection errors
  if (err.name === "MongoNetworkError" || err.name === "MongoTimeoutError") {
    const message = "Database connection error. Please try again later.";
    error = {
      ...error,
      message,
      statusCode: 503,
    };
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File size too large. Please upload a smaller file.";
    error = {
      ...error,
      message,
      statusCode: 413,
    };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Unexpected file field. Please check your file upload.";
    error = {
      ...error,
      message,
      statusCode: 400,
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = "Too many requests. Please try again later.";
    error = {
      ...error,
      message,
      statusCode: 429,
    };
  }

  // Default error handling
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Determine error type
  let errorType = "ServerError";
  if (statusCode >= 400 && statusCode < 500) {
    errorType = "ClientError";
  } else if (statusCode >= 500) {
    errorType = "ServerError";
  }

  // Create standardized error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      type: errorType,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(process.env.NODE_ENV === "development" && {
        details: {
          stack: err.stack,
          name: err.name,
          ...(err.errors && { validationErrors: err.errors }),
        },
      }),
    },
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
  error.statusCode = 404;
  next(error);
};

/**
 * Create custom error with status code
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Success response helper
 */
export const sendSuccessResponse = (
  res: Response,
  data: any,
  message: string = "Success",
  statusCode: number = 200
) => {

  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export default errorHandler;
