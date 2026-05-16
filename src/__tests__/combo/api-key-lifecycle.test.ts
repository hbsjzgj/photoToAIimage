/**
 * Combination tests for the API key lifecycle:
 * Create key → verify format → list keys (no hash exposed) → revoke key → verify revoked.
 * Tests cross-endpoint consistency: POST /api/settings/apikeys →
 *   GET /api/settings/apikeys → DELETE /api/settings/apikeys/[id].
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/settings/apikeys/route';
import { DELETE } from '@/app/api/settings/apikeys/[id]/route';

const { mockCount, mockCreate, mockFindMany, mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aPIKey: {
      count: mockCount,
      create: mockCreate,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePostReq(body: Record<string, unknown>) {
  return new Request('http://localhost/api/settings/apikeys', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteReq(id: string) {
  return [
    new Request(`http://localhost/api/settings/apikeys/${id}`, { method: 'DELETE' }),
    { params: { id } },
  ] as const;
}

const authedSession = { user: { id: 'user-1' }, expires: '' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(authedSession as never);
  mockCount.mockResolvedValue(0);
  mockCreate.mockResolvedValue({ id: 'key-1' });
});

// ─── Full lifecycle ───────────────────────────────────────────────────────────

describe('API key lifecycle — create → list → revoke', () => {
  it('creates a key, then lists it (without keyHash), then revokes it', async () => {
    // Step 1: Create key
    const createRes = await POST(makePostReq({ name: 'My App' }) as never);
    expect(createRes.status).toBe(200);
    const createBody = await createRes.json();
    const rawKey = createBody.key;

    // Verify raw key format: fma_ + 64 hex chars
    expect(rawKey).toMatch(/^fma_[0-9a-f]{64}$/);
    expect(rawKey.length).toBe(68); // 4 + 64

    // Verify hash was stored (not raw key)
    const storedData = mockCreate.mock.calls[0][0].data;
    expect(storedData.keyHash).not.toBe(rawKey);
    expect(storedData.keyHash).toMatch(/^[0-9a-f]{64}$/);

    // Step 2: List keys — keyHash must NOT appear in response
    mockFindMany.mockResolvedValue([{
      id: 'key-1',
      keyPrefix: rawKey.slice(0, 10),
      name: 'My App',
      monthlyLimit: 100,
      usedThisMonth: 0,
      lastUsedAt: null,
      createdAt: new Date(),
    }]);
    const listRes = await GET();
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.keys).toHaveLength(1);
    expect(listBody.keys[0]).not.toHaveProperty('keyHash');
    expect(listBody.keys[0].keyPrefix).toBe(rawKey.slice(0, 10));

    // Step 3: Revoke (soft-delete)
    mockFindUnique.mockResolvedValue({ id: 'key-1', userId: 'user-1', isActive: true });
    mockUpdate.mockResolvedValue({ id: 'key-1', isActive: false });
    const [delReq, delCtx] = makeDeleteReq('key-1');
    const deleteRes = await DELETE(delReq as never, delCtx);
    expect(deleteRes.status).toBe(200);

    // Verify soft-revoke (isActive set to false, not a hard delete)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { isActive: false },
    });
  });
});

// ─── Key format guarantees ────────────────────────────────────────────────────

describe('API key lifecycle — key format', () => {
  it('every created key starts with fma_', async () => {
    const res = await POST(makePostReq({ name: 'Test' }) as never);
    const { key } = await res.json();
    expect(key.startsWith('fma_')).toBe(true);
  });

  it('two created keys are different (collision extremely unlikely)', async () => {
    const res1 = await POST(makePostReq({ name: 'Key 1' }) as never);
    const res2 = await POST(makePostReq({ name: 'Key 2' }) as never);
    const k1 = (await res1.json()).key;
    const k2 = (await res2.json()).key;
    expect(k1).not.toBe(k2);
  });

  it('keyPrefix in DB matches beginning of raw key', async () => {
    const res = await POST(makePostReq({ name: 'Test' }) as never);
    const { key } = await res.json();
    const storedPrefix = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0].data.keyPrefix;
    expect(key.startsWith(storedPrefix)).toBe(true);
  });

  it('keyHash stored in DB is SHA-256 (64 hex chars)', async () => {
    await POST(makePostReq({ name: 'Test' }) as never);
    const { keyHash } = mockCreate.mock.calls[0][0].data;
    expect(keyHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ─── 5-key limit ─────────────────────────────────────────────────────────────

describe('API key lifecycle — 5-key limit', () => {
  it('allows creating up to 5 keys', async () => {
    for (let i = 0; i < 5; i++) {
      mockCount.mockResolvedValue(i);
      const res = await POST(makePostReq({ name: `Key ${i + 1}` }) as never);
      expect(res.status).toBe(200);
    }
  });

  it('blocks the 6th key with tooManyKeys', async () => {
    mockCount.mockResolvedValue(5);
    const res = await POST(makePostReq({ name: 'Sixth' }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('tooManyKeys');
  });

  it('does not call create when limit is reached', async () => {
    mockCount.mockResolvedValue(5);
    await POST(makePostReq({ name: 'Sixth' }) as never);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('allows a new key after revoking one (count drops below 5)', async () => {
    // Now only 4 active keys after a revoke
    mockCount.mockResolvedValue(4);
    const res = await POST(makePostReq({ name: 'Replacement' }) as never);
    expect(res.status).toBe(200);
  });
});

// ─── monthlyLimit clamping ────────────────────────────────────────────────────

describe('API key lifecycle — monthlyLimit', () => {
  it('defaults to 100 when not provided', async () => {
    await POST(makePostReq({ name: 'Test' }) as never);
    const { monthlyLimit } = mockCreate.mock.calls[0][0].data;
    expect(monthlyLimit).toBe(100);
  });

  it('accepts custom monthlyLimit', async () => {
    await POST(makePostReq({ name: 'Test', monthlyLimit: 500 }) as never);
    const { monthlyLimit } = mockCreate.mock.calls[0][0].data;
    expect(monthlyLimit).toBe(500);
  });

  it('clamps monthlyLimit to 10000 max', async () => {
    await POST(makePostReq({ name: 'Test', monthlyLimit: 99999 }) as never);
    const { monthlyLimit } = mockCreate.mock.calls[0][0].data;
    expect(monthlyLimit).toBe(10000);
  });
});

// ─── Ownership enforcement ────────────────────────────────────────────────────

describe('API key lifecycle — ownership', () => {
  it('DELETE returns 404 for a key owned by another user', async () => {
    mockFindUnique.mockResolvedValue({ id: 'key-x', userId: 'other-user', isActive: true });
    const [req, ctx] = makeDeleteReq('key-x');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('GET only fetches keys for the session user (userId filter)', async () => {
    mockFindMany.mockResolvedValue([]);
    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', isActive: true } }),
    );
  });
});
