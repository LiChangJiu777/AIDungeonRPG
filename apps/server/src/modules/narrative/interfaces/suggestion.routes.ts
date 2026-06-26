import type { FastifyInstance } from 'fastify';
import { suggestionService } from '../application/suggestion.service.js';

export async function suggestionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try { await request.jwtVerify(); }
    catch { reply.status(401).send({ error: 'Unauthorized' }); }
  });

  app.get<{ Params: { id: string } }>('/sessions/:id/suggestions', async (request: any) => {
    const suggestions = await suggestionService.getSuggestions(request.params.id, request.user.sub);
    return { suggestions };
  });
}
