import { prisma } from '../../../infrastructure/database/prisma.js';
import type { WorldData, LocationData, EntityData } from '@ai-dungeon/shared';

function defaultLocations(setting: string) {
  const MAP: Record<string, { start: { name: string; desc: string; exits: Record<string, string> }; secondary: { name: string; desc: string; exits: Record<string, string> } }> = {
    xianxia: {
      start: { name: '灵溪镇', desc: '灵气充沛的小镇，街上随处可见售卖灵草的摊贩，远处山巅有仙门若隐若现。', exits: { north: '试炼山林', east: '坊市' } },
      secondary: { name: '试炼山林', desc: '宗门弟子的试炼之地，林中常有妖兽出没，但也孕育着珍稀灵药。', exits: { south: '灵溪镇' } },
    },
    romance: {
      start: { name: '晴空咖啡馆', desc: '暖黄的灯光洒在木质桌面上，空气中飘着咖啡豆和肉桂的香气。窗外的梧桐树叶沙沙作响。', exits: { north: '吧台', east: '大学城' } },
      secondary: { name: '大学城步行街', desc: '青春洋溢的街道，两旁是各种精致的小店和奶茶铺，午后的阳光正好。', exits: { west: '晴空咖啡馆' } },
    },
    mystery: {
      start: { name: '雾镇报社', desc: '老旧的报社办公室，打字机声此起彼伏。墙上贴满了失踪者照片和红线，窗外白雾茫茫。', exits: { north: '镇中心广场', east: '档案室' } },
      secondary: { name: '镇中心广场', desc: '灰暗的广场中央矗立着一座停摆的古老钟楼，雾气中隐约可见几个人影。', exits: { south: '雾镇报社' } },
    },
  };
  return MAP[setting] ?? MAP.xianxia;
}

export const worldService = {
  async create(data: { name: string; description: string; setting: string; storyGoal?: string; rules?: Record<string, unknown> }): Promise<WorldData> {
    const locs = defaultLocations(data.setting);
    const rules: Record<string, unknown> = { ...(data.rules ?? {}) };
    if (data.storyGoal) rules.storyGoal = data.storyGoal;

    const world = await prisma.world.create({
      data: {
        name: data.name,
        description: data.description,
        setting: data.setting,
        rules: rules as any,
        state: { timeOfDay: 'morning', weather: 'clear', season: 'spring' } as any,
      },
    });

    const startLocation = await prisma.location.create({
      data: {
        worldId: world.id,
        name: locs.start.name,
        description: locs.start.desc,
        exits: locs.start.exits as any,
        metadata: { isSafe: true, population: 80 } as any,
      },
    });

    await prisma.location.create({
      data: {
        worldId: world.id,
        name: locs.secondary.name,
        description: locs.secondary.desc,
        exits: locs.secondary.exits as any,
        metadata: { isSafe: false, danger: 'moderate' } as any,
      },
    });

    await prisma.entity.create({
      data: {
        worldId: world.id,
        name: '向导',
        type: 'npc',
        locationId: startLocation.id,
        attributes: { charisma: 12, knowledge: 10 } as any,
        state: { mood: 'friendly' } as any,
      },
    });

    return toWorldData(world);
  },

  async list(): Promise<WorldData[]> {
    const worlds = await prisma.world.findMany({ orderBy: { createdAt: 'desc' } });
    return worlds.map(w => toWorldData(w));
  },

  async getById(worldId: string): Promise<WorldData | null> {
    const world = await prisma.world.findUnique({ where: { id: worldId } });
    return world ? toWorldData(world) : null;
  },

  async getLocations(worldId: string): Promise<LocationData[]> {
    const locations = await prisma.location.findMany({ where: { worldId } });
    return locations.map(l => ({
      id: l.id,
      worldId: l.worldId,
      name: l.name,
      description: l.description,
      exits: l.exits as Record<string, string>,
      metadata: l.metadata as Record<string, unknown>,
    }));
  },

  async createNpcs(worldId: string, npcs: Array<{ name: string; personality: string }>): Promise<void> {
    const firstLocation = await prisma.location.findFirst({ where: { worldId } });
    if (!firstLocation) return;

    for (const npc of npcs) {
      await prisma.entity.create({
        data: {
          worldId,
          name: npc.name,
          type: 'npc',
          locationId: firstLocation.id,
          attributes: {
            appearance: '',
            personality: npc.personality || '待探索',
            dialogue_style: '',
            background: '',
            knows: '',
          } as any,
          state: { mood: '平静' } as any,
        },
      });
    }
  },

  async getEntities(worldId: string): Promise<EntityData[]> {
    const entities = await prisma.entity.findMany({ where: { worldId } });
    return entities.map(e => ({
      id: e.id,
      worldId: e.worldId,
      name: e.name,
      type: e.type,
      attributes: e.attributes as Record<string, unknown>,
      locationId: e.locationId,
      state: e.state as Record<string, unknown>,
    }));
  },

  async update(worldId: string, data: { name?: string; description?: string; storyGoal?: string }): Promise<WorldData | null> {
    const existing = await prisma.world.findUnique({ where: { id: worldId } });
    if (!existing) return null;

    const rules = (existing.rules ?? {}) as Record<string, unknown>;
    if (data.storyGoal !== undefined) {
      rules.storyGoal = data.storyGoal;
    }

    const world = await prisma.world.update({
      where: { id: worldId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.storyGoal !== undefined && { rules: rules as any }),
      },
    });
    return toWorldData(world);
  },

  async delete(worldId: string): Promise<void> {
    // 级联删除：memories → entities → turns → sessions → locations → world
    const entities = await prisma.entity.findMany({ where: { worldId }, select: { id: true } });
    const entityIds = entities.map(e => e.id);

    const sessions = await prisma.gameSession.findMany({ where: { worldId }, select: { id: true } });
    const sessionIds = sessions.map(s => s.id);

    // 删除记忆
    if (entityIds.length > 0) {
      await prisma.memory.deleteMany({ where: { entityId: { in: entityIds } } });
    }
    // 删除实体
    await prisma.entity.deleteMany({ where: { worldId } });
    // 删除回合
    if (sessionIds.length > 0) {
      await prisma.turn.deleteMany({ where: { sessionId: { in: sessionIds } } });
    }
    // 删除会话
    await prisma.gameSession.deleteMany({ where: { worldId } });
    // 删除地点
    await prisma.location.deleteMany({ where: { worldId } });
    // 删除事件
    await prisma.event.deleteMany({ where: { worldId } });
    // 删除世界
    await prisma.world.delete({ where: { id: worldId } });
  },
};

function toWorldData(w: any): WorldData {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    setting: w.setting,
    rules: w.rules as Record<string, unknown>,
    state: w.state as Record<string, unknown>,
  };
}
