import { Response } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, `${resource} not found${id ? `: ${id}` : ""}`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super(500, message, "INTERNAL_SERVER_ERROR", details);
    this.name = "InternalServerError";
  }
}

export function handleError(error: unknown, res: Response) {
  // Log error
  console.error("[ERROR]", {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  });

  // Handle known errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code || "UNKNOWN_ERROR",
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: (error as { issues: unknown[] }).issues,
      },
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    },
  });
}






