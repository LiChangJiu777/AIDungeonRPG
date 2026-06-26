import type { FastifyInstance } from 'fastify';
import { memoryService } from '../application/memory.service.js';

export async function memoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.get<{ Params: { id: string } }>('/sessions/:id/history', async (request: any) => {
    return memoryService.getHistory(request.params.id);
  });

  app.get<{ Params: { id: string } }>('/sessions/:id/memories', async (request: any) => {
    return memoryService.retrieveMemories(request.params.id);
  });
}
