import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // LLM & Embeddings
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  // RAG & Vector Store
  VECTOR_STORE_PATH: z.string().default('./data/vector_store'),
  RAG_TOP_K: z.coerce.number().int().positive().default(4),

  // Development/Test offline mode flag
  MOCK_LLM: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
