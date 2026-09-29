import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { HealthController } from '../src/controllers/health.controller';
import { QuestionController } from '../src/controllers/question.controller';
import { LocalFileVectorStore } from '../src/rag/vector-store';
import { MockEmbeddings } from '../src/services/embedding.service';
import { QuestionService } from '../src/services/question.service';
import { ZeldaRagChain, MockChatModel } from '../src/rag/chain';

describe('QuestionController Validation (POST /questions)', () => {
  const store = new LocalFileVectorStore(new MockEmbeddings());
  const ragChain = new ZeldaRagChain(store, new MockChatModel({}));
  const questionService = new QuestionService(ragChain, store);
  const questionController = new QuestionController(questionService);
  const healthController = new HealthController(store);
  const app = createApp({ questionController, healthController });

  it('should return 400 when question is missing from body', async () => {
    const res = await request(app)
      .post('/questions')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(res.body.error.message).toContain('question field is required');
  });

  it('should return 400 when question is an empty string', async () => {
    const res = await request(app)
      .post('/questions')
      .send({ question: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('should return 400 when question contains only whitespace', async () => {
    const res = await request(app)
      .post('/questions')
      .send({ question: '    ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('should return 400 when question is not a string (e.g. number)', async () => {
    const res = await request(app)
      .post('/questions')
      .send({ question: 12345 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(res.body.error.message).toContain('must be a string');
  });

  it('should return 400 when question exceeds 500 characters', async () => {
    const longQuestion = 'a'.repeat(501);
    const res = await request(app)
      .post('/questions')
      .send({ question: longQuestion });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(res.body.error.message).toContain('must not exceed 500 characters');
  });

  it('should return 404 for undefined routes', async () => {
    const res = await request(app).get('/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
