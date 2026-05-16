import { vi } from 'vitest';

// Stub Next.js server internals that can't run outside the framework
vi.mock('next/server', async () => {
  const { Request, Response, Headers } = await import('node:http').then(() =>
    ({ Request: globalThis.Request, Response: globalThis.Response, Headers: globalThis.Headers })
  ).catch(() => ({ Request: undefined, Response: undefined, Headers: undefined }));

  class NextRequest extends globalThis.Request {
    public nextUrl: URL;
    constructor(input: string | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();
      super(url, init);
      this.nextUrl = new URL(url);
    }
  }

  class NextResponse extends globalThis.Response {
    static json(data: unknown, init?: ResponseInit) {
      return new NextResponse(JSON.stringify(data), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      });
    }
    static redirect(url: string, init?: number | ResponseInit) {
      const status = typeof init === 'number' ? init : (init?.status ?? 302);
      return new NextResponse(null, { status, headers: { location: url } });
    }
    static next() {
      return new NextResponse(null, { status: 200 });
    }
  }

  return { NextRequest, NextResponse };
});

// next-auth mock: session is null by default; tests override per test
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: { children: unknown }) => children,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'ja'),
}));
