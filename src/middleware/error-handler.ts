// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../model/error/HttpError';

function errorHandler(err: Error | HttpError, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack); // Log the full error stack for debugging

    const statusCode = (err instanceof HttpError) ? err.statusCode : 500;
    const message = err.message || 'An unexpected error occurred on the server.';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

export { errorHandler };