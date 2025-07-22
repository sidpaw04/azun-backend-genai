// src/content-processing/study-validator.ts
import { AbstractContentValidator } from '../common/abstract-content-validator';
import { IStudyMaterial, HttpError } from '../../model';

/**
 * Checks if a value is a non-empty array.
 * @param {any} arr - The value to check.
 * @returns {boolean} True if it's a non-empty array.
 */
function isNonEmptyArray(arr: any): boolean {
    return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validates the core structure of an IStudyMaterial object.
 * @param {any} s - The study material object.
 * @returns {boolean} True if valid.
 */
function isValidStudyMaterialShape(s: any): boolean {
    return typeof s === 'object' &&
           typeof s.summary === 'string' &&
           isNonEmptyArray(s.keyConcepts) &&
           isNonEmptyArray(s.examples) &&
           isNonEmptyArray(s.tips);
}

/**
 * Validator for study material content structure.
 */
export class StudyValidator extends AbstractContentValidator {
    /**
     * Validates if the content matches IStudyMaterial.
     * @param {any} content - The content to validate.
     * @throws {HttpError} If validation fails.
     */
    public validate(content: any): void {
        if (!isValidStudyMaterialShape(content)) {
            throw new HttpError("Generated content is not a valid study object structure.", 500);
        }
    }
}