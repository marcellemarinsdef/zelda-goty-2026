import cors from 'cors';
import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { HealthController } from './controllers/health.controller';
import { QuestionController } from './controllers/question.controller';
import {
  errorHandlerMiddleware,
  notFoundHandlerMiddleware,
} from './middlewares/error-handler.middleware';
import { createApiRouter } from './routes';

export interface AppDependencies {
  questionController: QuestionController;
  healthController: HealthController;
}

export function createApp(dependencies: AppDependencies): Application {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  // Swagger Documentation routes
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });

  // Register API routes
  const apiRouter = createApiRouter(
    dependencies.questionController,
    dependencies.healthController
  );
  app.use(apiRouter);

  // 404 Route Not Found
  app.use(notFoundHandlerMiddleware);

  // Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}
