// lib/cache-utils.js - Utility functions for cache management

export class CacheManager {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.timers = new Map();
    this.defaultTTL = ttl;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set cache value
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    return this.cache.get(key).value;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  deletePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, { timestamp }]) => ({
        key,
        age: Date.now() - timestamp
      }))
    };
  }
}

// Create global cache instance
export const globalCache = typeof window !== 'undefined' 
  ? new CacheManager()
  : null;

// React Hook for cache management
export function useCacheInvalidation() {
  return (pattern) => {
    if (globalCache) {
      globalCache.deletePattern(pattern);
    }
  };
}

// Server-side cache for API responses (Node.js)
class ServerCacheManager {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  deletePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const serverCache = new ServerCacheManager();

// Caching decorator for async functions
export function withCache(fn, ttl = 5 * 60 * 1000) {
  return async function cachedFn(...args) {
    const key = `${fn.name}:${JSON.stringify(args)}`;

    // Check server cache first
    if (typeof window === 'undefined') {
      const cached = serverCache.get(key);
      if (cached) {
        return cached;
      }

      const result = await fn.apply(this, args);
      serverCache.set(key, result, ttl);
      return result;
    }

    // Browser cache
    if (globalCache?.has(key)) {
      return globalCache.get(key);
    }

    const result = await fn.apply(this, args);
    globalCache?.set(key, result, ttl);
    return result;
  };
}
