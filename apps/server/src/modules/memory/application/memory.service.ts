import { prisma } from '../../../infrastructure/database/prisma.js';
import type { MemoryItem } from '@ai-dungeon/shared';

export const memoryService = {
  async retrieveMemories(sessionId: string, topK: number = 5): Promise<MemoryItem[]> {
    const memories = await prisma.memory.findMany({
      where: { sessionId },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      take: topK,
    });

    return memories.map(m => ({
      id: m.id,
      content: m.content,
      importance: m.importance,
      type: m.type as 'experience' | 'knowledge' | 'relationship',
      entityId: m.entityId,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async getHistory(sessionId: string) {
    const turns = await prisma.turn.findMany({
      where: { sessionId },
      orderBy: { turnNumber: 'asc' },
      take: 50,
    });

    return turns.map(t => ({
      id: t.id,
      turnNumber: t.turnNumber,
      input: t.input,
      output: t.output,
      createdAt: t.createdAt.toISOString(),
    }));
  },
};
