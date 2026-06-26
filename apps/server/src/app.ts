import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';

// Route imports
import { authRoutes } from './modules/user/interfaces/auth.routes.js';
import { sessionRoutes } from './modules/game/interfaces/session.routes.js';
import { actionRoutes } from './modules/narrative/interfaces/action.routes.js';
import { streamRoutes } from './modules/narrative/interfaces/stream.routes.js';
import { worldRoutes } from './modules/world/interfaces/world.routes.js';
import { memoryRoutes } from './modules/memory/interfaces/memory.routes.js';
import { suggestionRoutes } from './modules/narrative/interfaces/suggestion.routes.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: config.jwt.secret });

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Register route modules
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(sessionRoutes, { prefix: '/api/v1/sessions' });
  await app.register(actionRoutes, { prefix: '/api/v1' });
  await app.register(streamRoutes, { prefix: '/api/v1' });
  await app.register(worldRoutes, { prefix: '/api/v1/worlds' });
  await app.register(memoryRoutes, { prefix: '/api/v1' });
  await app.register(suggestionRoutes, { prefix: '/api/v1' });

  return app;
}
