// src/app.ts
import express from 'express';
import { Application, Router } from 'express';
import { applyGlobalMiddleware } from './middleware/global-middleware'; // Corrected import
import { errorHandler } from './middleware/error-handler'; // Corrected import

// Import route modules
import quizRoutes from './routes/quiz-routes'; // Corrected import
import exerciseRoutes from './routes/exercise-routes'; // Corrected import
import studyRoutes from './routes/study-routes'; // Corrected import
import healthCheckRoute from './routes/health-check-route'; // Corrected import

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandler();
    }

    private configureMiddleware(): void {
        applyGlobalMiddleware(this.app);
    }

    private configureRoutes(): void {
        this.app.use('/health', healthCheckRoute);
        this.app.use('/api/learn/quiz', quizRoutes);
        this.app.use('/api/learn/exercise', exerciseRoutes);
        this.app.use('/api/learn/study', studyRoutes);
    }

    private configureErrorHandler(): void {
        this.app.use(errorHandler);
    }
}

export default new App().app;