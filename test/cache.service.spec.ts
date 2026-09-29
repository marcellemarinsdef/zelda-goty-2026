import { describe, expect, it } from 'vitest';
import { InMemoryCacheService } from '../src/services/cache.service';

describe('InMemoryCacheService', () => {
  it('should store and retrieve values correctly', () => {
    const cache = new InMemoryCacheService<string>();
    cache.set('hero', 'Link');

    expect(cache.has('hero')).toBe(true);
    expect(cache.get('hero')).toBe('Link');
  });

  it('should return undefined for non-existent keys', () => {
    const cache = new InMemoryCacheService<number>();
    expect(cache.get('missing')).toBeUndefined();
    expect(cache.has('missing')).toBe(false);
  });

  it('should delete and clear cached values', () => {
    const cache = new InMemoryCacheService<string>();
    cache.set('item1', 'sword');
    cache.set('item2', 'shield');

    cache.delete('item1');
    expect(cache.has('item1')).toBe(false);
    expect(cache.has('item2')).toBe(true);

    cache.clear();
    expect(cache.has('item2')).toBe(false);
  });
});
