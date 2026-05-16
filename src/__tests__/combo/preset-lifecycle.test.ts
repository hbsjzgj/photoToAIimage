/**
 * Combination tests for the style preset lifecycle:
 * Create preset → List presets → Apply preset settings → Delete preset.
 * Verifies that data flows correctly across POST /api/presets → GET /api/presets → DELETE /api/presets/[id].
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePreset(overrides: Partial<{
  id: string; userId: string; name: string; styleId: string; outputSize: string; count: number;
}> = {}) {
  return {
    id: overrides.id ?? 'preset-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'My Anime Preset',
    styleId: overrides.styleId ?? 'anime_basic',
    outputSize: overrides.outputSize ?? '1024x1024',
    count: overrides.count ?? 1,
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

function makeDeleteReq(id: string) {
  return [
    new Request(`http://localhost/api/presets/${id}`, { method: 'DELETE' }),
    { params: { id } },
  ] as const;
}

const authedSession = { user: { id: 'user-1' }, expires: '' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(authedSession as never);
});

// ─── Full lifecycle ───────────────────────────────────────────────────────────

describe('preset lifecycle — create → list → delete', () => {
  it('creates a preset, then lists it, then deletes it successfully', async () => {
    const created = makePreset({ id: 'preset-new' });

    // Step 1: Create
    mockCreate.mockResolvedValue(created);
    const createRes = await POST(makePostReq({
      name: 'My Anime Preset',
      styleId: 'anime_basic',
      outputSize: '1024x1024',
      count: 1,
    }) as never);
    expect(createRes.status).toBe(200);
    const createBody = await createRes.json();
    expect(createBody.preset.id).toBe('preset-new');

    // Step 2: List — should include the newly created preset
    mockFindMany.mockResolvedValue([created]);
    const listRes = await GET();
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.presets).toHaveLength(1);
    expect(listBody.presets[0].id).toBe('preset-new');
    expect(listBody.presets[0].styleId).toBe('anime_basic');

    // Step 3: Delete
    mockFindUnique.mockResolvedValue(created);
    mockDelete.mockResolvedValue({});
    const [delReq, delCtx] = makeDeleteReq('preset-new');
    const deleteRes = await DELETE(delReq as never, delCtx);
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);

    // Delete called with correct id
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'preset-new' } });
  });

  it('list returns empty after all presets are deleted', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET();
    const body = await res.json();
    expect(body.presets).toEqual([]);
  });
});

// ─── Create + validate ────────────────────────────────────────────────────────

describe('preset lifecycle — create validation', () => {
  it('trims name whitespace before storing', async () => {
    mockCreate.mockResolvedValue(makePreset({ name: 'Clean Name' }));
    await POST(makePostReq({
      name: '  Clean Name  ',
      styleId: 'anime_basic',
      outputSize: '1024x1024',
    }) as never);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.name.startsWith(' ')).toBe(false);
    expect(data.name.endsWith(' ')).toBe(false);
  });

  it('truncates name to 50 characters', async () => {
    mockCreate.mockResolvedValue(makePreset());
    await POST(makePostReq({
      name: 'A'.repeat(80),
      styleId: 'anime_basic',
      outputSize: '1024x1024',
    }) as never);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.name.length).toBeLessThanOrEqual(50);
  });

  it('stores the userId from the authenticated session', async () => {
    mockCreate.mockResolvedValue(makePreset());
    await POST(makePostReq({
      name: 'Test',
      styleId: 'anime_basic',
      outputSize: '1024x1024',
    }) as never);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.userId).toBe('user-1');
  });

  it('defaults count to 1 when not provided', async () => {
    mockCreate.mockResolvedValue(makePreset());
    await POST(makePostReq({
      name: 'Test',
      styleId: 'anime_basic',
      outputSize: '1024x1024',
    }) as never);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.count).toBe(1);
  });
});

// ─── Ownership enforcement ────────────────────────────────────────────────────

describe('preset lifecycle — ownership enforcement', () => {
  it('GET only returns presets for the authenticated user', async () => {
    mockFindMany.mockResolvedValue([]);
    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  it('DELETE returns 404 when preset belongs to another user', async () => {
    mockFindUnique.mockResolvedValue(makePreset({ userId: 'other-user' }));
    const [req, ctx] = makeDeleteReq('preset-1');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('DELETE returns 404 when preset does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    const [req, ctx] = makeDeleteReq('nonexistent');
    const res = await DELETE(req as never, ctx);
    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

// ─── Multi-preset scenario ────────────────────────────────────────────────────

describe('preset lifecycle — multiple presets', () => {
  it('lists multiple presets sorted newest first (DB responsibility)', async () => {
    const presets = [
      makePreset({ id: 'p3', name: 'Newest' }),
      makePreset({ id: 'p2', name: 'Middle' }),
      makePreset({ id: 'p1', name: 'Oldest' }),
    ];
    mockFindMany.mockResolvedValue(presets);

    const res = await GET();
    const body = await res.json();
    expect(body.presets).toHaveLength(3);
    expect(body.presets[0].id).toBe('p3');
  });

  it('different users get isolated preset lists', async () => {
    // User 1
    mockFindMany.mockResolvedValue([makePreset({ userId: 'user-1' })]);
    const res1 = await GET();
    const body1 = await res1.json();
    expect(body1.presets[0].userId).toBe('user-1');

    // User 2
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-2' }, expires: '' } as never);
    mockFindMany.mockResolvedValue([makePreset({ userId: 'user-2', id: 'p2' })]);
    const res2 = await GET();
    const body2 = await res2.json();
    expect(body2.presets[0].userId).toBe('user-2');
  });
});
