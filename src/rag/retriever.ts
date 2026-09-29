import { Document } from '@langchain/core/documents';
import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { LocalFileVectorStore } from './vector-store';

export interface RetrievedDocumentItem {
  document: Document;
  score?: number;
}

export interface FormattedSource {
  source: string;
  score?: number;
}

/**
 * Creates a configured LangChain VectorStoreRetriever from the local vector store.
 */
export function createRetriever(
  vectorStore: LocalFileVectorStore,
  k: number = 4
): VectorStoreRetriever<LocalFileVectorStore> {
  return vectorStore.asRetriever({ k });
}

/**
 * Formats an array of documents into a unified context string for the LLM prompt.
 */
export function formatDocumentsAsString(documents: Document[]): string {
  if (documents.length === 0) {
    return '';
  }

  return documents
    .map((doc, index) => {
      const source = (doc.metadata['source'] as string) || 'unknown';
      return `[Trecho ${index + 1} | Fonte: ${source}]\n${doc.pageContent.trim()}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Deduplicates sources extracted from retrieved documents,
 * preserving the highest score for each unique source.
 */
export function extractDeduplicatedSources(
  items: Array<{ document: Document; score?: number }>
): FormattedSource[] {
  const sourcesMap = new Map<string, number | undefined>();

  for (const item of items) {
    const source = (item.document.metadata['source'] as string) || 'unknown';
    const score = item.score !== undefined ? Number(item.score.toFixed(4)) : undefined;

    if (!sourcesMap.has(source)) {
      sourcesMap.set(source, score);
    } else if (score !== undefined) {
      const currentScore = sourcesMap.get(source);
      if (currentScore === undefined || score > currentScore) {
        sourcesMap.set(source, score);
      }
    }
  }

  const result: FormattedSource[] = [];
  for (const [source, score] of sourcesMap.entries()) {
    result.push(score !== undefined ? { source, score } : { source });
  }

  return result;
}
