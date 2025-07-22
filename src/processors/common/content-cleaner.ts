// src/processors/common/content-cleaner.ts
/**
 * Cleans up markdown wrappers from a raw string.
 * @param {string} rawContent - The raw string, potentially with markdown.
 * @returns {string} The cleaned string.
 */
export function cleanMarkdownWrapper(rawContent: string): string {
    console.log(`Cleaning markdown wrapper from content: ${rawContent}`);
    return rawContent.replace(/```(?:json)?\s*/gi, '');
}