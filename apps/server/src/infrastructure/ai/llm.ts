import OpenAI from 'openai';
import { config } from '../../config.js';

class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseUrl,
    });
  }

  async *streamChat(options: {
    model?: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: options.model ?? config.llm.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) yield token;
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: config.llm.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }
}

export const llm = new LLMClient();
