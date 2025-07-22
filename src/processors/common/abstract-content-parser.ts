// src/processors/common/abstract-content-parser.ts
import { ContentData, ContentType, HttpError } from '../../model';

/**
 * Abstract base class for content parsers.
 * Each concrete parser must implement the 'parse' method.
 */
export abstract class AbstractContentParser {
    protected contentType: ContentType;

    constructor(type: ContentType) {
        this.contentType = type;
    }

    /**
     * Parses and validates raw content from AI.
     * @param {string} rawContent - The raw string from AI.
     * @returns {ContentData} The parsed and validated content.
     * @throws {HttpError} If parsing or validation fails.
     */
    public abstract parse(rawContent: string): ContentData;
}