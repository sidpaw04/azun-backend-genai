// src/services/quiz-service.ts
import { ContentRepository } from '../data/content-repository';
import { ContentCacheManager } from './content-cache-manager';
import { ContentGenerator } from './content-generator';
import { QuizParser } from '../processors';
import { generateQuizPrompt } from '../prompts/quiz-prompts';

import {
    IQuizQuestion,
    IServiceParams,
    IServiceContentResponse,
    HttpError,
    IFirestoreContentDocument,
    IContentMetadata
} from '../model';

const quizRepository = new ContentRepository('quizzes');
const QUIZ_TYPE = 'quiz';
const quizParser = new QuizParser();
const quizContentGenerator = new ContentGenerator(quizParser);

/**
 * Retrieves a specific quiz from Firestore.
 * @param {string} topicId - The unique ID of the quiz.
 * @returns {Promise<IQuizQuestion[] | null>} The quiz content or null if not found.
 */
export async function getQuizContentById(topicId: string): Promise<IQuizQuestion[] | null> {
    const doc = await quizRepository.getById(topicId);
    return doc ? (doc.content as IQuizQuestion[]) : null;
}

/**
 * Saves quiz content to Firestore.
 * @param {string} topicId - The unique ID for the quiz.
 * @param {IQuizQuestion[]} quizData - The actual quiz questions array.
 * @param {IServiceParams} params - Original parameters for metadata.
 */
export async function saveQuizContent(
    topicId: string,
    quizData: IQuizQuestion[],
    params: IServiceParams
): Promise<void> {
    const newMetadata: IContentMetadata = ContentCacheManager.createNewMetadata(params);
    await quizRepository.save(topicId, quizData, newMetadata);
}

/**
 * Generates new quiz content from AI.
 * @param {IServiceParams} params - Request parameters.
 * @returns {Promise<IQuizQuestion[]>} The newly generated quiz content.
 */
async function generateNewQuizContent(params: IServiceParams): Promise<IQuizQuestion[]> {
    const prompt = generateQuizPrompt(params.title, params.description, params.level);
    console.log('Generated prompt for AI call:', prompt);
    return await quizContentGenerator.generateAndParse(prompt) as IQuizQuestion[];
}

/**
 * Handles errors during content generation, providing stale cache fallback.
 * @param {any} error - The error object.
 * @param {IFirestoreContentDocument | null} cachedDoc - The cached document.
 * @returns {IServiceContentResponse<IQuizQuestion[]>} The fallback content with a warning.
 * @throws {HttpError} If no fallback is available.
 */
function handleQuizGenerationError(error: any, cachedDoc: IFirestoreContentDocument | null): IServiceContentResponse<IQuizQuestion[]> {
    console.error(`Error in quizService during generation:`, error);
    if (cachedDoc) {
        console.warn("AI API call failed, returning stale cached quiz.");
        return { content: cachedDoc.content as IQuizQuestion[], warning: "AI API call failed, served stale data." };
    }
    throw error; // Re-throw if no fallback
}

/**
 * Orchestrates the generation and saving of a new quiz.
 * @param {IServiceParams} params - Request parameters.
 * @param {IFirestoreContentDocument | null} cachedDoc - Existing cached document.
 * @returns {Promise<IServiceContentResponse<IQuizQuestion[]>>} The new or fallback content.
 */
async function generateAndSaveNewQuiz(
    params: IServiceParams,
    cachedDoc: IFirestoreContentDocument | null
): Promise<IServiceContentResponse<IQuizQuestion[]>> {
    try {
        const newContent = await generateNewQuizContent(params);
        await saveQuizContent(params.topicId, newContent, params);
        return { content: newContent };
    } catch (error: any) {
        return handleQuizGenerationError(error, cachedDoc);
    }
}

/**
 * Handles the logic for generating or retrieving quiz content.
 * @param {IServiceParams} params - Object containing title, description, level, topicId, confidence.
 * @returns {Promise<IServiceContentResponse<IQuizQuestion[]>>} The quiz content with potential warnings.
 * @throws {HttpError} If content generation or retrieval fails and no fallback is available.
 */
export async function getOrCreateQuizContent(
    params: IServiceParams
): Promise<IServiceContentResponse<IQuizQuestion[]>> {
    const cachedDoc = await quizRepository.getById(params.topicId);
    const shouldRegenerate = ContentCacheManager.shouldRegenerate(cachedDoc?._metadata, params.confidence);

    if (!shouldRegenerate && cachedDoc) {
        return { content: cachedDoc.content as IQuizQuestion[] };
    }

    return await generateAndSaveNewQuiz(params, cachedDoc);
}