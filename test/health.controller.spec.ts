import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { HealthController } from '../src/controllers/health.controller';
import { QuestionController } from '../src/controllers/question.controller';
import { LocalFileVectorStore } from '../src/rag/vector-store';
import { MockEmbeddings } from '../src/services/embedding.service';
import { QuestionService } from '../src/services/question.service';
import { ZeldaRagChain, MockChatModel } from '../src/rag/chain';
import { Document } from '@langchain/core/documents';

describe('HealthController (GET /health)', () => {
  it('should return loaded: false when vector store has no records', async () => {
    const emptyStore = new LocalFileVectorStore(new MockEmbeddings());
    const healthController = new HealthController(emptyStore);

    const ragChain = new ZeldaRagChain(emptyStore, new MockChatModel({}));
    const questionService = new QuestionService(ragChain, emptyStore);
    const questionController = new QuestionController(questionService);

    const app = createApp({ questionController, healthController });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      vectorStore: {
        loaded: false,
        records: 0,
      },
    });
  });

  it('should return loaded: true when vector store contains records', async () => {
    const embeddings = new MockEmbeddings();
    const populatedStore = new LocalFileVectorStore(embeddings);

    await populatedStore.addDocuments([
      new Document({
        pageContent: 'Link é o herói de Hyrule.',
        metadata: { source: 'knowledge/characters.md' },
      }),
    ]);

    const healthController = new HealthController(populatedStore);
    const ragChain = new ZeldaRagChain(populatedStore, new MockChatModel({}));
    const questionService = new QuestionService(ragChain, populatedStore);
    const questionController = new QuestionController(questionService);

    const app = createApp({ questionController, healthController });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.vectorStore.loaded).toBe(true);
    expect(response.body.vectorStore.records).toBe(1);
  });
});
