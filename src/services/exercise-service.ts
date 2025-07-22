// src/services/exercise-service.ts
import { ContentRepository } from '../data/content-repository';
import { ContentCacheManager } from './content-cache-manager';
import { ContentGenerator } from './content-generator';
import { ExerciseParser } from '../processors';
import { generateExercisePrompt } from '../prompts/exercise-prompts';

import {
    IExercise,
    IServiceParams,
    IServiceContentResponse,
    HttpError,
    IFirestoreContentDocument,
    IContentMetadata
} from '../model';

const exerciseRepository = new ContentRepository('exercises');
const EXERCISE_TYPE = 'exercise';
const exerciseParser = new ExerciseParser();
const exerciseContentGenerator = new ContentGenerator(exerciseParser);

export async function getExerciseContentById(topicId: string): Promise<IExercise[] | null> {
    const doc = await exerciseRepository.getById(topicId);
    return doc ? (doc.content as IExercise[]) : null;
}

export async function saveExerciseContent(
    topicId: string,
    exerciseData: IExercise[],
    params: IServiceParams
): Promise<void> {
    const newMetadata: IContentMetadata = ContentCacheManager.createNewMetadata(params);
    await exerciseRepository.save(topicId, exerciseData, newMetadata);
}

async function generateNewExerciseContent(params: IServiceParams): Promise<IExercise[]> {
    const prompt = generateExercisePrompt(params.title, params.description, params.level);
    console.log('Generated prompt for AI call:', prompt);
    return await exerciseContentGenerator.generateAndParse(prompt) as IExercise[];
}

function handleExerciseGenerationError(error: any, cachedDoc: IFirestoreContentDocument | null): IServiceContentResponse<IExercise[]> {
    console.error(`Error in exerciseService during generation:`, error);
    if (cachedDoc) {
        console.warn("AI API call failed, returning stale cached exercise.");
        return { content: cachedDoc.content as IExercise[], warning: "AI API call failed, served stale data." };
    }
    throw error;
}

async function generateAndSaveNewExercise(
    params: IServiceParams,
    cachedDoc: IFirestoreContentDocument | null
): Promise<IServiceContentResponse<IExercise[]>> {
    try {
        const newContent = await generateNewExerciseContent(params);
        await saveExerciseContent(params.topicId, newContent, params);
        return { content: newContent };
    } catch (error: any) {
        return handleExerciseGenerationError(error, cachedDoc);
    }
}

export async function getOrCreateExerciseContent(
    params: IServiceParams
): Promise<IServiceContentResponse<IExercise[]>> {
    const cachedDoc = await exerciseRepository.getById(params.topicId);
    const shouldRegenerate = ContentCacheManager.shouldRegenerate(cachedDoc?._metadata, params.confidence);

    if (!shouldRegenerate && cachedDoc) {
        return { content: cachedDoc.content as IExercise[] };
    }

    return await generateAndSaveNewExercise(params, cachedDoc);
}