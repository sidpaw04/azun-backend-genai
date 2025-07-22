// src/middleware/globalMiddleware.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Application } from 'express'; // Import Application type

/**
 * Applies global middleware to the Express application.
 * This includes JSON parsing, URL-encoded parsing, CORS, and security headers.
 * @param {Application} app - The Express application instance.
 */
export function applyGlobalMiddleware(app: Application): void {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.use(helmet());
}