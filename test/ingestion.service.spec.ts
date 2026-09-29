import { describe, expect, it, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { IngestionService } from '../src/services/ingestion.service';
import { MockEmbeddings } from '../src/services/embedding.service';
import { LocalFileVectorStore } from '../src/rag/vector-store';

describe('IngestionService', () => {
  const testDataDir = path.resolve(process.cwd(), 'data/test_vector_store');

  afterAll(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('should read knowledge files, generate embeddings, and persist index to disk', async () => {
    const embeddings = new MockEmbeddings();
    const service = new IngestionService({
      embeddings,
      vectorStorePath: testDataDir,
    });

    const result = await service.run();

    expect(result.filesProcessed).toBeGreaterThanOrEqual(4);
    expect(result.chunksCreated).toBeGreaterThanOrEqual(4);
    expect(fs.existsSync(path.join(testDataDir, 'index.json'))).toBe(true);

    // Verify loading persisted index
    const loadedStore = await LocalFileVectorStore.load(testDataDir, embeddings);
    expect(loadedStore.recordCount).toBe(result.chunksCreated);
  });
});
