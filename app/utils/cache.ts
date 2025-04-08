/**
 * Simple in-memory cache implementation
 */

type CacheItem<T> = {
  value: T;
  expiresAt: number | null;
};

type CacheOptions = {
  ttl?: number; // Time-to-live in milliseconds, null for no expiration
};

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // If item doesn't exist, return null
    if (!item) return null;
    
    // If item has expired, remove it and return null
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.DEFAULT_TTL;
    const expiresAt = ttl ? Date.now() + ttl : null;
    
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get a value from the cache or compute it if not present
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, options);
    return value;
  }

  /**
   * Helper to create a prefixed key
   */
  createKey(namespace: string, ...parts: (string | number)[]): string {
    return `${namespace}:${parts.join(':')}`;
  }
}

// Create a singleton instance
const cache = new MemoryCache();

export default cache; 