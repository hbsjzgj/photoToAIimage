import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(40, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const style = searchParams.get('style') || undefined;
  const sort = searchParams.get('sort') === 'likes' ? 'likes' : 'newest';

  const session = await getServerSession(authOptions);
  const viewerId = (session?.user as { id?: string } | undefined)?.id;

  const where = {
    isPublic: true,
    ...(style ? { project: { style } } : {}),
  };

  const [variants, total] = await Promise.all([
    prisma.projectVariant.findMany({
      where,
      include: {
        project: { select: { style: true, userId: true } },
        ...(viewerId ? { likes: { where: { userId: viewerId }, select: { id: true } } } : {}),
      },
      orderBy: sort === 'likes' ? { likeCount: 'desc' } : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.projectVariant.count({ where }),
  ]);

  const userIds = Array.from(new Set(variants.map((v) => v.project.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, name: true, avatarUrl: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u])) as Record<string, { id: string; username: string | null; name: string | null; avatarUrl: string | null }>;

  const items = variants.map((v) => ({
    id: v.id,
    imageUrl: v.imageUrl,
    title: v.title,
    style: v.project.style,
    likeCount: v.likeCount,
    viewCount: v.viewCount,
    liked: viewerId ? ((v as { likes?: { id: string }[] }).likes ?? []).length > 0 : false,
    user: userMap[v.project.userId] ?? null,
    createdAt: v.createdAt,
  }));

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}
