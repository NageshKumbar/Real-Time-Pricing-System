import Redis from 'ioredis';
import { CONFIG } from '../config';

export const redis = new Redis(CONFIG.REDIS_URL);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', err => {
  console.error('Redis Error:', err);
});