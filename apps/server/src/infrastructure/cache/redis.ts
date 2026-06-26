import { Redis } from 'ioredis';
import { config } from '../../config.js';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => console.log('🔴 Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
