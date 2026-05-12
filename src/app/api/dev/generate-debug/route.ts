import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { generateAvatar } from '@/lib/generate';
import { addWatermark, fetchImageBuffer } from '@/lib/watermark';
import { getStorageProvider, getStorageProviderName } from '@/lib/storage';
import type { StyleId } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    usage: 'POST { imageBase64?: string, style?: string }',
    note: 'Omit imageBase64 to auto-use demo-1.jpg.',
    env: {
      AI_PROVIDER: process.env.AI_PROVIDER ?? '(not set)',
      FAL_KEY: process.env.FAL_KEY ? 'set' : 'not set',
      HUGGINGFACE_API_TOKEN: process.env.HUGGINGFACE_API_TOKEN ? 'set' : 'not set',
      storageProvider: getStorageProviderName(),
      VERCEL: process.env.VERCEL ? 'yes' : 'no',
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? 'false',
    },
  });
}

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log('[generate-debug]', msg);
    logs.push(msg);
  };

  try {
    const body = await req.json().catch(() => ({})) as { imageBase64?: string; style?: string };
    const style = (body.style ?? 'anime_basic') as StyleId;

    // Use provided imageBase64 or load demo-1.jpg from disk
    let imageBase64 = body.imageBase64 ?? '';
    if (!imageBase64) {
      log('No imageBase64 provided → loading demo-1.jpg from public/demo-results/');
      const demoPath = path.join(process.cwd(), 'public', 'demo-results', 'demo-1.jpg');
      const buf = await readFile(demoPath);
      imageBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
    }
    log(`imageBase64 length: ${imageBase64.length}`);
    log(`style: ${style}`);

    // Env state
    log(`AI_PROVIDER: ${process.env.AI_PROVIDER ?? '(not set)'}`);
    log(`FAL_KEY: ${process.env.FAL_KEY ? 'set' : 'not set'}`);
    log(`HUGGINGFACE_API_TOKEN: ${process.env.HUGGINGFACE_API_TOKEN ? 'set' : 'not set'}`);
    log(`storageProvider: ${getStorageProviderName()}`);
    log(`VERCEL: ${process.env.VERCEL ? 'yes' : 'no'}`);

    // ── Generate ──
    log('Calling generateAvatar...');
    const genStart = Date.now();
    const genResult = await generateAvatar(imageBase64, style, 1, '768x768');
    const durationMs = Date.now() - genStart;
    log(`generateAvatar OK — provider=${genResult.provider} duration=${durationMs}ms urls=[${genResult.urls.join(', ')}]`);

    let finalUrl = genResult.urls[0];
    let watermarkStatus: string = 'pending';
    let storageStatus: string = 'pending';

    // ── Watermark ──
    try {
      log(`fetchImageBuffer: ${finalUrl}`);
      const imgBuf = await fetchImageBuffer(finalUrl);
      log(`fetchImageBuffer OK: ${imgBuf.length} bytes`);

      const watermarked = await addWatermark(imgBuf);
      watermarkStatus = `success (${watermarked.length} bytes)`;
      log(`addWatermark OK: ${watermarked.length} bytes`);

      // ── Storage ──
      try {
        const filename = `debug_${crypto.randomUUID()}.png`;
        log(`getStorageProvider().upload → filename=${filename}`);
        const stored = await getStorageProvider().upload(watermarked, filename);
        log(`storage upload OK: ${stored}`);

        if (stored.startsWith('/api/outputs/') && !!process.env.VERCEL) {
          finalUrl = `data:image/png;base64,${watermarked.toString('base64')}`;
          storageStatus = 'success (Vercel LocalProvider → converted to data URL)';
          log('Vercel LocalProvider detected → using inline data URL');
        } else {
          finalUrl = stored;
          storageStatus = `success → ${stored}`;
        }
      } catch (storageErr) {
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
        storageStatus = `failed: ${msg}`;
        finalUrl = `data:image/png;base64,${watermarked.toString('base64')}`;
        log(`storage FAILED: ${msg} → using data URL`);
      }
    } catch (wmErr) {
      const msg = wmErr instanceof Error ? wmErr.message : String(wmErr);
      watermarkStatus = `failed: ${msg}`;
      storageStatus = 'skipped (watermark failed)';
      log(`watermark FAILED: ${msg} → using original URL`);
    }

    log(`finalUrl: ${finalUrl.startsWith('data:') ? 'data:image/png;base64,... (inline)' : finalUrl}`);

    return NextResponse.json({
      ok: true,
      provider: genResult.provider,
      durationMs,
      fallbackUsed: genResult.fallbackUsed,
      imageBase64Length: imageBase64.length,
      storageProvider: getStorageProviderName(),
      watermarkStatus,
      storageStatus,
      imageUrl: finalUrl,
      logs,
      error: null,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`FATAL: ${msg}`);
    console.error('[generate-debug] FATAL:', err);
    return NextResponse.json({
      ok: false,
      provider: null,
      imageBase64Length: 0,
      storageProvider: getStorageProviderName(),
      watermarkStatus: 'unknown',
      storageStatus: 'unknown',
      imageUrl: null,
      logs,
      error: msg,
    }, { status: 500 });
  }
}
