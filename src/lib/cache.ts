// Fast in-memory cache for performance optimization
// Redis disabled for faster startup times

// In-memory cache implementation
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
    const toDelete: string[] = [];

    // Remove expired entries
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // If still too many items, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const keys = Array.from(this.cache.keys());
      const toRemove = keys.slice(0, Math.floor(this.maxSize * 0.1)); // Remove 10%
      toRemove.forEach(key => this.cache.delete(key));
    }
  }

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

// Simple cache manager using only in-memory cache
class CacheManager {
  private inMemoryCache = new InMemoryCache();

  constructor() {
    console.log('Cache: Using in-memory cache only (Redis disabled for performance)');
  }

  async get(key: string): Promise<any | null> {
    return this.inMemoryCache.get(key);
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    this.inMemoryCache.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    this.inMemoryCache.delete(key);
  }

  async clear(): Promise<void> {
    this.inMemoryCache.clear();
  }

  getStats() {
    return {
      redis: {
        connected: false,
        client: false,
      },
      inMemory: this.inMemoryCache.getStats(),
    };
  }

  async disconnect(): Promise<void> {
    // No-op for in-memory cache
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

// Cache wrapper for functions with database retry support
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Disable caching during tests
  if (process.env.JEST_WORKER_ID) {
    return fn();
  }
  
  // Try to get from cache first
  const cached = await cache.get(key);
  if (cached !== null) {
    return cached as T;
  }

  // If not in cache, execute function with retry logic
  const result = await executeWithRetry(fn);
  
  // Cache the result
  await cache.set(key, result, ttlSeconds);
  
  return result;
}

// Helper function to execute database operations with retry logic
async function executeWithRetry<T>(operation: () => Promise<T>, retries: number = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = 
        error?.code === 'P1001' || // Prisma connection error
        error?.code === 'P2024' || // Prisma connection timeout
        error?.message?.includes('connection') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('terminating connection');
      
      if (isConnectionError && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`Database operation failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Should not reach here');
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

export default cache;