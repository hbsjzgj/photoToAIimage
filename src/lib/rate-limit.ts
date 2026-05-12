// In-memory fixed-window rate limiter.
// Per-Lambda-instance on Vercel (warm starts) — good enough for basic abuse prevention.
const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): boolean {
  const now = Date.now();

  // Lazy GC: prevent unbounded growth
  if (store.size > 500) {
    store.forEach((v, k) => {
      if (now > v.resetAt) store.delete(k);
    });
  }

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
