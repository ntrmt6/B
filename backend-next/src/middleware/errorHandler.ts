import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom application error with status code and error code support.
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware.
 * Differentiates between operational errors (client/server known errors)
 * and unexpected errors. Handles Zod validation errors and Mongoose errors.
 */
export const errorHandler = (err: Error & { statusCode?: number; code?: string | number }, req: Request, res: Response, _next: NextFunction) => {
  // Log error with request context
  console.error(`[backend] Error on ${req.method} ${req.path}:`, {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Already sent response — nothing to do
  if (res.headersSent) {
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Known operational errors (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Data validation failed',
      code: 'MONGOOSE_VALIDATION_ERROR',
      details: err.message,
    });
  }

  // Mongoose cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid data format',
      code: 'CAST_ERROR',
    });
  }

  // Mongoose duplicate key errors
  if (typeof err.code === 'number' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      code: 'DUPLICATE_KEY',
    });
  }

  // Default: unexpected errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR',
  });
};
