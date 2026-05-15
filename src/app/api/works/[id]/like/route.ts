import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const variantId = params.id;

  const variant = await prisma.projectVariant.findUnique({
    where: { id: variantId },
    select: { id: true, isPublic: true },
  });
  if (!variant || !variant.isPublic) {
    return NextResponse.json({ error: 'notFound' }, { status: 404 });
  }

  const existing = await prisma.like.findUnique({
    where: { userId_variantId: { userId, variantId } },
  });

  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.like.delete({ where: { userId_variantId: { userId, variantId } } }),
      prisma.projectVariant.update({
        where: { id: variantId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return NextResponse.json({ liked: false, likeCount: updated.likeCount });
  } else {
    const [, updated] = await prisma.$transaction([
      prisma.like.create({ data: { userId, variantId } }),
      prisma.projectVariant.update({
        where: { id: variantId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return NextResponse.json({ liked: true, likeCount: updated.likeCount });
  }
}
