import { prisma } from '../../../infrastructure/database/prisma.js';
import type { GameSessionData } from '@ai-dungeon/shared';

export const sessionService = {
  async create(userId: string, worldId: string, characterName?: string, characterDesc?: string): Promise<GameSessionData> {
    const session = await prisma.gameSession.create({
      data: { userId, worldId },
      include: { world: true },
    });

    // Create player entity
    const firstLocation = await prisma.location.findFirst({ where: { worldId } });
    await prisma.entity.create({
      data: {
        worldId,
        name: characterName || '旅者',
        type: 'player',
        locationId: firstLocation?.id,
        attributes: { strength: 10, dexterity: 10, intelligence: 10, charisma: 10 } as any,
        state: { level: 1, xp: 0, characterDesc: characterDesc || '' } as any,
      },
    });

    return toSessionData(session);
  },

  async list(userId: string): Promise<GameSessionData[]> {
    const sessions = await prisma.gameSession.findMany({
      where: { userId },
      include: { world: true },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map(toSessionData);
  },

  async getById(sessionId: string, userId: string): Promise<GameSessionData | null> {
    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { world: true },
    });
    return session ? toSessionData(session) : null;
  },

  async delete(sessionId: string, userId: string): Promise<void> {
    await prisma.turn.deleteMany({ where: { sessionId } });
    await prisma.gameSession.deleteMany({ where: { id: sessionId, userId } });
  },
};

function toSessionData(session: any): GameSessionData {
  return {
    id: session.id,
    userId: session.userId,
    worldId: session.worldId,
    status: session.status,
    turnNumber: session.turnCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    world: session.world
      ? {
          id: session.world.id,
          name: session.world.name,
          description: session.world.description,
          setting: session.world.setting,
          rules: session.world.rules as Record<string, unknown>,
          state: session.world.state as Record<string, unknown>,
        }
      : undefined,
  };
}
