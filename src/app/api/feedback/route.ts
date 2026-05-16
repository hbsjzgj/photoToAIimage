import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const { variantId, positive, reason } = await req.json();
  if (!variantId || typeof positive !== 'boolean') {
    return NextResponse.json({ error: 'missingFields' }, { status: 400 });
  }

  const variant = await prisma.projectVariant.findUnique({ where: { id: variantId } });
  if (!variant) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  await prisma.generationFeedback.create({
    data: { variantId, userId: userId ?? null, positive, reason: reason ?? null },
  });

  return NextResponse.json({ success: true });
}
