import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { id: true, username: true, name: true, bio: true, avatarUrl: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  const session = await getServerSession(authOptions);
  const viewerId = (session?.user as { id?: string } | undefined)?.id;

  const [works, followerCount, followingCount, isFollowing] = await Promise.all([
    prisma.projectVariant.findMany({
      where: { isPublic: true, project: { userId: user.id } },
      include: { project: { select: { style: true } } },
      orderBy: { likeCount: 'desc' },
      take: 48,
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    viewerId && viewerId !== user.id
      ? prisma.follow
          .findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  return NextResponse.json({
    user: { ...user, followerCount, followingCount },
    works: works.map((w) => ({ id: w.id, imageUrl: w.imageUrl, title: w.title, style: w.project.style, likeCount: w.likeCount, createdAt: w.createdAt })),
    isFollowing,
    isOwnProfile: viewerId === user.id,
  });
}
