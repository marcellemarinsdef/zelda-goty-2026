import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { InvalidRequestError } from '../core/errors/app-error';
import { QuestionService } from '../services/question.service';

const questionSchema = z.object({
  question: z
    .string({
      required_error: 'The question field is required.',
      invalid_type_error: 'The question field must be a string.',
    })
    .trim()
    .min(1, 'The question field is required and must not be empty.')
    .max(500, 'The question must not exceed 500 characters.'),
});

export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  public handle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new InvalidRequestError('Request body must be a valid JSON object.');
      }

      const parseResult = questionSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0]?.message || 'Invalid question format.';
        throw new InvalidRequestError(firstError);
      }

      const { question } = parseResult.data;
      const result = await this.questionService.ask(question);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
