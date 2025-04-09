/**
 * Simple In-Memory Cache Utility
 */

interface CacheEntry<T> {
  value: T;
  expiry: number | null;
}

class InMemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Retrieves a value from the cache. If the value doesn't exist or is expired,
   * it calls the provided function to fetch the value, stores it in the cache,
   * and then returns it.
   * 
   * @param key The cache key.
   * @param fn The function to fetch the value if not cached or expired.
   * @param options Optional settings like Time-To-Live (TTL) in milliseconds.
   * @returns The cached or newly fetched value.
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const existingEntry = this.store.get(key);

    if (existingEntry && (existingEntry.expiry === null || existingEntry.expiry > Date.now())) {
      return existingEntry.value as T;
    }

    // Value not found or expired, fetch it
    const newValue = await fn();
    this.set(key, newValue, options?.ttl);
    return newValue;
  }

  /**
   * Sets a value in the cache with an optional TTL.
   * 
   * @param key The cache key.
   * @param value The value to store.
   * @param ttl Optional Time-To-Live in milliseconds.
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl : null;
    this.store.set(key, { value, expiry });
  }

  /**
   * Retrieves a value directly from the cache without checking expiry or fetching.
   * 
   * @param key The cache key.
   * @returns The cached value or undefined if not found.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry && (entry.expiry === null || entry.expiry > Date.now())) {
      return entry.value as T;
    }
    return undefined;
  }

  /**
   * Deletes a value from the cache.
   * 
   * @param key The cache key to delete.
   * @returns True if an element in the Map existed and has been removed, or false if the element does not exist.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.store.clear();
  }
}

// Export a singleton instance
const cache = new InMemoryCache();
export default cache; 