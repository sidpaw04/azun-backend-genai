// src/services/study-service.ts
import { ContentRepository } from '../data/content-repository';
import { ContentCacheManager } from './content-cache-manager';
import { ContentGenerator } from './content-generator';
import { StudyParser } from '../processors';
import { generateStudyPrompt } from '../prompts/study-prompts';  

import {
    IStudyMaterial,
    IServiceParams,
    IServiceContentResponse,
    HttpError,
    IFirestoreContentDocument,
    IContentMetadata
} from '../model';

const studyRepository = new ContentRepository('studies');
const STUDY_TYPE = 'study';
const studyParser = new StudyParser();
const studyContentGenerator = new ContentGenerator(studyParser);

export async function getStudyContentById(topicId: string): Promise<IStudyMaterial | null> {
    const doc = await studyRepository.getById(topicId);
    return doc ? (doc.content as IStudyMaterial) : null;
}

export async function saveStudyContent(
    topicId: string,
    studyData: IStudyMaterial,
    params: IServiceParams
): Promise<void> {
    const newMetadata: IContentMetadata = ContentCacheManager.createNewMetadata(params);
    await studyRepository.save(topicId, studyData, newMetadata);
}

async function generateNewStudyContent(params: IServiceParams): Promise<IStudyMaterial> {
    const prompt = generateStudyPrompt(params.title, params.description, params.level);
    console.log('Generated prompt for AI call:', prompt);
    return await studyContentGenerator.generateAndParse(prompt) as IStudyMaterial;
}

function handleStudyGenerationError(error: any, cachedDoc: IFirestoreContentDocument | null): IServiceContentResponse<IStudyMaterial> {
    console.error(`Error in studyService during generation:`, error);
    if (cachedDoc) {
        console.warn("AI API call failed, returning stale cached study material.");
        return { content: cachedDoc.content as IStudyMaterial, warning: "AI API call failed, served stale data." };
    }
    throw error;
}

async function generateAndSaveNewStudy(
    params: IServiceParams,
    cachedDoc: IFirestoreContentDocument | null
): Promise<IServiceContentResponse<IStudyMaterial>> {
    try {
        const newContent = await generateNewStudyContent(params);
        await saveStudyContent(params.topicId, newContent, params);
        return { content: newContent };
    } catch (error: any) {
        return handleStudyGenerationError(error, cachedDoc);
    }
}

export async function getOrCreateStudyContent(
    params: IServiceParams
): Promise<IServiceContentResponse<IStudyMaterial>> {
    const cachedDoc = await studyRepository.getById(params.topicId);
    const shouldRegenerate = ContentCacheManager.shouldRegenerate(cachedDoc?._metadata, params.confidence);

    if (!shouldRegenerate && cachedDoc) {
        return { content: cachedDoc.content as IStudyMaterial };
    }

    return await generateAndSaveNewStudy(params, cachedDoc);
}