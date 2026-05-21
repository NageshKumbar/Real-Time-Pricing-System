import { redis } from './redis';

export async function saveState(key: string, value: any) {
  await redis.set(key, JSON.stringify(value));
}

export async function loadState(key: string) {
  const data = await redis.get(key);

  if (!data) return null;

  return JSON.parse(data);
}