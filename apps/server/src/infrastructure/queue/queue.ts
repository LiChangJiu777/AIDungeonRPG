import { Queue, Worker } from 'bullmq';
import { redis } from '../cache/redis.js';
import { prisma } from '../database/prisma.js';

export const memoryQueue = new Queue('memory', { connection: redis as any });
export const worldQueue = new Queue('world', { connection: redis as any });

export const memoryWorker = new Worker('memory', async (job) => {
  switch (job.name) {
    case 'store.memory': {
      const { entityId, sessionId, type, content, importance } = job.data;
      await prisma.memory.create({
        data: { entityId, sessionId, type, content, importance },
      });
      break;
    }
    case 'embed.memory': {
      const { memoryId, content } = job.data;
      // Phase 2: 调用 LLM Embedding API → 更新 pgvector
      console.log(`Embedding memory ${memoryId}: ${content.slice(0, 50)}...`);
      break;
    }
  }
}, { connection: redis as any });

export const worldWorker = new Worker('world', async (job) => {
  switch (job.name) {
    case 'evolve.world':
      // Phase 2: 世界状态被动演化
      break;
  }
}, { connection: redis as any });

export async function closeQueues() {
  await memoryQueue.close();
  await worldQueue.close();
  await memoryWorker.close();
  await worldWorker.close();
}
