import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const variantId = params.id;

  const variant = await prisma.projectVariant.findUnique({
    where: { id: variantId },
    include: { project: { select: { userId: true } } },
  });
  if (!variant) return NextResponse.json({ error: 'notFound' }, { status: 404 });
  if (variant.project.userId !== userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.projectVariant.update({
    where: { id: variantId },
    data: {
      isPublic: Boolean(body.isPublic),
      ...(body.title !== undefined ? { title: String(body.title).slice(0, 100) || null } : {}),
    },
    select: { isPublic: true, title: true },
  });

  return NextResponse.json(updated);
}
