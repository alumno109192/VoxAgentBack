import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuthRequest } from './auth';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const isOperational = (err as AppError).isOperational || false;

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    userId: req.userId,
    tenantId: req.tenantId,
  });

  // Don't leak error details in production for non-operational errors
  const message =
    isOperational || process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error';

  res.status(statusCode).json({
    error: message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};
