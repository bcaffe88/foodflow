// Enhanced Error Handler Middleware
// Structured error logging and responses

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Custom error class
 */
export class APIError extends Error implements AppError {
  status: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Error logging with structured format
 */
export function logError(error: Error, context?: Record<string, any>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    code: (error as AppError).code,
    status: (error as AppError).status,
    context
  };

  console.error('[ERROR]', JSON.stringify(errorLog, null, 2));
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = err as AppError;

  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal server error';

  // Log error with context
  logError(error, {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    ip: req.ip
  });

  // Send error response
  res.status(status).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      ...(error.details && { details: error.details })
    }
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.path} not found`
    }
  });
}

/**
 * Async error wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
