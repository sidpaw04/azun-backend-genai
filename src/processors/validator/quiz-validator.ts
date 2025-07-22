// src/content-processing/quiz-validator.ts
import { AbstractContentValidator } from '../common/abstract-content-validator';
import { IQuizQuestion, HttpError } from '../../model';

/**
 * Checks if a value is a non-empty array.
 * @param {any} arr - The value to check.
 * @returns {boolean} True if it's a non-empty array.
 */
function isNonEmptyArray(arr: any): boolean {
    return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validates the core shape of a single IQuizQuestion object.
 * @param {any} q - The question object.
 * @returns {boolean} True if valid.
 */
function isValidQuizQuestionShape(q: any): boolean {
    return typeof q.question === 'string' &&
           isNonEmptyArray(q.options) &&
           q.options.length === 4 &&
           typeof q.answer === 'string';
}

/**
 * Validator for quiz content structure.
 */
export class QuizValidator extends AbstractContentValidator {
    /**
     * Validates if the content matches IQuizQuestion[].
     * @param {any} content - The content to validate.
     * @throws {HttpError} If validation fails.
     */
    public validate(content: any): void {
        if (!isNonEmptyArray(content) || !content.every(isValidQuizQuestionShape)) {
            throw new HttpError("Generated content is not a valid quiz array structure.", 500);
        }
    }
}