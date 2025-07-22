// src/content-processing/exercise-parser.ts
import { AbstractContentParser } from '../common/abstract-content-parser';
import { ExerciseValidator } from '../validator/exercise-validator'; // Import specific validator
import { cleanMarkdownWrapper } from '../common/content-cleaner'; // Import cleaner
import { ContentData, ContentType, HttpError, IExercise } from '../../model';

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
 * Concrete parser for exercise content.
 */
export class ExerciseParser extends AbstractContentParser {
    private validator: ExerciseValidator;

    constructor() {
        super('exercise');
        this.validator = new ExerciseValidator();
    }

    /**
     * Parses and validates raw exercise content from AI.
     * @param {string} rawContent - The raw string from AI.
     * @returns {IExercise[]} The parsed and validated exercise content.
     * @throws {HttpError} If parsing or validation fails.
     */
    public parse(rawContent: string): IExercise[] {
        const cleanedContent = cleanMarkdownWrapper(rawContent);
        const parsedContent = safeParseJson(cleanedContent, this.contentType);
        this.validator.validate(parsedContent); // Delegate validation
        return parsedContent as IExercise[];
    }
}