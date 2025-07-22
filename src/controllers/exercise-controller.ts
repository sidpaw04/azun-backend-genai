// src/controllers/exercise-controller.ts
import { Request, Response, NextFunction } from 'express';
import * as exerciseService from '../services/exercise-service';
import { IServiceParams, HttpError } from '../model';

function validateContentRequestParams(req: Request): void {
    const { title, description, id: topicId } = req.body;
    if (!title || !description || !topicId) {
        throw new HttpError('title, description, and topicId are required', 400);
    }
}

export async function generateOrGetExercise(req: Request, res: Response, next: NextFunction) {
    try {
        validateContentRequestParams(req);
        const { title, description, level, id: topicId, confidence } = req.body;
        const params: IServiceParams = { title, description, level, topicId, confidence };

        const exerciseResponse = await exerciseService.getOrCreateExerciseContent(params);

        if (exerciseResponse.warning) {
            return res.status(200).json({ success: true, exercise: exerciseResponse.content, warning: exerciseResponse.warning });
        }
        res.status(200).json({ success: true, exercise: exerciseResponse.content });
    } catch (error) {
        next(error);
    }
}

export async function getExerciseById(req: Request, res: Response, next: NextFunction) {
    try {
        const { topicId } = req.params;
        const exerciseContent = await exerciseService.getExerciseContentById(topicId);

        if (!exerciseContent) {
            throw new HttpError('Exercise not found', 404);
        }
        res.status(200).json({ success: true, exercise: exerciseContent });
    } catch (error) {
        next(error);
    }
}