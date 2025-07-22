export interface IExercise {
    type: string; // e.g., "fill-in-the-blanks", "sentence-translation"
    instruction: string;
    content: string;
    solution: string;
}