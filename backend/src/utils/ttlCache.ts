/**
 * Tiny in-process TTL cache for hot, read-only public endpoints.
 *
 * Purpose: cut repeated DB hits for popular public pages (instructor/course
 * profiles) so a shared/throttled cluster isn't hammered by every request.
 * It's per-process (each PM2 worker keeps its own copy) — that's fine: even a
 * short TTL collapses a burst of identical reads into one query per worker.
 *
 * Only successful results are cached — if the loader throws, nothing is stored,
 * so transient DB errors are never memoised.
 */

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

/** Hard cap so a flood of distinct keys can't grow memory unbounded. */
const MAX_ENTRIES = 5000;

function purgeExpired(now: number): void {
  for (const [k, e] of store) {
    if (e.expiresAt <= now) store.delete(k);
  }
}

/**
 * Return the cached value for `key`, or run `loader`, cache its result for
 * `ttlMs`, and return it. Concurrent callers may each run the loader once
 * before the first result lands — acceptable for read-only data.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await loader();

  if (store.size >= MAX_ENTRIES) purgeExpired(now);
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/** Drop every cached entry whose key starts with `prefix` (e.g. after a write). */
export function invalidateByPrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

/** Default TTL for public read caches (override with PUBLIC_CACHE_TTL_MS). */
export const PUBLIC_CACHE_TTL_MS = Math.max(
  1000,
  Number(process.env.PUBLIC_CACHE_TTL_MS) || 60_000,
);
