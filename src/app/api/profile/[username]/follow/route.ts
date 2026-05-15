import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function resolveUserId(username: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  return u?.id ?? null;
}

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
  const followerId = (session.user as { id: string }).id;
  const followingId = await resolveUserId(params.username);
  if (!followingId) return NextResponse.json({ error: 'notFound' }, { status: 404 });
  if (followerId === followingId) return NextResponse.json({ error: 'cannotFollowSelf' }, { status: 400 });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
  return NextResponse.json({ following: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
  const followerId = (session.user as { id: string }).id;
  const followingId = await resolveUserId(params.username);
  if (!followingId) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  await prisma.follow.deleteMany({ where: { followerId, followingId } });
  return NextResponse.json({ following: false });
}
