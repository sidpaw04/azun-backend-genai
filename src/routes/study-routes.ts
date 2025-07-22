// src/routes/studyRoutes.js
import { Router } from 'express';
import { generateOrGetStudy, getStudyById } from '../controllers/study-controller';

const router = Router();

// POST /api/learn/study/generate (or just /api/learn/study as before)
router.post('/', generateOrGetStudy);
// GET /api/learn/study/:topicId
router.get('/:topicId', getStudyById);

export default router;