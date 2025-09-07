// In-memory cache and Redis cache utilities for performance optimization
import { createClient, type RedisClientType } from 'redis';

// In-memory cache fallback
class InMemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private maxSize = 1000; // Prevent memory leaks

  set(key: string, value: any, ttlSeconds: number = 300): void {
    // Clean up expired entries and manage size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;
    const toDelete: string[] = [];

    // Remove expired entries
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => {
      this.cache.delete(key);
      deleted++;
    });

    // If still too many items, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const keys = Array.from(this.cache.keys());
      const toRemove = keys.slice(0, Math.floor(this.maxSize * 0.1)); // Remove 10%
      toRemove.forEach(key => this.cache.delete(key));
    }

    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired cache entries`);
    }
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Cache factory
class CacheManager {
  private redisClient: RedisClientType | null = null;
  private inMemoryCache = new InMemoryCache();
  private isRedisConnected = false;

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    if (!process.env.REDIS_URL) {
      console.log('No REDIS_URL provided, using in-memory cache');
      return;
    }

    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL });

      this.redisClient.on('connect', () => {
        console.log('Redis connected');
        this.isRedisConnected = true;
      });

      this.redisClient.on('error', (err: any) => {
        console.warn('Redis connection error, falling back to in-memory cache:', err?.message || err);
        this.isRedisConnected = false;
      });

      this.redisClient.on('end', () => {
        console.log('Redis connection ended');
        this.isRedisConnected = false;
      });

      await this.redisClient.connect();

      await this.redisClient.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, using in-memory cache:', error);
      this.isRedisConnected = false;
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.warn('Redis get error, falling back to in-memory:', error);
    }

    return this.inMemoryCache.get(key);
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return;
      }
    } catch (error) {
      console.warn('Redis set error, falling back to in-memory:', error);
    }

    this.inMemoryCache.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (error) {
      console.warn('Redis delete error:', error);
    }

    this.inMemoryCache.delete(key);
  }

  async clear(): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushDb();
      }
    } catch (error) {
      console.warn('Redis clear error:', error);
    }

    this.inMemoryCache.clear();
  }

  getStats() {
    return {
      redis: {
        connected: this.isRedisConnected,
        client: !!this.redisClient,
      },
      inMemory: this.inMemoryCache.getStats(),
    };
  }

  // Disconnect Redis when shutting down
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
      this.isRedisConnected = false;
    }
  }
}

// Global cache instance
const globalForCache = globalThis as unknown as {
  cache: CacheManager | undefined;
};

export const cache = globalForCache.cache ?? new CacheManager();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cache = cache;
}

// Cache key utilities
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

// Cache wrapper for functions
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached as T;
  }

  // If not in cache, execute function
  const result = await fn();
  
  // Cache the result
  await cache.set(key, result, ttlSeconds);
  
  return result;
}

// Cache invalidation patterns
export const cacheKeys = {
  dashboard: 'dashboard:stats',
  events: (page?: number) => page ? `events:page:${page}` : 'events:all',
  event: (id: string) => `event:${id}`,
  sources: 'sources:all',
  source: (id: string) => `source:${id}`,
  health: 'health:status',
} as const;

// Graceful shutdown
process.on('SIGTERM', async () => {
  await cache.disconnect();
});

process.on('SIGINT', async () => {
  await cache.disconnect();
});

export default cache;
