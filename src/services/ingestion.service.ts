import fs from 'node:fs';
import path from 'node:path';
import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { env } from '../config/env';
import { LocalFileVectorStore } from '../rag/vector-store';
import { createEmbeddingsProvider } from './embedding.service';

export interface IngestionResult {
  filesProcessed: number;
  chunksCreated: number;
  vectorStorePath: string;
}

export class IngestionService {
  private readonly embeddings: Embeddings;
  private readonly knowledgeDir: string;
  private readonly vectorStorePath: string;

  constructor(options?: {
    embeddings?: Embeddings;
    knowledgeDir?: string;
    vectorStorePath?: string;
  }) {
    this.embeddings = options?.embeddings ?? createEmbeddingsProvider();
    this.knowledgeDir = options?.knowledgeDir ?? path.resolve(process.cwd(), 'knowledge');
    this.vectorStorePath =
      options?.vectorStorePath ?? path.resolve(process.cwd(), env.VECTOR_STORE_PATH);
  }

  public async run(): Promise<IngestionResult> {
    console.log(`[INFO] Scanning knowledge base directory: ${this.knowledgeDir}`);

    if (!fs.existsSync(this.knowledgeDir)) {
      throw new Error(`Knowledge directory not found: ${this.knowledgeDir}`);
    }

    // 1. Read files and preserve metadata
    const rawDocuments = this.loadFilesFromDirectory(this.knowledgeDir);
    console.log(`[INFO] Loaded ${rawDocuments.length} document(s) from knowledge base.`);

    if (rawDocuments.length === 0) {
      throw new Error(`No compatible knowledge documents (.txt, .md) found in ${this.knowledgeDir}`);
    }

    // 2. Split documents into semantic chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 600,
      chunkOverlap: 100,
      separators: ['\n\n## ', '\n\n', '\n', ' ', ''],
    });

    const chunks = await splitter.splitDocuments(rawDocuments);
    console.log(`[INFO] Split into ${chunks.length} semantic chunks.`);

    // 3. Create and populate local vector store with embeddings
    console.log(`[INFO] Generating embeddings and populating local vector store...`);
    const vectorStore = new LocalFileVectorStore(this.embeddings, env.OPENAI_EMBEDDING_MODEL);
    await vectorStore.addDocuments(chunks);

    // 4. Persist to disk
    console.log(`[INFO] Persisting vector store to: ${this.vectorStorePath}`);
    await vectorStore.save(this.vectorStorePath);
    console.log(`[INFO] Ingestion completed successfully. Index contains ${vectorStore.recordCount} records.`);

    return {
      filesProcessed: rawDocuments.length,
      chunksCreated: chunks.length,
      vectorStorePath: this.vectorStorePath,
    };
  }

  private loadFilesFromDirectory(dirPath: string): Document[] {
    const files = fs.readdirSync(dirPath);
    const documents: Document[] = [];

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursive support
        documents.push(...this.loadFilesFromDirectory(fullPath));
        continue;
      }

      const ext = path.extname(file).toLowerCase();
      if (ext !== '.txt' && ext !== '.md') {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const relativePath = path.relative(process.cwd(), fullPath);

      documents.push(
        new Document({
          pageContent: content,
          metadata: {
            source: relativePath.replace(/\\/g, '/'),
            filename: file,
            type: ext === '.md' ? 'markdown' : 'text',
          },
        })
      );
    }

    return documents;
  }
}
