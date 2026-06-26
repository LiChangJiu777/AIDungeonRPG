import type { FastifyInstance } from 'fastify';
import { worldService } from '../application/world.service.js';
import { CreateWorldSchema } from '@ai-dungeon/shared';

export async function worldRoutes(app: FastifyInstance) {
  // 公开: 世界列表和详情
  app.get('/', async () => worldService.list());

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const world = await worldService.getById(request.params.id);
    if (!world) return reply.status(404).send({ error: 'World not found' });
    return world;
  });

  app.get<{ Params: { id: string } }>('/:id/locations', async (request) => {
    return worldService.getLocations(request.params.id);
  });

  app.get<{ Params: { id: string } }>('/:id/entities', async (request) => {
    return worldService.getEntities(request.params.id);
  });

  // 需认证: 创建世界
  const createWorldOpts = {
    preHandler: async (request: any, reply: any) => {
      try { await request.jwtVerify(); }
      catch { reply.status(401).send({ error: 'Unauthorized' }); }
    },
  };

  app.post('/', createWorldOpts, async (request: any, reply) => {
    const body = CreateWorldSchema.parse(request.body);
    const world = await worldService.create(body);
    return reply.status(201).send(world);
  });

  app.delete<{ Params: { id: string } }>('/:id', createWorldOpts, async (request: any, reply) => {
    await worldService.delete(request.params.id);
    return reply.send({ success: true });
  });

  app.post<{ Params: { id: string } }>('/:id/npcs', createWorldOpts, async (request: any, reply) => {
    const { npcs } = request.body as { npcs: Array<{ name: string; personality: string }> };
    await worldService.createNpcs(request.params.id, npcs);
    return reply.send({ success: true });
  });

  // 修改世界
  app.patch<{ Params: { id: string } }>('/:id', createWorldOpts, async (request: any, reply) => {
    const body = request.body as { name?: string; description?: string; storyGoal?: string };
    const world = await worldService.update(request.params.id, body);
    if (!world) return reply.status(404).send({ error: 'World not found' });
    return reply.send(world);
  });
}
