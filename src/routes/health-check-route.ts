// src/routes/healthCheckRoute.ts
import { Router } from 'express';

const healthCheckRouter = Router();

/**
 * Defines the /health endpoint.
 * Returns a 200 OK status to indicate the server is running.
 */
healthCheckRouter.get('/', (req, res) => {
    res.status(200).send('OK');
});

export default healthCheckRouter;