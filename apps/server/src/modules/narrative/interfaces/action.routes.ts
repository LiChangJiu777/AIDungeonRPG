import type { FastifyInstance } from 'fastify';
import { actionService } from '../application/action.service.js';
import { ActionSchema } from '@ai-dungeon/shared';

export async function actionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Non-streaming action
  app.post<{ Params: { id: string } }>('/sessions/:id/actions', async (request: any, reply) => {
    const { id } = request.params;
    const body = ActionSchema.parse(request.body);
    reply.status(202).send({ status: 'processing' });
    actionService.processAction(id, request.user.sub, body.input).catch(console.error);
  });
}
