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
  private redisAvailable = true; // Flag to stop trying Redis if it's permanently unavailable
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private lastErrorLog = 0; // Timestamp of last error log to prevent spam

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    if (!process.env.REDIS_URL) {
      console.log('Cache: No REDIS_URL provided, using in-memory cache only');
      this.redisAvailable = false;
      this.connectionAttempts = this.maxConnectionAttempts + 1; // Ensure no more attempts
      return;
    }

    // Stop trying if we've exceeded max attempts
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      if (this.connectionAttempts === this.maxConnectionAttempts) {
        console.log('Cache: Redis unavailable after max attempts, using in-memory cache only');
        this.connectionAttempts++; // Increment to avoid logging this message repeatedly
      }
      this.redisAvailable = false;
      return;
    }

    try {
      this.connectionAttempts++;
      this.redisClient = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 2000 // 2 second timeout
        }
      });

      this.redisClient.on('connect', () => {
        console.log('Cache: Redis connected successfully');
        this.isRedisConnected = true;
        this.connectionAttempts = 0; // Reset attempts on successful connection
      });

      this.redisClient.on('error', (err: any) => {
        this.isRedisConnected = false;
        // Only log errors occasionally to avoid spam, and only if we haven't exceeded max attempts
        if (this.connectionAttempts <= this.maxConnectionAttempts) {
          const now = Date.now();
          if (now - this.lastErrorLog > 30000) { // Log at most once per 30 seconds
            console.log(`Cache: Redis error (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}):`, err?.code || 'Connection refused');
            this.lastErrorLog = now;
          }
        }
        this.scheduleReconnect();
      });

      this.redisClient.on('end', () => {
        this.isRedisConnected = false;
        this.scheduleReconnect();
      });

      // Single connection attempt (fixing the duplicate connection calls)
      await this.redisClient.connect();

    } catch (error) {
      this.isRedisConnected = false;
      const now = Date.now();
      if (now - this.lastErrorLog > 30000) {
        console.log(`Cache: Redis connection failed (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
        this.lastErrorLog = now;
      }
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    // Completely stop trying if we've exceeded max attempts or Redis is marked unavailable
    if (this.reconnectTimeout || !this.redisAvailable || this.connectionAttempts >= this.maxConnectionAttempts) {
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        this.redisAvailable = false; // Ensure it's marked as permanently unavailable
      }
      return;
    }

    // Exponential backoff: 1s, 4s, 9s
    const delay = Math.pow(this.connectionAttempts, 2) * 1000;
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.connectionAttempts < this.maxConnectionAttempts && this.redisAvailable) {
        this.initRedis();
      }
    }, delay);
  }

  async get(key: string): Promise<any | null> {
    // Skip Redis attempts if we know it's permanently unavailable
    if (this.redisAvailable && this.isRedisConnected && this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        // Only log occasional errors to avoid spam
        const now = Date.now();
        if (now - this.lastErrorLog > 30000 && this.connectionAttempts <= this.maxConnectionAttempts) {
          console.log('Cache: Redis get error, using in-memory cache');
          this.lastErrorLog = now;
        }
        this.isRedisConnected = false;
        // Don't schedule reconnect from get/set operations to avoid spam
      }
    }

    return this.inMemoryCache.get(key);
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    // Skip Redis attempts if we know it's permanently unavailable
    if (this.redisAvailable && this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        // Also store in memory cache as backup
        this.inMemoryCache.set(key, value, ttlSeconds);
        return;
      } catch (error) {
        const now = Date.now();
        if (now - this.lastErrorLog > 30000 && this.connectionAttempts <= this.maxConnectionAttempts) {
          console.log('Cache: Redis set error, using in-memory cache');
          this.lastErrorLog = now;
        }
        this.isRedisConnected = false;
        // Don't schedule reconnect from get/set operations to avoid spam
      }
    }

    this.inMemoryCache.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    // Skip Redis attempts if we know it's unavailable
    if (this.redisAvailable && this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        const now = Date.now();
        if (now - this.lastErrorLog > 30000) {
          console.log('Cache: Redis delete error');
          this.lastErrorLog = now;
        }
        this.isRedisConnected = false;
      }
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
  // Disable caching during tests to avoid flakiness and stale data
  if (process.env.JEST_WORKER_ID) {
    return fn();
  }
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
