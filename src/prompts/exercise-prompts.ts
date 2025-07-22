// src/prompts/exercise-prompts.ts
/**
 * Generates a prompt for the Gemini API to create exercises.
 * @param {string} title - The topic title.
 * @param {string} description - A detailed description of the topic.
 * @param {string} level - The German language learning level (e.g., 'B1').
 * @returns {string} The formatted prompt string.
 */
export function generateExercisePrompt(title: string, description: string, level: string = 'B1') {
    return `Generate a JSON array with 3 practical German language exercises for learners at level ${level}. Topic: "${title}".
Use the following context: ${description}.
Each exercise must be an object with:
- "type": string (e.g., "fill-in-the-blanks", "sentence-translation", "dialogue-completion")
- "instruction": string
- "content": string (the exercise text, e.g., a sentence with blanks, a dialogue)
- "solution": string (the correct answer or completed content)
Only return JSON — no explanation, no text outside of JSON.`;
}
