import { Request, Response } from 'express';
import { LocalFileVectorStore } from '../rag/vector-store';

export class HealthController {
  constructor(private readonly vectorStore: LocalFileVectorStore | null) {}

  public handle = (_req: Request, res: Response): void => {
    const isLoaded = this.vectorStore !== null && this.vectorStore.recordCount > 0;

    res.status(200).json({
      status: 'ok',
      vectorStore: {
        loaded: isLoaded,
        records: this.vectorStore?.recordCount ?? 0,
      },
    });
  };
}
