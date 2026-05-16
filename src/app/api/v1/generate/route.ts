import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAvatar } from '@/lib/generate';
import { checkRateLimit } from '@/lib/rate-limit';
import { spendCredits } from '@/lib/credits';
import { getStorageProvider } from '@/lib/storage';
import { fetchImageBuffer } from '@/lib/watermark';
import type { StyleId } from '@/types';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer fma_')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rawKey = authHeader.slice(7);
  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.aPIKey.findUnique({
    where: { keyHash },
    include: { user: { include: { credits: true } } },
  });

  if (!apiKey || !apiKey.isActive) {
    return NextResponse.json({ error: 'invalidKey' }, { status: 401 });
  }

  if (apiKey.monthlyLimit > 0 && apiKey.usedThisMonth >= apiKey.monthlyLimit) {
    return NextResponse.json({ error: 'monthlyLimitExceeded' }, { status: 429 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'api';
  if (!checkRateLimit(`v1gen:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rateLimited' }, { status: 429 });
  }

  const userCredits = apiKey.user.credits?.creditsBalance ?? 0;
  if (userCredits < 1) {
    return NextResponse.json({ error: 'insufficientCredits' }, { status: 402 });
  }

  let imageBase64: string | undefined;
  let style: string | undefined;
  let outputSize = '1024x1024';

  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    const file = fd.get('image') as File | null;
    if (!file) return NextResponse.json({ error: 'noImage' }, { status: 400 });
    const buf = await file.arrayBuffer();
    imageBase64 = Buffer.from(buf).toString('base64');
    style = fd.get('style') as string;
    outputSize = (fd.get('outputSize') as string) ?? '1024x1024';
  } else {
    const body = await req.json() as { imageBase64?: string; style?: string; outputSize?: string };
    imageBase64 = body.imageBase64;
    style = body.style;
    outputSize = body.outputSize ?? '1024x1024';
  }

  if (!imageBase64) return NextResponse.json({ error: 'noImage' }, { status: 400 });
  if (!style) return NextResponse.json({ error: 'noStyle' }, { status: 400 });

  const spendResult = await spendCredits(apiKey.userId, 1, 'api-v1', 'API v1 generation');
  if (!spendResult.success) {
    return NextResponse.json({ error: 'insufficientCredits' }, { status: 402 });
  }

  await prisma.aPIKey.update({
    where: { id: apiKey.id },
    data: { usedThisMonth: { increment: 1 }, lastUsedAt: new Date() },
  });

  const result = await generateAvatar(imageBase64, style as StyleId, 1, outputSize, undefined, 'paid');

  const storage = getStorageProvider();
  const buf = await fetchImageBuffer(result.urls[0]);
  const storedUrl = await storage.upload(buf, `v1-${Date.now()}.jpg`);

  return NextResponse.json({ imageUrl: storedUrl, creditsUsed: 1, provider: result.provider });
}
