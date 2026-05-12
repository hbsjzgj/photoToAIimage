import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/providers';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    AI_PROVIDER: process.env.AI_PROVIDER ?? '(not set — auto chain)',
    HUGGINGFACE_API_TOKEN: process.env.HUGGINGFACE_API_TOKEN ? '✓ set' : '✗ not set',
    POLLINATIONS_ENABLED: process.env.POLLINATIONS_ENABLED ?? 'false',
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? 'false'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const style = (body.style as string) ?? 'anime';
    const prompt = (body.prompt as string) ?? 'portrait of a person, anime style';

    const result = await generateWithFallback({
      style,
      prompt,
      count: 1,
      outputSize: '512x512'
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      isTextToImage: result.isTextToImage,
      imageUrl: result.urls[0],
      durationMs: result.durationMs
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
