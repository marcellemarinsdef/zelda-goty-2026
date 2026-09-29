import fs from 'node:fs';
import path from 'node:path';
import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import { SaveableVectorStore } from '@langchain/core/vectorstores';

export interface StoredVectorRecord {
  id: string;
  pageContent: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface VectorStoreIndexData {
  version: string;
  createdAt: string;
  embeddingModel: string;
  totalRecords: number;
  records: StoredVectorRecord[];
}

/**
 * Calculates the cosine similarity between two numerical vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i]!;
    const valB = b[i]!;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * LocalFileVectorStore
 * A lightweight, local file-persisted VectorStore that integrates natively
 * with LangChain retrievers and expression language (LCEL).
 */
export class LocalFileVectorStore extends SaveableVectorStore {
  private records: StoredVectorRecord[] = [];
  private readonly modelName: string;

  constructor(embeddings: Embeddings, modelName = 'default') {
    super(embeddings, {});
    this.modelName = modelName;
  }

  _vectorstoreType(): string {
    return 'local-file';
  }

  public get recordCount(): number {
    return this.records.length;
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<string[]> {
    const ids: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]!;
      const embedding = vectors[i]!;
      const id = (doc.metadata['id'] as string) || crypto.randomUUID();

      this.records.push({
        id,
        pageContent: doc.pageContent,
        metadata: doc.metadata,
        embedding,
      });

      ids.push(id);
    }

    return ids;
  }

  async addDocuments(documents: Document[]): Promise<string[]> {
    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    return this.addVectors(vectors, documents);
  }

  async similaritySearchVectorWithScore(
    queryVector: number[],
    k: number,
    filter?: (doc: Document) => boolean
  ): Promise<[Document, number][]> {
    const scored: Array<{ document: Document; score: number }> = [];

    for (const record of this.records) {
      const document = new Document({
        pageContent: record.pageContent,
        metadata: record.metadata,
      });

      if (filter && !filter(document)) {
        continue;
      }

      const score = cosineSimilarity(queryVector, record.embedding);
      scored.push({ document, score });
    }

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, k).map((item) => [item.document, item.score]);
  }

  async similaritySearchWithScore(
    query: string,
    k: number = 4,
    filter?: (doc: Document) => boolean
  ): Promise<[Document, number][]> {
    const queryVector = await this.embeddings.embedQuery(query);
    return this.similaritySearchVectorWithScore(queryVector, k, filter);
  }

  async similaritySearch(
    query: string,
    k: number = 4,
    filter?: (doc: Document) => boolean
  ): Promise<Document[]> {
    const results = await this.similaritySearchWithScore(query, k, filter);
    return results.map(([doc]) => doc);
  }

  async save(directoryPath: string): Promise<void> {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const filePath = path.join(directoryPath, 'index.json');
    const data: VectorStoreIndexData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      embeddingModel: this.modelName,
      totalRecords: this.records.length,
      records: this.records,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  static async load(directoryPath: string, embeddings: Embeddings): Promise<LocalFileVectorStore> {
    const filePath = path.join(directoryPath, 'index.json');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Vector store index not found at: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: VectorStoreIndexData = JSON.parse(raw);

    const store = new LocalFileVectorStore(embeddings, data.embeddingModel);
    store.records = data.records;

    return store;
  }
}
