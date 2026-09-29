import { describe, expect, it } from 'vitest';
import { Document } from '@langchain/core/documents';
import { ZeldaRagChain, MockChatModel } from '../src/rag/chain';
import { LocalFileVectorStore } from '../src/rag/vector-store';
import { MockEmbeddings } from '../src/services/embedding.service';
import { QuestionService } from '../src/services/question.service';
import { NO_CONTEXT_FALLBACK } from '../src/rag/prompts';

describe('QuestionService & RAG Flow', () => {
  it('should return context-aware answer and deduplicated sources when knowledge is found', async () => {
    const embeddings = new MockEmbeddings();
    const store = new LocalFileVectorStore(embeddings);

    await store.addDocuments([
      new Document({
        pageContent: 'Link é o lendário herói de Hyrule e portador da Triforce da Coragem.',
        metadata: { source: 'knowledge/characters.md' },
      }),
      new Document({
        pageContent: 'Link usa a Master Sword para derrotar as forças do mal.',
        metadata: { source: 'knowledge/characters.md' }, // same source to test deduplication
      }),
    ]);

    const chain = new ZeldaRagChain(store, new MockChatModel({}));
    const service = new QuestionService(chain, store);

    const result = await service.ask('Quem é Link?');

    expect(result.answer).toContain('Link');
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]?.source).toBe('knowledge/characters.md');
  });

  it('should return strict fallback message when no documents match context', async () => {
    const embeddings = new MockEmbeddings();
    const store = new LocalFileVectorStore(embeddings);

    // Empty vector store
    const chain = new ZeldaRagChain(store, new MockChatModel({}));
    const service = new QuestionService(chain, null);

    const result = await service.ask('Qual é a capital da França?');

    expect(result.answer).toBe(NO_CONTEXT_FALLBACK);
    expect(result.sources).toHaveLength(0);
  });
});
