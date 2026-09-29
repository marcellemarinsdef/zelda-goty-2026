import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { QuestionController } from '../controllers/question.controller';
import { createHealthRouter } from './health.routes';
import { createQuestionRouter } from './question.routes';

export function createApiRouter(
  questionController: QuestionController,
  healthController: HealthController
): Router {
  const router = Router();

  router.use('/questions', createQuestionRouter(questionController));
  router.use('/health', createHealthRouter(healthController));

  return router;
}
