// src/routes/exerciseRoutes.js
import { Router } from 'express';
import { generateOrGetExercise, getExerciseById } from '../controllers/exercise-controller';    

const router = Router();

// POST /api/learn/exercise/generate (or just /api/learn/exercise as before)
router.post('/', generateOrGetExercise);
// GET /api/learn/exercise/:topicId
router.get('/:topicId', getExerciseById);

export default router;