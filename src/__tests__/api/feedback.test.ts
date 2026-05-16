/**
 * Integration tests for POST /api/feedback.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { POST } from '@/app/api/feedback/route';

const { mockVariantFindUnique, mockFeedbackCreate } = vi.hoisted(() => ({
  mockVariantFindUnique: vi.fn(),
  mockFeedbackCreate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    projectVariant: { findUnique: mockVariantFindUnique },
    generationFeedback: { create: mockFeedbackCreate },
  },
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

function makeReq(body: Record<string, unknown>) {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
  mockVariantFindUnique.mockResolvedValue({ id: 'v1' });
  mockFeedbackCreate.mockResolvedValue({ id: 'fb-1' });
});

describe('POST /api/feedback — validation', () => {
  it('returns 400 when variantId is missing', async () => {
    const res = await POST(makeReq({ positive: true }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('missingFields');
  });

  it('returns 400 when positive is missing', async () => {
    const res = await POST(makeReq({ variantId: 'v1' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 when positive is not a boolean', async () => {
    const res = await POST(makeReq({ variantId: 'v1', positive: 'yes' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 404 when variant does not exist', async () => {
    mockVariantFindUnique.mockResolvedValue(null);
    const res = await POST(makeReq({ variantId: 'nonexistent', positive: true }) as never);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/feedback — positive feedback', () => {
  it('saves positive feedback without a reason', async () => {
    const res = await POST(makeReq({ variantId: 'v1', positive: true }) as never);
    expect(res.status).toBe(200);
    expect(mockFeedbackCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ variantId: 'v1', positive: true }),
    });
  });

  it('returns { success: true }', async () => {
    const res = await POST(makeReq({ variantId: 'v1', positive: true }) as never);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('sets userId from session when authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-42' }, expires: '',
    } as never);

    await POST(makeReq({ variantId: 'v1', positive: true }) as never);
    expect(mockFeedbackCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-42' }),
    });
  });

  it('sets userId to null when not authenticated', async () => {
    await POST(makeReq({ variantId: 'v1', positive: true }) as never);
    expect(mockFeedbackCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: null }),
    });
  });
});

describe('POST /api/feedback — negative feedback with reason', () => {
  it('saves negative feedback with reason', async () => {
    const res = await POST(makeReq({
      variantId: 'v1',
      positive: false,
      reason: 'tooMuchChange',
    }) as never);
    expect(res.status).toBe(200);
    expect(mockFeedbackCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        positive: false,
        reason: 'tooMuchChange',
      }),
    });
  });

  it('saves negative feedback without reason (reason is optional)', async () => {
    const res = await POST(makeReq({ variantId: 'v1', positive: false }) as never);
    expect(res.status).toBe(200);
    expect(mockFeedbackCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: null }),
    });
  });

  it.each(['tooMuchChange', 'tooSubtle', 'lowQuality', 'other'])(
    'accepts reason="%s"',
    async (reason) => {
      const res = await POST(makeReq({ variantId: 'v1', positive: false, reason }) as never);
      expect(res.status).toBe(200);
    },
  );
});
