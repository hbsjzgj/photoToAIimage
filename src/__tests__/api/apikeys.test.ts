/**
 * Integration tests for /api/settings/apikeys (GET, POST, DELETE).
 * Verifies: auth guard, key creation (hash not returned), 5-key limit,
 * soft revoke, ownership enforcement.
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
  vi.mocked(getServerSession).mockResolvedValue(null);
});

// ─── Auth guards ──────────────────────────────────────────────────────────────

describe('/api/settings/apikeys — auth guard', () => {
  it('GET returns 401 when not authenticated', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('POST returns 401 when not authenticated', async () => {
    const res = await POST(makePostReq({ name: 'test' }) as never);
    expect(res.status).toBe(401);
  });

  it('DELETE returns 401 when not authenticated', async () => {
    const [req, ctx] = makeDeleteReq('k1');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(401);
  });
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe('GET /api/settings/apikeys', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(authedSession as never);
  });

  it('returns list of active keys', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'k1', keyPrefix: 'fma_abc12', name: 'My App', monthlyLimit: 100, usedThisMonth: 5, lastUsedAt: null, createdAt: new Date() },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keys).toHaveLength(1);
    expect(body.keys[0].id).toBe('k1');
  });

  it('response keys do NOT include keyHash (security)', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'k1', keyPrefix: 'fma_abc12', name: 'Test', monthlyLimit: 100, usedThisMonth: 0, lastUsedAt: null, createdAt: new Date() },
    ]);

    const res = await GET();
    const body = await res.json();
    expect(body.keys[0]).not.toHaveProperty('keyHash');
  });

  it('only fetches keys belonging to the session user', async () => {
    mockFindMany.mockResolvedValue([]);
    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', isActive: true } }),
    );
  });

  it('returns empty array when user has no keys', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    const body = await res.json();
    expect(body.keys).toEqual([]);
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe('POST /api/settings/apikeys', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(authedSession as never);
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: 'k1' });
  });

  it('creates a key and returns the raw key once', async () => {
    const res = await POST(makePostReq({ name: 'My App' }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.key).toBeDefined();
    expect(typeof body.key).toBe('string');
    expect(body.key).toMatch(/^fma_/); // key prefix
  });

  it('key is exactly 68 chars (fma_ + 64 hex chars)', async () => {
    const res = await POST(makePostReq({ name: 'My App' }) as never);
    const { key } = await res.json();
    expect(key.length).toBe(4 + 64); // 'fma_' + 32 bytes as 64 hex chars
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makePostReq({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('missingName');
  });

  it('enforces max 5 active keys per user', async () => {
    mockCount.mockResolvedValue(5);
    const res = await POST(makePostReq({ name: 'Sixth Key' }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('tooManyKeys');
  });

  it('stores keyHash (not raw key) in DB', async () => {
    await POST(makePostReq({ name: 'My App' }) as never);
    const createArg = mockCreate.mock.calls[0][0].data;
    // keyHash should be a 64-char hex string (SHA-256)
    expect(createArg.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(createArg.keyHash).not.toMatch(/^fma_/);
  });

  it('stores keyPrefix matching the raw key prefix', async () => {
    const res = await POST(makePostReq({ name: 'My App' }) as never);
    const { key } = await res.json();
    const createArg = mockCreate.mock.calls[0][0].data;
    expect(key.startsWith(createArg.keyPrefix)).toBe(true);
  });

  it('respects monthlyLimit param (clamped to 10000)', async () => {
    await POST(makePostReq({ name: 'App', monthlyLimit: 500 }) as never);
    expect(mockCreate.mock.calls[0][0].data.monthlyLimit).toBe(500);
  });

  it('clamps monthlyLimit to 10000 max', async () => {
    await POST(makePostReq({ name: 'App', monthlyLimit: 99999 }) as never);
    expect(mockCreate.mock.calls[0][0].data.monthlyLimit).toBe(10000);
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe('DELETE /api/settings/apikeys/[id]', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(authedSession as never);
  });

  it('soft-revokes (isActive=false) when user owns the key', async () => {
    mockFindUnique.mockResolvedValue({ id: 'k1', userId: 'user-1', isActive: true });
    mockUpdate.mockResolvedValue({ id: 'k1', isActive: false });

    const [req, ctx] = makeDeleteReq('k1');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'k1' },
      data: { isActive: false },
    });
  });

  it('returns 404 when key does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    const [req, ctx] = makeDeleteReq('missing');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(404);
  });

  it('returns 404 when user does not own the key', async () => {
    mockFindUnique.mockResolvedValue({ id: 'k1', userId: 'other-user' });
    const [req, ctx] = makeDeleteReq('k1');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
