// src/controllers/quiz-controller.ts
import { Request, Response, NextFunction } from 'express';
import * as quizService from '../services/quiz-service'; // Use * as to import all exports
import { IServiceParams, HttpError } from '../model';

/**
 * Validates essential request body parameters for content generation.
 * @param {Request} req - Express request object.
 * @throws {HttpError} If required parameters are missing.
 */
function validateContentRequestParams(req: Request): void {
    const { title, description, id: topicId } = req.body;
    if (!title || !description || !topicId) {
        throw new HttpError('title, description, and topicId are required', 400);
    }
}

/**
 * Handles POST request to generate or retrieve a quiz.
 * Orchestrates validation and service call, sends response.
 */
export async function generateOrGetQuiz(req: Request, res: Response, next: NextFunction) {
    try {
        validateContentRequestParams(req);
        const { title, description, level, id: topicId, confidence } = req.body;
        const params: IServiceParams = { title, description, level, topicId, confidence };

        const quizResponse = await quizService.getOrCreateQuizContent(params);

        if (quizResponse.warning) {
            return res.status(200).json({ success: true, quiz: quizResponse.content, warning: quizResponse.warning });
        }
        res.status(200).json({ success: true, quiz: quizResponse.content });
    } catch (error) {
        next(error); // Pass error to global error handler
    }
}

/**
 * Handles GET request to retrieve a specific quiz by topicId.
 * Delegates to service, handles not found.
 */
export async function getQuizById(req: Request, res: Response, next: NextFunction) {
    try {
        const { topicId } = req.params;
        const quizContent = await quizService.getQuizContentById(topicId);

        if (!quizContent) {
            throw new HttpError('Quiz not found', 404);
        }
        res.status(200).json({ success: true, quiz: quizContent });
    } catch (error) {
        next(error);
    }
}