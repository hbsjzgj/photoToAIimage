/**
 * Integration tests for /api/presets (GET, POST) and /api/presets/[id] (DELETE).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/presets/route';
import { DELETE } from '@/app/api/presets/[id]/route';

const { mockFindMany, mockCreate, mockFindUnique, mockDelete } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stylePreset: {
      findMany: mockFindMany,
      create: mockCreate,
      findUnique: mockFindUnique,
      delete: mockDelete,
    },
  },
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

function makePreset(id = 'preset-1', userId = 'user-1') {
  return {
    id,
    userId,
    name: 'Summer Anime',
    styleId: 'anime_basic',
    outputSize: '1024x1024',
    count: 1,
    isPublic: false,
    useCount: 0,
    createdAt: new Date('2025-01-01'),
  };
}

function makePostReq(body: Record<string, unknown>) {
  return new Request('http://localhost/api/presets', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
});

// ─── Auth guard (all endpoints) ───────────────────────────────────────────────

describe('/api/presets — auth guard', () => {
  it('GET returns 401 when not authenticated', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('POST returns 401 when not authenticated', async () => {
    const res = await POST(makePostReq({ name: 'test', styleId: 'anime_basic', outputSize: '1024x1024' }) as never);
    expect(res.status).toBe(401);
  });

  it('DELETE returns 401 when not authenticated', async () => {
    const res = await DELETE(new Request('http://localhost/api/presets/p1', { method: 'DELETE' }) as never, { params: { id: 'p1' } });
    expect(res.status).toBe(401);
  });
});

// ─── GET ──────────────────────────────────────────────────────────────────────

describe('GET /api/presets', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }, expires: '',
    } as never);
  });

  it('returns user presets ordered by newest', async () => {
    mockFindMany.mockResolvedValue([makePreset('p1'), makePreset('p2')]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.presets).toHaveLength(2);
    expect(body.presets[0].id).toBe('p1');
  });

  it('only fetches presets belonging to the session user', async () => {
    mockFindMany.mockResolvedValue([]);
    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('returns empty array when user has no presets', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    const body = await res.json();
    expect(body.presets).toEqual([]);
  });
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe('POST /api/presets', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }, expires: '',
    } as never);
  });

  it('creates a preset with valid fields', async () => {
    const created = makePreset();
    mockCreate.mockResolvedValue(created);

    const res = await POST(makePostReq({
      name: 'Summer Anime',
      styleId: 'anime_basic',
      outputSize: '1024x1024',
      count: 1,
    }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.preset.id).toBe('preset-1');
    expect(body.preset.name).toBe('Summer Anime');
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makePostReq({ styleId: 'anime_basic', outputSize: '1024x1024' }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('missingFields');
  });

  it('returns 400 when styleId is missing', async () => {
    const res = await POST(makePostReq({ name: 'Test', outputSize: '1024x1024' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 when outputSize is missing', async () => {
    const res = await POST(makePostReq({ name: 'Test', styleId: 'anime_basic' }) as never);
    expect(res.status).toBe(400);
  });

  it('trims name and enforces 50-char limit', async () => {
    mockCreate.mockResolvedValue(makePreset());
    await POST(makePostReq({
      name: '  ' + 'A'.repeat(60) + '  ',
      styleId: 'anime_basic',
      outputSize: '1024x1024',
    }) as never);

    const createArg = mockCreate.mock.calls[0][0].data;
    expect(createArg.name.startsWith(' ')).toBe(false);
    expect(createArg.name.length).toBeLessThanOrEqual(50);
  });

  it('defaults count to 1 when not provided', async () => {
    mockCreate.mockResolvedValue(makePreset());
    await POST(makePostReq({ name: 'Test', styleId: 'anime_basic', outputSize: '1024x1024' }) as never);
    expect(mockCreate.mock.calls[0][0].data.count).toBe(1);
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe('DELETE /api/presets/[id]', () => {
  const authedSession = { user: { id: 'user-1' }, expires: '' };

  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(authedSession as never);
  });

  it('deletes the preset when user owns it', async () => {
    mockFindUnique.mockResolvedValue(makePreset('p1', 'user-1'));
    mockDelete.mockResolvedValue({});

    const res = await DELETE(
      new Request('http://localhost/api/presets/p1', { method: 'DELETE' }) as never,
      { params: { id: 'p1' } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 when preset does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await DELETE(
      new Request('http://localhost/api/presets/missing', { method: 'DELETE' }) as never,
      { params: { id: 'missing' } },
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when user does not own the preset', async () => {
    mockFindUnique.mockResolvedValue(makePreset('p1', 'other-user'));
    const res = await DELETE(
      new Request('http://localhost/api/presets/p1', { method: 'DELETE' }) as never,
      { params: { id: 'p1' } },
    );
    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
