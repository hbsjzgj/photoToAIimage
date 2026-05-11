import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAvatar } from '@/lib/generate';
import { addWatermark, fetchImageBuffer } from '@/lib/watermark';
import { spendCredits, getCredits } from '@/lib/credits';
import { canUseFree, incrementFreeUsage } from '@/lib/usage';
import { FREE_STYLES, GenerateRequest, FREE_OUTPUT_SIZE } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    const body: GenerateRequest = await req.json();
    const { imageBase64, style, mode, count, outputSize } = body;

    if (!imageBase64 || !style) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── FREE MODE (no login required) ─────────────────────────
    if (mode === 'free') {
      if (!FREE_STYLES.includes(style as never)) {
        return NextResponse.json({ error: 'Style not available in free mode' }, { status: 403 });
      }

      // Use userId if logged in, otherwise use IP as anonymous identifier
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        req.headers.get('x-real-ip') ??
        'unknown';
      const anonymousId = userId ? undefined : ip;

      const allowed = await canUseFree(userId, anonymousId);
      if (!allowed) {
        return NextResponse.json({ error: 'limitReached' }, { status: 429 });
      }

      const genResult = await generateAvatar(imageBase64, style, 1, FREE_OUTPUT_SIZE);
      const { urls, provider: providerUsed, isTextToImage } = genResult;

      const finalUrls: string[] = [];
      for (const url of urls) {
        let finalUrl = url;
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
          try {
            const buf = await fetchImageBuffer(url);
            const watermarked = await addWatermark(buf);
            const isVercel = !!process.env.VERCEL;
            const outputsDir = isVercel
              ? path.join('/tmp', 'outputs')
              : path.join(process.cwd(), 'public', 'outputs');
            if (!existsSync(outputsDir)) await mkdir(outputsDir, { recursive: true });
            const filename = `wm_${crypto.randomUUID()}.png`;
            await writeFile(path.join(outputsDir, filename), watermarked);
            finalUrl = isVercel ? `/api/outputs/${filename}` : `/outputs/${filename}`;
          } catch (err) {
            console.error('Watermark error, using original URL:', err);
          }
        }
        finalUrls.push(finalUrl);
      }

      // Persist project only for logged-in users
      let projectId: string | null = null;
      if (userId) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const project = await prisma.project.create({
          data: {
            userId,
            status: 'completed',
            inputImageUrl: 'uploaded',
            style,
            generationMode: 'free',
            creditsUsed: 0,
            outputSize: FREE_OUTPUT_SIZE,
            hasWatermark: true,
            expiresAt
          }
        });
        await Promise.all(
          finalUrls.map((url) =>
            prisma.projectVariant.create({ data: { projectId: project.id, imageUrl: url } })
          )
        );
        projectId = project.id;
      }

      await incrementFreeUsage(userId, anonymousId);

      return NextResponse.json({
        projectId,
        variants: finalUrls.map((imageUrl, i) => ({ id: String(i), imageUrl })),
        creditsUsed: 0,
        hasWatermark: true,
        providerUsed,
        isDemo: isTextToImage
      });
    }

    // ── PAID MODE (login required) ────────────────────────────
    if (!userId) {
      return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
    }

    const creditCost = count;
    const balance = await getCredits(userId);
    if (balance < creditCost) {
      return NextResponse.json({ error: 'insufficientCredits', balance }, { status: 402 });
    }

    const size = outputSize || '1024x1024';
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const project = await prisma.project.create({
      data: {
        userId,
        status: 'processing',
        inputImageUrl: 'uploaded',
        style,
        generationMode: 'paid',
        creditsUsed: creditCost,
        outputSize: size,
        hasWatermark: false,
        expiresAt
      }
    });

    const { success } = await spendCredits(
      userId,
      creditCost,
      project.id,
      `Generate ${count} × ${style}`
    );

    if (!success) {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'failed' } });
      return NextResponse.json({ error: 'insufficientCredits' }, { status: 402 });
    }

    const result = await generateAvatar(imageBase64, style, count, size);
    const { urls, provider: providerUsed, isTextToImage } = result;

    const variants = await Promise.all(
      urls.map((url) =>
        prisma.projectVariant.create({ data: { projectId: project.id, imageUrl: url } })
      )
    );

    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'completed' }
    });

    return NextResponse.json({
      projectId: project.id,
      variants: variants.map((v) => ({ id: v.id, imageUrl: v.imageUrl })),
      creditsUsed: creditCost,
      hasWatermark: false,
      providerUsed,
      isDemo: isTextToImage
    });
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'generationFailed' }, { status: 500 });
  }
}
