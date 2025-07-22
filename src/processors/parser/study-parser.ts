// src/content-processing/study-parser.ts
import { AbstractContentParser } from '../common/abstract-content-parser';
import { StudyValidator } from '../validator/study-validator'; 
import { cleanMarkdownWrapper } from '../common/content-cleaner';
import { ContentData, ContentType, HttpError, IStudyMaterial } from '../../model';

/**
 * Safely parses a JSON string.
 * @param {string} cleanedContent - The cleaned JSON string.
 * @param {ContentType} type - The content type for error messaging.
 * @returns {any} The parsed JSON object/array.
 * @throws {HttpError} If JSON parsing fails.
 */
function safeParseJson(cleanedContent: string, type: ContentType): any {
    try {
        return JSON.parse(cleanedContent);
    } catch (err: any) {
        throw new HttpError(`Invalid JSON format from AI for ${type}: ${err.message}`, 500);
    }
}

/**
 * Concrete parser for study material content.
 */
export class StudyParser extends AbstractContentParser {
    private validator: StudyValidator;

    constructor() {
        super('study');
        this.validator = new StudyValidator();
    }

    /**
     * Parses and validates raw study material content from AI.
     * @param {string} rawContent - The raw string from AI.
     * @returns {IStudyMaterial} The parsed and validated study content.
     * @throws {HttpError} If parsing or validation fails.
     */
    public parse(rawContent: string): IStudyMaterial {
        const cleanedContent = cleanMarkdownWrapper(rawContent);
        const parsedContent = safeParseJson(cleanedContent, this.contentType);
        this.validator.validate(parsedContent); // Delegate validation
        return parsedContent as IStudyMaterial;
    }
}