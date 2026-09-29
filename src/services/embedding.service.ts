import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env';

/**
 * MockEmbeddings
 * Provides deterministic 128-dimensional embeddings for offline development,
 * unit testing, and dry runs without requiring OpenAI API keys or network calls.
 */
export class MockEmbeddings extends Embeddings {
  private readonly dimensions = 128;

  constructor(params?: EmbeddingsParams) {
    super(params ?? {});
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return documents.map((doc) => this.generateDeterministicVector(doc));
  }

  async embedQuery(document: string): Promise<number[]> {
    return this.generateDeterministicVector(document);
  }

  private generateDeterministicVector(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const normalized = text.toLowerCase().trim();

    // Generate pseudo-random deterministic weights based on characters and words
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      const index = (charCode * (i + 1)) % this.dimensions;
      vector[index] = (vector[index] ?? 0) + (charCode % 17) + 1;
    }

    // Keyword boost for semantic query alignment in offline mode
    const keywords = [
      'link',
      'zelda',
      'ganon',
      'ganondorf',
      'triforce',
      'hyrule',
      'master sword',
      'ocarina',
      'impa',
      'midna',
      'korok',
      'sheik',
      'epona',
    ];

    for (let k = 0; k < keywords.length; k++) {
      const kw = keywords[k]!;
      if (normalized.includes(kw)) {
        const slot = (k * 7) % this.dimensions;
        vector[slot] = (vector[slot] ?? 0) + 50;
      }
    }

    // Normalize to unit vector for cosine similarity
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;

    return vector.map((val) => val / norm);
  }
}

/**
 * Creates the appropriate embeddings provider based on runtime configuration.
 */
export function createEmbeddingsProvider(options?: {
  apiKey?: string;
  modelName?: string;
  useMock?: boolean;
}): Embeddings {
  const useMock = options?.useMock ?? env.MOCK_LLM ?? (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'your_api_key_here');
  const apiKey = options?.apiKey ?? env.OPENAI_API_KEY;
  const modelName = options?.modelName ?? env.OPENAI_EMBEDDING_MODEL;

  if (useMock || !apiKey || apiKey === 'your_api_key_here') {
    return new MockEmbeddings();
  }

  return new OpenAIEmbeddings({
    apiKey,
    model: modelName,
  });
}
