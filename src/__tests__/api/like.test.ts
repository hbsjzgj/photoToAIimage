/**
 * Integration tests for POST /api/works/[id]/like.
 * Verifies: auth guard, not-found guard, like/unlike toggle, likeCount update.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { POST } from '@/app/api/works/[id]/like/route';

const {
  mockVariantFindUnique,
  mockVariantUpdate,
  mockLikeFindUnique,
  mockLikeCreate,
  mockLikeDelete,
  mockTransaction,
} = vi.hoisted(() => ({
  mockVariantFindUnique: vi.fn(),
  mockVariantUpdate: vi.fn(),
  mockLikeFindUnique: vi.fn(),
  mockLikeCreate: vi.fn(),
  mockLikeDelete: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectVariant: {
      findUnique: mockVariantFindUnique,
      update: mockVariantUpdate,
    },
    like: {
      findUnique: mockLikeFindUnique,
      create: mockLikeCreate,
      delete: mockLikeDelete,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

function makeReq(variantId: string) {
  return [
    new Request(`http://localhost/api/works/${variantId}/like`, { method: 'POST' }),
    { params: { id: variantId } },
  ] as const;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
});

describe('POST /api/works/[id]/like — auth guard', () => {
  it('returns 401 when not authenticated', async () => {
    const [req, ctx] = makeReq('v1');
    const res = await POST(req as never, ctx);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('notLoggedIn');
  });
});

describe('POST /api/works/[id]/like — variant guard', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }, expires: '',
    } as never);
  });

  it('returns 404 when variant does not exist', async () => {
    mockVariantFindUnique.mockResolvedValue(null);
    const [req, ctx] = makeReq('nonexistent');
    const res = await POST(req as never, ctx);
    expect(res.status).toBe(404);
  });

  it('returns 404 when variant is not public', async () => {
    mockVariantFindUnique.mockResolvedValue({ id: 'v1', isPublic: false });
    const [req, ctx] = makeReq('v1');
    const res = await POST(req as never, ctx);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/works/[id]/like — toggle behavior', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }, expires: '',
    } as never);
    mockVariantFindUnique.mockResolvedValue({ id: 'v1', isPublic: true });
  });

  it('creates a like when user has not liked yet', async () => {
    mockLikeFindUnique.mockResolvedValue(null); // not liked
    // $transaction receives an array: [like.create result, projectVariant.update result]
    mockTransaction.mockResolvedValue([
      { id: 'like-new', userId: 'user-1', variantId: 'v1' },
      { likeCount: 1 },
    ]);

    const [req, ctx] = makeReq('v1');
    const res = await POST(req as never, ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.liked).toBe(true);
    expect(body.likeCount).toBe(1);
  });

  it('removes like when user already liked', async () => {
    mockLikeFindUnique.mockResolvedValue({ id: 'like-1' }); // already liked
    mockTransaction.mockResolvedValue([
      {}, // deleted like
      { likeCount: 0 },
    ]);

    const [req, ctx] = makeReq('v1');
    const res = await POST(req as never, ctx);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.liked).toBe(false);
    expect(body.likeCount).toBe(0);
  });

  it('response contains numeric likeCount', async () => {
    mockLikeFindUnique.mockResolvedValue(null);
    mockTransaction.mockResolvedValue([{}, { likeCount: 42 }]);

    const [req, ctx] = makeReq('v1');
    const res = await POST(req as never, ctx);
    const body = await res.json();
    expect(typeof body.likeCount).toBe('number');
    expect(body.likeCount).toBe(42);
  });

  it('uses $transaction for atomic like + likeCount update', async () => {
    mockLikeFindUnique.mockResolvedValue(null);
    mockTransaction.mockResolvedValue([{}, { likeCount: 1 }]);

    const [req, ctx] = makeReq('v1');
    await POST(req as never, ctx);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // The array passed to $transaction should contain two operations
    const ops = mockTransaction.mock.calls[0][0];
    expect(Array.isArray(ops)).toBe(true);
    expect(ops).toHaveLength(2);
  });
});
