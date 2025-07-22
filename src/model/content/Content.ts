import { IExercise } from "../components/IExercise";
import { IQuizQuestion } from "../components/IQuizQuestion";
import { IStudyMaterial } from "../components/IStudyMaterial";

export type ContentType = 'quiz' | 'exercise' | 'study';
export type ContentData = IQuizQuestion[] | IExercise[] | IStudyMaterial;