// src/content-processing/exercise-validator.ts
import { AbstractContentValidator } from '../common/abstract-content-validator';
import { IExercise, HttpError } from '../../model';

/**
 * Checks if a value is a non-empty array.
 * @param {any} arr - The value to check.
 * @returns {boolean} True if it's a non-empty array.
 */
function isNonEmptyArray(arr: any): boolean {
    return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validates the core structure of an IExercise object.
 * @param {any} e - The exercise object.
 * @returns {boolean} True if valid.
 */
function isValidExerciseShape(e: any): boolean {
    return typeof e.type === 'string' &&
           typeof e.instruction === 'string' &&
           typeof e.content === 'string' &&
           typeof e.solution === 'string';
}

/**
 * Validator for exercise content structure.
 */
export class ExerciseValidator extends AbstractContentValidator {
    /**
     * Validates if the content matches IExercise[].
     * @param {any} content - The content to validate.
     * @throws {HttpError} If validation fails.
     */
    public validate(content: any): void {
        if (!isNonEmptyArray(content) || !content.every(isValidExerciseShape)) {
            throw new HttpError("Generated content is not a valid exercise array structure.", 500);
        }
    }
}