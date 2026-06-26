import type { FastifyInstance } from 'fastify';
import { sessionService } from '../application/session.service.js';
import { CreateSessionSchema } from '@ai-dungeon/shared';

export async function sessionRoutes(app: FastifyInstance) {
  // All session routes require auth
  app.addHook('preHandler', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.post('/', async (request: any, reply) => {
    const body = CreateSessionSchema.parse(request.body);
    const session = await sessionService.create(request.user.sub, body.worldId, body.characterName, body.characterDesc);
    return reply.status(201).send(session);
  });

  app.get('/', async (request: any) => {
    return sessionService.list(request.user.sub);
  });

  app.get<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    const session = await sessionService.getById(request.params.id, request.user.sub);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return session;
  });

  app.delete<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    await sessionService.delete(request.params.id, request.user.sub);
    return reply.status(204).send();
  });
}
