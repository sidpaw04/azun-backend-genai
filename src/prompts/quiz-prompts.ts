// src/prompts/quiz-prompts.ts
/**
 * Generates a prompt for the Gemini API to create a quiz.
 * @param {string} title - The topic title.
 * @param {string} description - A detailed description of the topic.
 * @param {string} level - The German language learning level (e.g., 'B1').
 * @returns {string} The formatted prompt string.
 */

export function generateQuizPrompt(topic: string, description: string, level:string = 'B1') {
    return  `Generate a JSON array with 10 multiple-choice questions for German learners at level ${level}. Topic: "${topic}".
Use the following context: ${description}.
Each question must be an object with:
- "question": string
- "options": array of 4 strings including the correct answer
- "answer": correct answer string from the options
- "explanation": string explaining the answer
Only return JSON — no text outside of JSON.`;
}
