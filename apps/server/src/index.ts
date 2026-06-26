import { config } from './config.js';
import { buildApp } from './app.js';
import { connectDatabase } from './infrastructure/database/prisma.js';
import { prisma } from './infrastructure/database/prisma.js';
import { redis } from './infrastructure/cache/redis.js';

async function main() {
  await connectDatabase();
  await redis.ping();

  const app = await buildApp();

  await app.listen({ port: config.port, host: config.host });
  console.log(`🚀 Server running on http://${config.host}:${config.port}`);

  // 预热数据库连接池，加速首次查询
  try {
    await prisma.world.count();
    console.log('⚡ Database pool warmed up');
  } catch { /* ignore */ }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down...');
    await app.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
