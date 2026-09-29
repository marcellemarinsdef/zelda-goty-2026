import { VectorStoreNotInitializedError } from '../core/errors/app-error';
import { ZeldaRagChain } from '../rag/chain';
import { FormattedSource } from '../rag/retriever';
import { LocalFileVectorStore } from '../rag/vector-store';

export interface QuestionResponseDto {
  answer: string;
  sources: FormattedSource[];
}

export class QuestionService {
  private readonly ragChain: ZeldaRagChain;
  private readonly vectorStore: LocalFileVectorStore | null;

  constructor(ragChain: ZeldaRagChain, vectorStore: LocalFileVectorStore | null = null) {
    this.ragChain = ragChain;
    this.vectorStore = vectorStore;
  }

  public async ask(question: string): Promise<QuestionResponseDto> {
    if (this.vectorStore && this.vectorStore.recordCount === 0) {
      throw new VectorStoreNotInitializedError();
    }

    const cleanQuestion = question.trim();
    console.log(`[INFO] Question received: "${cleanQuestion}"`);
    const startTime = performance.now();

    const result = await this.ragChain.execute(cleanQuestion);

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`[INFO] Documents retrieved: ${result.retrievedCount}`);
    console.log(`[INFO] Answer generated successfully in ${elapsed}ms.`);

    return {
      answer: result.answer,
      sources: result.sources,
    };
  }
}
