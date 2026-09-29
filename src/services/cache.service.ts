export interface ICacheService<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlSeconds?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class InMemoryCacheService<T> implements ICacheService<T> {
  private readonly storage = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlSeconds: number;

  constructor(defaultTtlSeconds = 300) {
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  get(key: string): T | undefined {
    const entry = this.storage.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;
    this.storage.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
