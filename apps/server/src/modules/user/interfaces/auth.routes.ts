import type { FastifyInstance } from 'fastify';
import { authService } from '../application/auth.service.js';
import { RegisterSchema, LoginSchema } from '@ai-dungeon/shared';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    try {
      const body = RegisterSchema.parse(request.body);
      const result = await authService.register(body.username, body.email, body.password);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/login', async (request, reply) => {
    try {
      const body = LoginSchema.parse(request.body);
      const result = await authService.login(body.email, body.password);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(401).send({ error: error.message || 'Login failed' });
    }
  });
}
