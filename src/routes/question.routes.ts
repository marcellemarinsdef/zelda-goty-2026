import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';

export function createQuestionRouter(controller: QuestionController): Router {
  const router = Router();
  router.post('/', controller.handle);
  return router;
}
