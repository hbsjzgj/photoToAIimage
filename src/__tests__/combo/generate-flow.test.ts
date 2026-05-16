/**
 * Combination tests for the POST /api/generate flow.
 * Verifies the full pipeline: rate limit → session → free/paid branch → mock AI → response.
 * All external dependencies (Prisma, AI providers, watermark, storage) are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { POST } from '@/app/api/generate/route';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  mockCheckRateLimit,
  mockGenerateAvatar,
  mockAddWatermark,
  mockFetchImageBuffer,
  mockStorageUpload,
  mockProjectCreate,
  mockProjectUpdate,
  mockVariantCreate,
  mockDailyUsageFindUnique,
  mockDailyUsageUpsert,
  mockUserCreditsFindUnique,
  mockUserCreditsUpdate,
  mockCreditTransactionCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn().mockReturnValue(true),
  mockGenerateAvatar: vi.fn().mockResolvedValue({
    urls: ['https://cdn.example.com/result.jpg'],
    provider: 'mock',
    fallbackUsed: false,
    durationMs: 100,
    isTextToImage: false,
  }),
  mockAddWatermark: vi.fn().mockResolvedValue(Buffer.from('wm')),
  mockFetchImageBuffer: vi.fn().mockResolvedValue(Buffer.from('img')),
  mockStorageUpload: vi.fn().mockResolvedValue('https://cdn.example.com/wm_result.png'),
  mockProjectCreate: vi.fn().mockResolvedValue({ id: 'proj-1' }),
  mockProjectUpdate: vi.fn().mockResolvedValue({ id: 'proj-1', status: 'completed' }),
  mockVariantCreate: vi.fn().mockResolvedValue({ id: 'var-1', imageUrl: 'https://cdn.example.com/result.jpg' }),
  mockDailyUsageFindUnique: vi.fn().mockResolvedValue(null),
  mockDailyUsageUpsert: vi.fn().mockResolvedValue({ freeGenerationsUsed: 1 }),
  mockUserCreditsFindUnique: vi.fn().mockResolvedValue({ creditsBalance: 50 }),
  mockUserCreditsUpdate: vi.fn().mockResolvedValue({ creditsBalance: 49 }),
  mockCreditTransactionCreate: vi.fn().mockResolvedValue({}),
  mockTransaction: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { create: mockProjectCreate, update: mockProjectUpdate },
    projectVariant: { create: mockVariantCreate },
    dailyUsage: {
      findUnique: mockDailyUsageFindUnique,
      upsert: mockDailyUsageUpsert,
    },
    userCredits: {
      findUnique: mockUserCreditsFindUnique,
      update: mockUserCreditsUpdate,
    },
    creditTransaction: { create: mockCreditTransactionCreate },
    $transaction: mockTransaction,
  },
}));

vi.mock('@/lib/generate', () => ({
  generateAvatar: mockGenerateAvatar,
}));

vi.mock('@/lib/watermark', () => ({
  addWatermark: mockAddWatermark,
  fetchImageBuffer: mockFetchImageBuffer,
}));

vi.mock('@/lib/storage', () => ({
  getStorageProvider: vi.fn(() => ({ upload: mockStorageUpload })),
  getStorageProviderName: vi.fn(() => 'local'),
}));

vi.mock('@/lib/translate', () => ({
  toEnglish: vi.fn((s: string) => Promise.resolve(s)),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: Record<string, unknown>, ip = '127.0.0.1') {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

const freeBody = {
  imageBase64: 'data:image/jpeg;base64,abc123',
  style: 'anime_basic',
  count: 1,
  outputSize: '768x768',
  mode: 'free',
};

const paidBody = {
  imageBase64: 'data:image/jpeg;base64,abc123',
  style: 'anime_basic',
  count: 1,
  outputSize: '1024x1024',
  mode: 'paid',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
  mockCheckRateLimit.mockReturnValue(true);
  mockDailyUsageFindUnique.mockResolvedValue(null);
  mockDailyUsageUpsert.mockResolvedValue({ freeGenerationsUsed: 1 });
  mockProjectCreate.mockResolvedValue({ id: 'proj-1' });
  mockProjectUpdate.mockResolvedValue({ id: 'proj-1', status: 'completed' });
  mockVariantCreate.mockResolvedValue({ id: 'var-1', imageUrl: 'https://cdn.example.com/result.jpg' });
  mockGenerateAvatar.mockResolvedValue({
    urls: ['https://cdn.example.com/result.jpg'],
    provider: 'mock',
    fallbackUsed: false,
    durationMs: 100,
    isTextToImage: false,
  });
  mockAddWatermark.mockResolvedValue(Buffer.from('wm'));
  mockFetchImageBuffer.mockResolvedValue(Buffer.from('img'));
  mockStorageUpload.mockResolvedValue('https://cdn.example.com/wm_result.png');
});

// ─── Rate limit ───────────────────────────────────────────────────────────────

describe('generate flow — IP rate limit', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValue(false);

    const res = await POST(makeReq(freeBody) as never);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('rateLimited');
  });

  it('passes through when rate limit allows', async () => {
    mockCheckRateLimit.mockReturnValue(true);

    const res = await POST(makeReq(freeBody) as never);
    expect(res.status).not.toBe(429);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe('generate flow — input validation', () => {
  it('returns 400 when imageBase64 is missing', async () => {
    const { imageBase64: _, ...body } = freeBody;
    const res = await POST(makeReq(body) as never);
    expect(res.status).toBe(400);
    const b = await res.json();
    expect(b.error).toBe('noImage');
  });

  it('returns 400 when style is missing', async () => {
    const { style: _, ...body } = freeBody;
    const res = await POST(makeReq(body) as never);
    expect(res.status).toBe(400);
    const b = await res.json();
    expect(b.error).toBe('noStyle');
  });
});

// ─── Free mode pipeline ───────────────────────────────────────────────────────

describe('generate flow — free mode', () => {
  it('returns 200 with variants array for anonymous free request', async () => {
    const res = await POST(makeReq(freeBody) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Free mode response uses `variants` (not `urls`)
    expect(Array.isArray(body.variants)).toBe(true);
    expect(body.variants.length).toBeGreaterThan(0);
    expect(body.variants[0]).toHaveProperty('imageUrl');
  });

  it('blocks style that is not in FREE_STYLES', async () => {
    const res = await POST(makeReq({ ...freeBody, style: 'luxury_oil' }) as never);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('styleForbidden');
  });

  it('returns 429 limitReached when daily free limit exhausted', async () => {
    // Simulate 3 prior uses (FREE_DAILY_LIMIT_ANON = 3)
    mockDailyUsageFindUnique.mockResolvedValue({ freeGenerationsUsed: 3 });

    const res = await POST(makeReq(freeBody) as never);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('limitReached');
  });

  it('calls generateAvatar exactly once with free mode', async () => {
    await POST(makeReq(freeBody) as never);
    expect(mockGenerateAvatar).toHaveBeenCalledTimes(1);
    const [, , , , , mode] = mockGenerateAvatar.mock.calls[0];
    expect(mode).toBe('free');
  });

  it('increments daily usage after successful free generation', async () => {
    await POST(makeReq(freeBody) as never);
    expect(mockDailyUsageUpsert).toHaveBeenCalledTimes(1);
  });
});

// ─── Paid mode pipeline ───────────────────────────────────────────────────────

describe('generate flow — paid mode', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1' }, expires: '',
    } as never);
    mockUserCreditsFindUnique.mockResolvedValue({ creditsBalance: 50 });
    // spendCredits uses an interactive $transaction (function-based)
    mockTransaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') {
        return fn({
          userCredits: {
            findUnique: async () => ({ creditsBalance: 50 }),
            update: async () => ({ creditsBalance: 49 }),
          },
          creditTransaction: { create: async () => ({}) },
          project: { update: async () => ({}) },
        });
      }
      // Array-based transaction (not used in paid mode generate)
      return fn;
    });
  });

  it('returns 200 for authenticated paid request with credits', async () => {
    const res = await POST(makeReq(paidBody) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('calls generateAvatar with paid mode for authenticated users', async () => {
    await POST(makeReq(paidBody) as never);
    expect(mockGenerateAvatar).toHaveBeenCalledTimes(1);
    const [, , , , , mode] = mockGenerateAvatar.mock.calls[0];
    expect(mode).toBe('paid');
  });
});

// ─── Prompt safety ────────────────────────────────────────────────────────────

describe('generate flow — prompt safety', () => {
  it.each(['nude', 'nsfw', 'explicit', 'porn', 'violence'])(
    'rejects customPrompt containing "%s"',
    async (term) => {
      const res = await POST(makeReq({ ...freeBody, customPrompt: `make it ${term}` }) as never);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('promptRejected');
    },
  );

  it('allows safe custom prompts', async () => {
    const res = await POST(makeReq({ ...freeBody, customPrompt: 'watercolor style' }) as never);
    expect(res.status).toBe(200);
  });
});

// ─── styleStrength forwarding ─────────────────────────────────────────────────

describe('generate flow — styleStrength', () => {
  it('passes styleStrength to generateAvatar (default 5)', async () => {
    await POST(makeReq(freeBody) as never);
    const args = mockGenerateAvatar.mock.calls[0];
    expect(args[7]).toBe(5);
  });

  it('clamps styleStrength to [1, 10]', async () => {
    await POST(makeReq({ ...freeBody, styleStrength: 99 }) as never);
    const args = mockGenerateAvatar.mock.calls[0];
    expect(args[7]).toBe(10);
  });

  it('accepts styleStrength within range', async () => {
    await POST(makeReq({ ...freeBody, styleStrength: 7 }) as never);
    const args = mockGenerateAvatar.mock.calls[0];
    expect(args[7]).toBe(7);
  });
});
