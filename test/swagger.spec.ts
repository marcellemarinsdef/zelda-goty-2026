import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { HealthController } from '../src/controllers/health.controller';
import { QuestionController } from '../src/controllers/question.controller';
import { LocalFileVectorStore } from '../src/rag/vector-store';
import { MockEmbeddings } from '../src/services/embedding.service';
import { QuestionService } from '../src/services/question.service';
import { ZeldaRagChain, MockChatModel } from '../src/rag/chain';

describe('Swagger Documentation Endpoints', () => {
  const store = new LocalFileVectorStore(new MockEmbeddings());
  const ragChain = new ZeldaRagChain(store, new MockChatModel({}));
  const questionService = new QuestionService(ragChain, store);
  const questionController = new QuestionController(questionService);
  const healthController = new HealthController(store);
  const app = createApp({ questionController, healthController });

  it('should serve OpenAPI JSON specification at GET /docs.json', async () => {
    const res = await request(app).get('/docs.json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('Zelda Knowledge RAG API');
    expect(res.body.paths['/questions']).toBeDefined();
    expect(res.body.paths['/health']).toBeDefined();
  });

  it('should serve Swagger UI at GET /docs/', async () => {
    const res = await request(app).get('/docs/');

    // Swagger UI returns 200 with HTML
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
