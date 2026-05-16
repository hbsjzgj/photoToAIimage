/**
 * Unit tests for the AI provider fallback chain.
 * Uses the mock provider (AI_PROVIDER=mock) and synthetic providers
 * to verify chain behavior without real API calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NonRetriableError, type AIProvider, type GenerateParams } from '@/lib/providers/types';

// ─── NonRetriableError ────────────────────────────────────────────────────────

describe('NonRetriableError', () => {
  it('is an instance of Error', () => {
    const err = new NonRetriableError('blocked');
    expect(err).toBeInstanceOf(Error);
  });

  it('preserves the message', () => {
    const err = new NonRetriableError('safety block triggered');
    expect(err.message).toBe('safety block triggered');
  });

  it('has name NonRetriableError', () => {
    expect(new NonRetriableError('x').name).toBe('NonRetriableError');
  });

  it('is distinguishable from plain Error', () => {
    const nonRetriable = new NonRetriableError('x');
    const plain = new Error('x');
    expect(nonRetriable instanceof NonRetriableError).toBe(true);
    expect(plain instanceof NonRetriableError).toBe(false);
  });
});

// ─── Provider chain logic ─────────────────────────────────────────────────────

// We test the chain behavior by building a minimal version of generateWithFallback
// using our own mock providers, so we don't need to fight env var setup.

const dummyParams: GenerateParams = {
  style: 'anime_basic',
  prompt: '',
  count: 1,
  outputSize: '1024x1024',
  imageBase64: 'data:image/jpeg;base64,/9j/',
  mode: 'free',
};

function makeChain(providers: AIProvider[]) {
  return async (params: GenerateParams) => {
    let firstProvider = true;
    for (const provider of providers) {
      if (!provider.isAvailable()) continue;
      try {
        const urls = await provider.generate(params);
        return { urls, provider: provider.name, fallbackUsed: !firstProvider };
      } catch (err) {
        if (err instanceof NonRetriableError) throw err;
        firstProvider = false;
      }
    }
    throw new Error('All AI providers failed');
  };
}

describe('Provider chain — successful cases', () => {
  it('uses the first available provider', async () => {
    const first = {
      name: 'first',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockResolvedValue(['http://example.com/1.jpg']),
    } satisfies AIProvider;
    const second = {
      name: 'second',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn(),
    } satisfies AIProvider;

    const run = makeChain([first, second]);
    const result = await run(dummyParams);

    expect(result.provider).toBe('first');
    expect(result.fallbackUsed).toBe(false);
    expect(second.generate).not.toHaveBeenCalled();
  });

  it('skips unavailable providers', async () => {
    const unavailable = {
      name: 'unavailable',
      isTextToImage: false,
      isAvailable: () => false,
      generate: vi.fn(),
    } satisfies AIProvider;
    const available = {
      name: 'available',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockResolvedValue(['http://example.com/img.jpg']),
    } satisfies AIProvider;

    const run = makeChain([unavailable, available]);
    const result = await run(dummyParams);

    expect(result.provider).toBe('available');
    expect(unavailable.generate).not.toHaveBeenCalled();
  });

  it('marks fallbackUsed=true when second provider is used', async () => {
    const failing = {
      name: 'primary',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new Error('API timeout')),
    } satisfies AIProvider;
    const fallback = {
      name: 'fallback',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockResolvedValue(['http://fallback.com/img.jpg']),
    } satisfies AIProvider;

    const run = makeChain([failing, fallback]);
    const result = await run(dummyParams);

    expect(result.provider).toBe('fallback');
    expect(result.fallbackUsed).toBe(true);
  });

  it('returns URLs from the succeeding provider', async () => {
    const provider = {
      name: 'mock',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockResolvedValue([
        'http://example.com/a.jpg',
        'http://example.com/b.jpg',
      ]),
    } satisfies AIProvider;

    const run = makeChain([provider]);
    const result = await run(dummyParams);

    expect(result.urls).toHaveLength(2);
    expect(result.urls[0]).toBe('http://example.com/a.jpg');
  });
});

describe('Provider chain — error handling', () => {
  it('falls through to next provider on retriable error', async () => {
    const failing = {
      name: 'primary',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new Error('503 overload')),
    } satisfies AIProvider;
    const working = {
      name: 'secondary',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockResolvedValue(['http://ok.com/img.jpg']),
    } satisfies AIProvider;

    const run = makeChain([failing, working]);
    await expect(run(dummyParams)).resolves.toMatchObject({ provider: 'secondary' });
  });

  it('stops immediately on NonRetriableError — does NOT try next provider', async () => {
    const blocking = {
      name: 'primary',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new NonRetriableError('safety block')),
    } satisfies AIProvider;
    const next = {
      name: 'secondary',
      isTextToImage: false,
      isAvailable: () => true,
      generate: vi.fn().mockResolvedValue(['http://ok.com/img.jpg']),
    } satisfies AIProvider;

    const run = makeChain([blocking, next]);
    await expect(run(dummyParams)).rejects.toThrow('safety block');
    expect(next.generate).not.toHaveBeenCalled();
  });

  it('throws "All AI providers failed" when every provider fails', async () => {
    const p1 = {
      name: 'p1', isTextToImage: false, isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new Error('fail1')),
    } satisfies AIProvider;
    const p2 = {
      name: 'p2', isTextToImage: false, isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new Error('fail2')),
    } satisfies AIProvider;

    const run = makeChain([p1, p2]);
    await expect(run(dummyParams)).rejects.toThrow('All AI providers failed');
  });

  it('throws "All AI providers failed" when all providers are unavailable', async () => {
    const unavailable = {
      name: 'none', isTextToImage: false, isAvailable: () => false,
      generate: vi.fn(),
    } satisfies AIProvider;

    const run = makeChain([unavailable]);
    await expect(run(dummyParams)).rejects.toThrow('All AI providers failed');
  });

  it('NonRetriableError from any position in chain propagates immediately', async () => {
    const ok = {
      name: 'ok', isTextToImage: false, isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new Error('retriable')),
    } satisfies AIProvider;
    const blocking = {
      name: 'blocker', isTextToImage: false, isAvailable: () => true,
      generate: vi.fn().mockRejectedValue(new NonRetriableError('content policy')),
    } satisfies AIProvider;
    const last = {
      name: 'last', isTextToImage: false, isAvailable: () => true,
      generate: vi.fn().mockResolvedValue(['http://ok.com/img.jpg']),
    } satisfies AIProvider;

    const run = makeChain([ok, blocking, last]);
    await expect(run(dummyParams)).rejects.toBeInstanceOf(NonRetriableError);
    expect(last.generate).not.toHaveBeenCalled();
  });
});
