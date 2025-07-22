// src/services/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { HttpError } from '../model';


// Use non-null assertion (!) because config.geminiApiKey is validated in config/index.ts
// and the process exits if it's not set.
const genAI = new GoogleGenerativeAI(config.geminiApiKey!);
const model = genAI.getGenerativeModel({ model: config.geminiModel });

/**
 * Executes a content generation request to the Gemini API.
 * @param {string} prompt - The text prompt.
 * @returns {Promise<string>} The raw text response from Gemini.
 * @throws {HttpError} If the API call fails or returns no content.
 */
async function executeGeminiCall(prompt: string): Promise<string> {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    if (!content) {
        throw new HttpError("No content received from Gemini API.", 500);
    }
    return content;
}

/**
 * Generates raw content using the Gemini API.
 * The cleaning and parsing will be handled by specific content parsers.
 * @param {string} prompt - The text prompt for content generation.
 * @returns {Promise<string>} The raw text response from the Gemini API.
 * @throws {HttpError} If the Gemini API call fails or returns no content.
 */
export async function generateRawContentWithGemini(prompt: string): Promise<string> {
    try {
        return await executeGeminiCall(prompt);
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        throw new HttpError("Failed to generate content from AI service.", 500);
    }
}