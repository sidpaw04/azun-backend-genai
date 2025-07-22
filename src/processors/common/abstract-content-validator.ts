// src/processors/common/abstract-content-validator.ts

/**
 * Abstract base class for content validators.
 * Each concrete validator must implement the 'validate' method.
 */
export abstract class AbstractContentValidator {
    /**
     * Validates the structure of parsed content.
     * @param {any} content - The parsed JSON content.
     * @throws {HttpError} If validation fails.
     */
    public abstract validate(content: any): void;
}