// src/prompts/study-prompts.ts
/**
 * Generates a prompt for the Gemini API to create study material.
 * @param {string} title - The topic title.
 * @param {string} description - A detailed description of the topic.
 * @param {string} level - The German language learning level (e.g., 'B1').
 * @returns {string} The formatted prompt string.
 */
export function generateStudyPrompt(title: string, description: string, level: string = 'B1') {
    return `Generate a JSON object containing key study points for German learners at level ${level}. Topic: "${title}".
Use the following context: ${description}.
The object must have:
- "summary": string (a concise overview)
- "keyConcepts": array of strings (important terms/ideas)
- "examples": array of strings (illustrative sentences/phrases)
- "tips": array of strings (learning tips)
Only return JSON — no explanation, no text outside of JSON.`;
}
