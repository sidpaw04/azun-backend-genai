// src/content-processing/quiz-parser.ts
import { AbstractContentParser } from '../common/abstract-content-parser';
import { QuizValidator } from '../validator/quiz-validator'; // Import specific validator
import { cleanMarkdownWrapper } from '../common/content-cleaner'; // Import cleaner
import { ContentData, ContentType, HttpError, IQuizQuestion } from '../../model';

/**
 * Safely parses a JSON string.
 * @param {string} cleanedContent - The cleaned JSON string.
 * @param {ContentType} type - The content type for error messaging.
 * @returns {any} The parsed JSON object/array.
 * @throws {HttpError} If JSON parsing fails.
 */
function safeParseJson(cleanedContent: string, type: ContentType): any {
    try {
        console.log(`Parsing content : ${cleanedContent}`); 
        return JSON.parse(cleanedContent);
    } catch (err: any) {
        throw new HttpError(`Invalid JSON format from AI for ${type}: ${err.message}`, 500);
    }
}

/**
 * Concrete parser for quiz content.
 */
export class QuizParser extends AbstractContentParser {
    private validator: QuizValidator;

    constructor() {
        super('quiz');
        this.validator = new QuizValidator();
    }

    /**
     * Parses and validates raw quiz content from AI.
     * @param {string} rawContent - The raw string from AI.
     * @returns {IQuizQuestion[]} The parsed and validated quiz content.
     * @throws {HttpError} If parsing or validation fails.
     */
    public parse(rawContent: string): IQuizQuestion[] {
        const cleanedContent = cleanMarkdownWrapper(rawContent);
        const parsedContent = safeParseJson(cleanedContent, this.contentType);
        this.validator.validate(parsedContent); 
        return parsedContent as IQuizQuestion[];
    }
}