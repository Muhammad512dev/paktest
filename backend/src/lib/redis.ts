/**
 * Redis Client — PakParcha AI Backend
 *
 * Uses ioredis which is compatible with:
 *  - Upstash Redis (serverless, recommended for Railway / Vercel)
 *  - Local Redis (development)
 *  - Any standard Redis server
 *
 * Set REDIS_URL in .env to enable caching.
 * If REDIS_URL is not set, a null-safe no-op stub is returned so the
 * app continues to work without Redis (just without caching).
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisAvailable = false;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      // Upstash / cloud Redis — use TLS
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
      // Reconnect up to 3 times before giving up (avoids hanging the app)
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('[Redis] ✅ Connected successfully');
    });

    redisClient.on('error', (err: Error) => {
      redisAvailable = false;
      console.warn('[Redis] ⚠️ Connection error (caching disabled):', err.message);
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    // Attempt initial connection
    redisClient.connect().catch(() => {
      console.warn('[Redis] ⚠️ Could not connect on startup. Caching disabled.');
    });

  } catch (err: any) {
    console.warn('[Redis] ⚠️ Failed to initialize:', err.message);
    redisClient = null;
  }
} else {
  console.log('[Redis] ℹ️ REDIS_URL not set. Running without cache (add REDIS_URL to .env to enable).');
}

// ─── Safe Cache Helpers ──────────────────────────────────────────────────────

/**
 * Get a cached value. Returns null if cache miss or Redis unavailable.
 */
export async function cacheGet(key: string): Promise<string | null> {
  if (!redisClient || !redisAvailable) return null;
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL in seconds.
 */
export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!redisClient || !redisAvailable) return;
  try {
    await redisClient.setex(key, ttlSeconds, value);
  } catch {
    // silently fail — cache is non-critical
  }
}

/**
 * Delete a cached key (or a pattern if supported).
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redisClient || !redisAvailable) return;
  try {
    await redisClient.del(key);
  } catch {
    // silently fail
  }
}

/**
 * Delete all keys matching a pattern (e.g. "questions:*").
 * Uses SCAN to avoid blocking the Redis server with KEYS.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redisClient || !redisAvailable) return;
  try {
    const stream = redisClient.scanStream({ match: pattern, count: 100 });
    const keysToDelete: string[] = [];
    stream.on('data', (keys: string[]) => {
      keysToDelete.push(...keys);
    });
    await new Promise<void>((resolve) => {
      stream.on('end', async () => {
        if (keysToDelete.length > 0) {
          await redisClient!.del(...keysToDelete);
        }
        resolve();
      });
    });
  } catch {
    // silently fail
  }
}

/**
 * Get-or-set helper: returns cached value if available, otherwise calls
 * fetchFn(), caches the result, and returns it.
 *
 * @param key       - Cache key
 * @param ttl       - TTL in seconds
 * @param fetchFn   - Async function that fetches the data if cache miss
 */
export async function getOrSet<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet(key);
  if (cached !== null) {
    console.log(`[Cache] HIT: ${key}`);
    return JSON.parse(cached) as T;
  }

  console.log(`[Cache] MISS: ${key}`);
  const data = await fetchFn();
  await cacheSet(key, JSON.stringify(data), ttl);
  return data;
}

export { redisClient, redisAvailable };
