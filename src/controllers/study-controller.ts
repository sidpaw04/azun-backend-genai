// src/controllers/study-controller.ts
import { Request, Response, NextFunction } from 'express';
import * as studyService from '../services/study-service';
import { IServiceParams, HttpError } from '../model';

function validateContentRequestParams(req: Request): void {
    const { title, description, id: topicId } = req.body;
    if (!title || !description || !topicId) {
        throw new HttpError('title, description, and topicId are required', 400);
    }
}

export async function generateOrGetStudy(req: Request, res: Response, next: NextFunction) {
    try {
        validateContentRequestParams(req);
        const { title, description, level, id: topicId, confidence } = req.body;
        const params: IServiceParams = { title, description, level, topicId, confidence };

        const studyResponse = await studyService.getOrCreateStudyContent(params);

        if (studyResponse.warning) {
            return res.status(200).json({ success: true, study: studyResponse.content, warning: studyResponse.warning });
        }
        res.status(200).json({ success: true, study: studyResponse.content });
    } catch (error) {
        next(error);
    }
}

export async function getStudyById(req: Request, res: Response, next: NextFunction) {
    try {
        const { topicId } = req.params;
        const studyContent = await studyService.getStudyContentById(topicId);

        if (!studyContent) {
            throw new HttpError('Study material not found', 404);
        }
        res.status(200).json({ success: true, study: studyContent });
    } catch (error) {
        next(error);
    }
}