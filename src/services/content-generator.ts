// src/services/content-generator.ts
import { generateRawContentWithGemini } from './gemini-client'; // Imports the Gemini API call function
import { AbstractContentParser } from '../processors/common/abstract-content-parser';
import { ContentData, HttpError } from '../model';

/**
 * Orchestrates AI content generation and parsing using a specific parser.
 */
export class ContentGenerator {
    private parser: AbstractContentParser;

    /**
     * Constructs a ContentGenerator with a specific content parser.
     * @param {AbstractContentParser} parser - The parser implementation for the content type.
     */
    constructor(parser: AbstractContentParser) {
        this.parser = parser;
    }

    /**
     * Generates content using the Gemini API and then parses/validates it.
     * @param {string} prompt - The prompt to send to Gemini.
     * @returns {Promise<ContentData>} The parsed and validated content.
     * @throws {HttpError} If Gemini call fails, or parsing/validation fails.
     */
    async generateAndParse(prompt: string): Promise<ContentData> {
        const rawContent = await generateRawContentWithGemini(prompt);
        return this.parser.parse(rawContent);  // Delegates parsing and validation to the specific parser
    }
}