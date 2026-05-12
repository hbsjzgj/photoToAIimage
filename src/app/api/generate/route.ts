import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAvatar } from '@/lib/generate';
import { addWatermark, fetchImageBuffer } from '@/lib/watermark';
import { spendCredits, getCredits } from '@/lib/credits';
import { canUseFree, incrementFreeUsage } from '@/lib/usage';
import { FREE_STYLES, GenerateRequest, FREE_OUTPUT_SIZE } from '@/types';
import { getStorageProvider, getStorageProviderName } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const IS_PROD = process.env.NODE_ENV === 'production';

// Prompt safety filter — server-side second check (frontend enforces too)
const BLOCKED_TERMS = /\b(nude|nsfw|explicit|porn|pornographic|violence|gore|naked|hentai)\b/i;

function sanitizePrompt(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().slice(0, 200);
  if (!trimmed) return undefined;
  if (BLOCKED_TERMS.test(trimmed)) throw new Error('promptRejected');
  return trimmed;
}

export async function POST(req: NextRequest) {
  const debugLogs: string[] = [];
  let currentStage = 'init';

  const log = (msg: string) => {
    const entry = `[${currentStage}] ${msg}`;
    console.log('[generate]', entry);
    debugLogs.push(entry);
  };

  // Hide internals from production responses
  const fail = (status: number, error: string, extra?: Record<string, unknown>) =>
    NextResponse.json({
      success: false,
      error,
      ...(!IS_PROD ? { stage: currentStage } : {}),
      ...(!IS_PROD ? { debug: { logs: debugLogs, storageProvider: getStorageProviderName() } } : {}),
      ...extra,
    }, { status });

  try {
    // ── IP Rate Limit — 10 req/min ──────────────────────────
    currentStage = 'ipRateLimit';
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';
    if (!checkRateLimit(`gen:${ip}`, 10, 60_000)) {
      log(`IP rate limit exceeded: ${ip}`);
      return fail(429, 'rateLimited');
    }

    currentStage = 'session';
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    currentStage = 'parse';
    const body: GenerateRequest & { customPrompt?: string } = await req.json();
    const { imageBase64, style, mode, count, outputSize } = body;

    // Sanitize custom prompt (throws promptRejected if blocked)
    const customPrompt = sanitizePrompt(body.customPrompt);

    log(`request received — style=${style} mode=${mode} imageBase64Length=${imageBase64?.length ?? 0}`);
    if (!IS_PROD) {
      log(`AI_PROVIDER=${process.env.AI_PROVIDER ?? '(not set)'} HF_TOKEN=${process.env.HUGGINGFACE_API_TOKEN ? 'set' : 'not set'}`);
      log(`storageProvider=${getStorageProviderName()} VERCEL=${process.env.VERCEL ? 'yes' : 'no'}`);
    }

    if (!imageBase64 || !style) {
      log('ERROR: missing required fields');
      return fail(400, 'Missing required fields');
    }

    // ── FREE MODE ─────────────────────────────────────────────
    if (mode === 'free') {
      if (!FREE_STYLES.includes(style as never)) {
        log(`ERROR: style "${style}" not available in free mode`);
        return fail(403, 'Style not available in free mode');
      }

      currentStage = 'rateLimit';
      const anonymousId = userId ? undefined : ip;
      log(`checking daily limit — userId=${userId ?? 'anon'} ip=${ip}`);

      const allowed = await canUseFree(userId, anonymousId);
      if (!allowed) {
        log('ERROR: daily limit reached');
        return fail(429, 'limitReached');
      }
      log('daily limit OK');

      currentStage = 'generate';
      log('calling generateAvatar...');
      const genResult = await generateAvatar(imageBase64, style, 1, FREE_OUTPUT_SIZE, customPrompt);
      const { urls, provider: providerUsed, isTextToImage } = genResult;
      log(`generation SUCCESS — provider=${providerUsed} urls=[${urls.join(', ')}]`);

      const finalUrls: string[] = [];
      for (const url of urls) {
        let finalUrl = url;

        if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
          currentStage = 'watermark';
          try {
            log(`fetchImageBuffer: ${url}`);
            const buf = await fetchImageBuffer(url);
            log(`fetchImageBuffer OK: ${buf.length} bytes`);

            const watermarked = await addWatermark(buf);
            log(`addWatermark OK: ${watermarked.length} bytes`);

            currentStage = 'storage';
            try {
              const filename = `wm_${crypto.randomUUID()}.png`;
              const stored = await getStorageProvider().upload(watermarked, filename);
              log(`storage upload OK: ${stored}`);

              if (stored.startsWith('/api/outputs/') && !!process.env.VERCEL) {
                finalUrl = `data:image/png;base64,${watermarked.toString('base64')}`;
                log('Vercel + LocalProvider: converted to inline data URL');
              } else {
                finalUrl = stored;
              }
            } catch (storageErr) {
              const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
              log(`storage FAILED (non-fatal): ${msg} — using inline data URL`);
              finalUrl = `data:image/png;base64,${watermarked.toString('base64')}`;
            }
          } catch (wmErr) {
            const msg = wmErr instanceof Error ? wmErr.message : String(wmErr);
            log(`watermark FAILED (non-fatal): ${msg} — using original URL`);
          }
        }

        finalUrls.push(finalUrl);
        log(`finalUrl: ${finalUrl.startsWith('data:') ? 'data:image/png;base64,... (inline)' : finalUrl}`);
      }

      currentStage = 'persist';
      let projectId: string | null = null;
      if (userId) {
        try {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const project = await prisma.project.create({
            data: { userId, status: 'completed', inputImageUrl: 'uploaded', style, generationMode: 'free', creditsUsed: 0, outputSize: FREE_OUTPUT_SIZE, hasWatermark: true, expiresAt }
          });
          await Promise.all(finalUrls.map((u) => prisma.projectVariant.create({ data: { projectId: project.id, imageUrl: u } })));
          projectId = project.id;
          log(`DB persist OK: projectId=${projectId}`);
        } catch (dbErr) {
          log(`DB persist FAILED (non-fatal): ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
        }
      }

      try {
        await incrementFreeUsage(userId, anonymousId);
        log('incrementFreeUsage OK');
      } catch (e) {
        log(`incrementFreeUsage FAILED (non-fatal): ${e instanceof Error ? e.message : String(e)}`);
      }

      currentStage = 'complete';
      log('response: success');
      return NextResponse.json({
        success: true,
        projectId,
        variants: finalUrls.map((imageUrl, i) => ({ id: String(i), imageUrl })),
        creditsUsed: 0,
        hasWatermark: true,
        providerUsed,
        isDemo: isTextToImage,
        provider: providerUsed,
        imageUrl: finalUrls[0],
        ...(!IS_PROD ? { debug: { logs: debugLogs, storageProvider: getStorageProviderName() } } : {}),
      });
    }

    // ── PAID MODE ─────────────────────────────────────────────
    currentStage = 'auth';
    if (!userId) {
      log('ERROR: paid mode requires login');
      return fail(401, 'notLoggedIn');
    }

    currentStage = 'credits';
    const creditCost = count;
    const balance = await getCredits(userId);
    log(`credits: balance=${balance} required=${creditCost}`);
    if (balance < creditCost) {
      return fail(402, 'insufficientCredits', { balance });
    }

    currentStage = 'persist';
    const size = outputSize || '1024x1024';
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const project = await prisma.project.create({
      data: { userId, status: 'processing', inputImageUrl: 'uploaded', style, generationMode: 'paid', creditsUsed: creditCost, outputSize: size, hasWatermark: false, expiresAt }
    });
    const { success: spendOk } = await spendCredits(userId, creditCost, project.id, `Generate ${count} × ${style}`);
    if (!spendOk) {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'failed' } });
      return fail(402, 'insufficientCredits');
    }
    log(`credits spent OK: ${creditCost}`);

    currentStage = 'generate';
    log('calling generateAvatar (paid)...');
    const result = await generateAvatar(imageBase64, style, count, size, customPrompt);
    const { urls, provider: providerUsed, isTextToImage } = result;
    log(`generation SUCCESS — provider=${providerUsed} urlCount=${urls.length}`);

    currentStage = 'persist';
    const variants = await Promise.all(urls.map((url) => prisma.projectVariant.create({ data: { projectId: project.id, imageUrl: url } })));
    await prisma.project.update({ where: { id: project.id }, data: { status: 'completed' } });
    log('paid project persisted OK');

    currentStage = 'complete';
    return NextResponse.json({
      success: true,
      projectId: project.id,
      variants: variants.map((v) => ({ id: v.id, imageUrl: v.imageUrl })),
      creditsUsed: creditCost,
      hasWatermark: false,
      providerUsed,
      isDemo: isTextToImage,
      provider: providerUsed,
      imageUrl: variants[0]?.imageUrl,
      ...(!IS_PROD ? { debug: { logs: debugLogs, storageProvider: getStorageProviderName() } } : {}),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate] FATAL at stage', currentStage, ':', err);
    debugLogs.push(`[${currentStage}] FATAL: ${msg}`);

    // Surface specific known errors as proper codes
    const knownErrors: Record<string, number> = {
      nsfwContent: 400,
      promptRejected: 400,
    };
    if (msg in knownErrors) {
      return fail(knownErrors[msg], msg);
    }

    return NextResponse.json({
      success: false,
      error: 'generationFailed',
      ...(!IS_PROD ? { stage: currentStage, debug: { logs: debugLogs, storageProvider: getStorageProviderName() } } : {}),
    }, { status: 500 });
  }
}
