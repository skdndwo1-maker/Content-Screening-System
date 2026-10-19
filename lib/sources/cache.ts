const TTL_MS = 24 * 60 * 60 * 1000;

type Entry<T> = { at: number; value: T };

const store = new Map<string, Entry<unknown>>();

export function cacheKey(query: string): string {
  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

export function cacheGet<T>(query: string): T | null {
  const key = cacheKey(query);
  const hit = store.get(key) as Entry<T> | undefined;
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet<T>(query: string, value: T) {
  store.set(cacheKey(query), { at: Date.now(), value });
}
