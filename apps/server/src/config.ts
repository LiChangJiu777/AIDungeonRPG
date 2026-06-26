import 'dotenv/config';

export interface Config {
  port: number;
  host: string;
  database: { url: string };
  redis: { url: string };
  jwt: { secret: string; expiresIn: string };
  llm: {
    apiKey: string;
    model: string;
    provider: 'openai' | 'anthropic' | 'deepseek';
    baseUrl?: string;
    embeddingModel: string;
    embeddingDim: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://dungeon:dungeon_pass@localhost:5432/ai_dungeon',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379/0',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiresIn: '7d',
  },
  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic' | 'deepseek') ?? 'openai',
    baseUrl: process.env.LLM_BASE_URL ?? undefined,
    embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
    embeddingDim: parseInt(process.env.EMBEDDING_DIM ?? '1536', 10),
  },
};
