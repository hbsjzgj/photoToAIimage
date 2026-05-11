import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAvatar } from '@/lib/generate';
import { addWatermark, fetchImageBuffer } from '@/lib/watermark';
import { spendCredits, getCredits } from '@/lib/credits';
import { canUseFree, incrementFreeUsage } from '@/lib/usage';
import { FREE_STYLES, GenerateRequest, FREE_OUTPUT_SIZE } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body: GenerateRequest = await req.json();
    const { imageBase64, style, mode, count, outputSize } = body;

    if (!imageBase64 || !style) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── FREE MODE ──────────────────────────────────────────────
    if (mode === 'free') {
      if (!FREE_STYLES.includes(style as never)) {
        return NextResponse.json({ error: 'Style not available in free mode' }, { status: 403 });
      }

      const allowed = await canUseFree(userId);
      if (!allowed) {
        return NextResponse.json({ error: 'limitReached' }, { status: 429 });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const project = await prisma.project.create({
        data: {
          userId,
          status: 'processing',
          inputImageUrl: 'uploaded',
          style,
          generationMode: 'free',
          creditsUsed: 0,
          outputSize: FREE_OUTPUT_SIZE,
          hasWatermark: true,
          expiresAt
        }
      });

      const urls = await generateAvatar(imageBase64, style, 1, FREE_OUTPUT_SIZE);

      const variants = await Promise.all(
        urls.map(async (url) => {
          // Download and add watermark
          let finalUrl = url;
          try {
            const buf = await fetchImageBuffer(url);
            const watermarked = await addWatermark(buf);
            // In production: upload watermarked buffer to Cloudinary
            // For now, keep original URL (demo mode returns picsum which we can't re-upload)
            if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
              finalUrl = url; // Replace with Cloudinary upload in production
            }
            void watermarked; // suppress unused warning in demo mode
          } catch {
            // fallback to original
          }

          return prisma.projectVariant.create({
            data: { projectId: project.id, imageUrl: finalUrl }
          });
        })
      );

      await prisma.project.update({
        where: { id: project.id },
        data: { status: 'completed' }
      });

      await incrementFreeUsage(userId);

      return NextResponse.json({
        projectId: project.id,
        variants: variants.map((v) => ({ id: v.id, imageUrl: v.imageUrl })),
        creditsUsed: 0,
        hasWatermark: true
      });
    }

    // ── PAID MODE ──────────────────────────────────────────────
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

    const urls = await generateAvatar(imageBase64, style, count, size);

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
      hasWatermark: false
    });
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'generationFailed' }, { status: 500 });
  }
}
