import path from 'node:path';
import { createApp } from './app';
import { env } from './config/env';
import { HealthController } from './controllers/health.controller';
import { QuestionController } from './controllers/question.controller';
import { createChatModel, ZeldaRagChain } from './rag/chain';
import { LocalFileVectorStore } from './rag/vector-store';
import { createEmbeddingsProvider } from './services/embedding.service';
import { QuestionService } from './services/question.service';

async function bootstrap(): Promise<void> {
  console.log(`[INFO] Starting Zelda RAG API in ${env.NODE_ENV} mode...`);

  // 1. Embedding Provider
  const embeddings = createEmbeddingsProvider();

  // 2. Load Vector Store from disk (if already ingested)
  const vectorStoreDir = path.resolve(process.cwd(), env.VECTOR_STORE_PATH);
  let vectorStore: LocalFileVectorStore | null = null;

  try {
    console.log(`[INFO] Loading vector store from ${env.VECTOR_STORE_PATH}...`);
    vectorStore = await LocalFileVectorStore.load(vectorStoreDir, embeddings);
    console.log(
      `[INFO] Vector store loaded successfully with ${vectorStore.recordCount} records.`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[WARN] Could not load vector store: ${message}. Run "npm run ingest" to initialize the index.`
    );
    // Provide empty in-memory store so server starts gracefully
    vectorStore = new LocalFileVectorStore(embeddings, env.OPENAI_EMBEDDING_MODEL);
  }

  // 3. LLM Model
  const llm = createChatModel();

  // 4. RAG Chain & Domain Services
  const ragChain = new ZeldaRagChain(vectorStore, llm, env.RAG_TOP_K);
  const questionService = new QuestionService(ragChain, vectorStore);

  // 5. HTTP Controllers
  const questionController = new QuestionController(questionService);
  const healthController = new HealthController(vectorStore);

  // 6. Build Express Application
  const app = createApp({
    questionController,
    healthController,
  });

  // 7. Start Listening
  const server = app.listen(env.PORT, () => {
    console.log(`[INFO] Server running on http://localhost:${env.PORT}`);
    console.log(`[INFO] Health check available at: http://localhost:${env.PORT}/health`);
    console.log(`[INFO] Questions endpoint available at: http://localhost:${env.PORT}/questions`);
    console.log(`[INFO] Swagger documentation available at: http://localhost:${env.PORT}/docs`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[ERROR] Port ${env.PORT} is already in use by another process.`);
      console.error(`[TIP] Set PORT in your .env file (e.g. PORT=3001) or free up the port.`);
    } else {
      console.error('[ERROR] Server failed to start:', err.message);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = (): void => {
    console.log('[INFO] Gracefully shutting down server...');
    server.close(() => {
      console.log('[INFO] Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('[FATAL] Failed to bootstrap application:', err);
  process.exit(1);
});
