// src/utils/jsonParser.ts
// Update the import path as needed, or create the module if missing
import { ContentType, ContentData } from '../model/content/Content';
import { HttpError } from '../model/error/HttpError';

/**
 * Cleans up markdown wrappers from a string.
 * @param {string} rawContent - The raw string, potentially with markdown.
 * @returns {string} The cleaned string.
 */
function cleanMarkdownWrapper(rawContent: string): string {
    return rawContent.replace(/^```json\n/, '').replace(/\n```$/, '').replace(/^```/, '').replace(/```$/, '');
}

/**
 * Parses a JSON string and validates its structure based on content type.
 * @param {string} rawContent - The raw JSON string from AI.
 * @param {ContentType} type - The expected content type.
 * @returns {ContentData} The parsed and validated content.
 * @throws {HttpError} If parsing or validation fails.
 */
export function parseAndValidateContent(rawContent: string, type: ContentType): ContentData {
    const cleanedContent = cleanMarkdownWrapper(rawContent);
    let parsedContent: any;

    try {
        parsedContent = JSON.parse(cleanedContent);
    } catch (err: any) {
        throw new HttpError(`Invalid JSON format from AI for ${type}: ${err.message}`, 500);
    }

    validateParsedStructure(parsedContent, type);
    return parsedContent;
}

/**
 * Validates the structure of parsed content.
 * @param {any} content - The parsed JSON content.
 * @param {ContentType} type - The expected content type.
 * @throws {HttpError} If validation fails.
 */
function validateParsedStructure(content: any, type: ContentType): void {
    if (type === 'quiz') {
        validateQuizStructure(content);
    } else if (type === 'exercise') {
        validateExerciseStructure(content);
    } else if (type === 'study') {
        validateStudyStructure(content);
    }
}

/**
 * Validates if the content matches IQuizQuestion[].
 * @param {any} content - The content to validate.
 * @throws {HttpError} If validation fails.
 */
function validateQuizStructure(content: any): void {
    if (!Array.isArray(content) || content.length === 0 || !content[0].question || !Array.isArray(content[0].options) || content[0].options.length !== 4 || !content[0].answer) {
        throw new HttpError("Generated content is not a valid quiz array structure.", 500);
    }
}

/**
 * Validates if the content matches IExercise[].
 * @param {any} content - The content to validate.
 * @throws {HttpError} If validation fails.
 */
function validateExerciseStructure(content: any): void {
    if (!Array.isArray(content) || content.length === 0 || !content[0].instruction || !content[0].content || !content[0].solution) {
        throw new HttpError("Generated content is not a valid exercise array structure.", 500);
    }
}

/**
 * Validates if the content matches IStudyMaterial.
 * @param {any} content - The content to validate.
 * @throws {HttpError} If validation fails.
 */
function validateStudyStructure(content: any): void {
    if (typeof content !== 'object' || !content.summary || !Array.isArray(content.keyConcepts) || !Array.isArray(content.examples) || !Array.isArray(content.tips)) {
        throw new HttpError("Generated content is not a valid study object structure.", 500);
    }
}