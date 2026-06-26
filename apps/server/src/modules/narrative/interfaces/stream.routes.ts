import type { FastifyInstance } from 'fastify';
import { actionService } from '../application/action.service.js';
import { ActionSchema } from '@ai-dungeon/shared';

export async function streamRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // 故事启端 SSE
  app.get<{ Params: { id: string } }>('/sessions/:id/intro', async (request: any, reply: any) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const stream = actionService.generateIntro(request.params.id, request.user.sub);
      for await (const event of stream) {
        const line = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        reply.raw.write(line);
      }
    } catch (error: any) {
      const errorLine = `event: error\ndata: ${JSON.stringify({ code: 'INTRO_ERROR', message: error.message })}\n\n`;
      reply.raw.write(errorLine);
    }

    reply.raw.end();
  });

  // SSE streaming action
  app.post<{ Params: { id: string } }>('/sessions/:id/actions/stream', async (request: any, reply: any) => {
    const { id } = request.params;
    const body = ActionSchema.parse(request.body);

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const stream = actionService.processActionStream(id, request.user.sub, body.input);
      for await (const event of stream) {
        const line = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        reply.raw.write(line);
      }
    } catch (error: any) {
      const errorLine = `event: error\ndata: ${JSON.stringify({ code: 'PROCESSING_ERROR', message: error.message })}\n\n`;
      reply.raw.write(errorLine);
    }

    reply.raw.end();
  });

  // SSE keep-alive connection
  app.get<{ Params: { id: string } }>('/sessions/:id/stream', async (request: any, reply: any) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const keepAlive = setInterval(() => {
      reply.raw.write(': keepalive\n\n');
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(keepAlive);
    });
  });
}
