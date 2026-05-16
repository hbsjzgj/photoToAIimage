/**
 * Integration tests for GET /api/gallery.
 * Mocks Prisma and NextAuth so no real DB is needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { GET } from '@/app/api/gallery/route';

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const { mockFindMany, mockCount, mockUserFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
  mockUserFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectVariant: {
      findMany: mockFindMany,
      count: mockCount,
    },
    user: {
      findMany: mockUserFindMany,
    },
  },
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVariant(id: string, likeCount = 0) {
  return {
    id,
    imageUrl: `https://cdn.example.com/${id}.jpg`,
    title: null,
    likeCount,
    viewCount: 0,
    isPublic: true,
    createdAt: new Date('2025-01-01'),
    project: { style: 'anime_basic', userId: 'user-1' },
    likes: [],
  };
}

function makeUser(id: string) {
  return { id, username: 'testuser', name: 'Test User', avatarUrl: null };
}

function makeReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/gallery');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
  mockUserFindMany.mockResolvedValue([makeUser('user-1')]);
  mockCount.mockResolvedValue(0);
  mockFindMany.mockResolvedValue([]);
});

describe('GET /api/gallery — basic', () => {
  it('returns 200 with items array', async () => {
    mockFindMany.mockResolvedValue([makeVariant('v1'), makeVariant('v2')]);
    mockCount.mockResolvedValue(2);

    const res = await GET(makeReq() as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
  });

  it('returns empty items when gallery is empty', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await GET(makeReq() as never);
    const body = await res.json();
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('each item has expected shape', async () => {
    mockFindMany.mockResolvedValue([makeVariant('v1', 5)]);
    mockCount.mockResolvedValue(1);

    const res = await GET(makeReq() as never);
    const { items } = await res.json();
    const item = items[0];

    expect(item).toHaveProperty('id', 'v1');
    expect(item).toHaveProperty('imageUrl');
    expect(item).toHaveProperty('likeCount', 5);
    expect(item).toHaveProperty('style', 'anime_basic');
    expect(item).toHaveProperty('liked', false);
    expect(item).toHaveProperty('user');
  });
});

describe('GET /api/gallery — pagination', () => {
  it('uses default page=1, limit=20', async () => {
    await GET(makeReq() as never);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it('respects explicit page and limit params', async () => {
    await GET(makeReq({ page: '2', limit: '10' }) as never);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('calculates pages correctly', async () => {
    mockCount.mockResolvedValue(45);

    const res = await GET(makeReq({ limit: '20' }) as never);
    const body = await res.json();
    expect(body.pages).toBe(3);
  });

  it('clamps limit to maximum 40', async () => {
    await GET(makeReq({ limit: '999' }) as never);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 40 }),
    );
  });
});

describe('GET /api/gallery — sorting', () => {
  it('defaults to newest sort', async () => {
    await GET(makeReq() as never);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('sort=likes orders by likeCount desc', async () => {
    await GET(makeReq({ sort: 'likes' }) as never);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { likeCount: 'desc' } }),
    );
  });
});

describe('GET /api/gallery — style filter', () => {
  it('passes style filter to where clause', async () => {
    await GET(makeReq({ style: 'ghibli' }) as never);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublic: true,
          project: { style: 'ghibli' },
        }),
      }),
    );
  });

  it('no style filter when style param is absent', async () => {
    await GET(makeReq() as never);
    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty('project');
  });
});

describe('GET /api/gallery — authenticated viewer', () => {
  it('includes liked status for authenticated users', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
      expires: '',
    } as never);

    const variantWithLike = {
      ...makeVariant('v1', 3),
      likes: [{ id: 'like-1' }],
    };
    mockFindMany.mockResolvedValue([variantWithLike]);
    mockCount.mockResolvedValue(1);

    const res = await GET(makeReq() as never);
    const { items } = await res.json();
    expect(items[0].liked).toBe(true);
  });

  it('liked=false when user has not liked', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' },
      expires: '',
    } as never);

    mockFindMany.mockResolvedValue([{ ...makeVariant('v1', 0), likes: [] }]);
    mockCount.mockResolvedValue(1);

    const res = await GET(makeReq() as never);
    const { items } = await res.json();
    expect(items[0].liked).toBe(false);
  });
});
