// src/routes/quizRoutes.ts
import { Router } from 'express';
import { generateOrGetQuiz, getQuizById } from '../controllers/quiz-controller';

const router = Router();

router.post('/', generateOrGetQuiz); 
router.get('/:topicId', getQuizById);

export default router;