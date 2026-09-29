import { NextFunction, Request, Response } from 'express';
import { AppError } from '../core/errors/app-error';

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handled Domain & Application Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // 2. Express JSON Parsing Syntax Error
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Malformed JSON payload.',
      },
    });
    return;
  }

  // 3. Unhandled Server Errors (mask internal details, never leak stack trace)
  console.error('[ERROR] Unhandled server error:', err.message);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred on the server.',
    },
  });
}

export function notFoundHandlerMiddleware(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested route does not exist.',
    },
  });
}
