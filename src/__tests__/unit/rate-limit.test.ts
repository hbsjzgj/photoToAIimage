/**
 * Unit tests for the in-memory rate limiter.
 * Uses unique key prefixes to avoid cross-test state pollution
 * (the store is module-level and persists within a test run).
 */
import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

let seq = 0;
const uid = () => `rl-test-${seq++}-${Math.random().toString(36).slice(2)}`;

describe('checkRateLimit — basic behavior', () => {
  it('allows the first request', () => {
    expect(checkRateLimit(uid(), 5, 10_000)).toBe(true);
  });

  it('allows every request while under the limit', () => {
    const k = uid();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(k, 5, 10_000)).toBe(true);
    }
  });

  it('blocks the request that exceeds the limit', () => {
    const k = uid();
    for (let i = 0; i < 3; i++) checkRateLimit(k, 3, 10_000);
    expect(checkRateLimit(k, 3, 10_000)).toBe(false);
  });

  it('continues to block on subsequent over-limit calls', () => {
    const k = uid();
    for (let i = 0; i < 2; i++) checkRateLimit(k, 2, 10_000);
    expect(checkRateLimit(k, 2, 10_000)).toBe(false);
    expect(checkRateLimit(k, 2, 10_000)).toBe(false);
  });

  it('limit=1 allows exactly one request then blocks', () => {
    const k = uid();
    expect(checkRateLimit(k, 1, 10_000)).toBe(true);
    expect(checkRateLimit(k, 1, 10_000)).toBe(false);
  });
});

describe('checkRateLimit — key isolation', () => {
  it('different keys are independent', () => {
    const k1 = uid();
    const k2 = uid();
    // Exhaust k1
    checkRateLimit(k1, 1, 10_000);
    checkRateLimit(k1, 1, 10_000); // blocked
    // k2 should still be free
    expect(checkRateLimit(k2, 1, 10_000)).toBe(true);
  });

  it('IP-style keys with common prefix are independent', () => {
    const base = uid();
    const k1 = `ip:${base}:192.168.1.1`;
    const k2 = `ip:${base}:192.168.1.2`;
    checkRateLimit(k1, 1, 10_000);
    expect(checkRateLimit(k2, 1, 10_000)).toBe(true);
  });
});

describe('checkRateLimit — window reset', () => {
  it('resets the counter after the window expires', async () => {
    const k = uid();
    // Exhaust within a 50ms window
    checkRateLimit(k, 1, 50);
    expect(checkRateLimit(k, 1, 50)).toBe(false);
    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 70));
    // New window — should allow again
    expect(checkRateLimit(k, 1, 50)).toBe(true);
  });

  it('does not reset before window expires', async () => {
    const k = uid();
    checkRateLimit(k, 1, 200);
    expect(checkRateLimit(k, 1, 200)).toBe(false);
    await new Promise((r) => setTimeout(r, 50));
    // Window not expired yet — still blocked
    expect(checkRateLimit(k, 1, 200)).toBe(false);
  });
});

describe('checkRateLimit — edge values', () => {
  it('limit=10 allows exactly 10 then blocks on 11th', () => {
    const k = uid();
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(k, 10, 10_000)).toBe(true);
    }
    expect(checkRateLimit(k, 10, 10_000)).toBe(false);
  });
});
