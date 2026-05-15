import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, bio: true, avatarUrl: true, name: true, email: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'notLoggedIn' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { username, bio, avatarUrl } = await req.json();

  if (username !== undefined) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: 'invalidUsername' }, { status: 400 });
    }
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: 'usernameTaken' }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username !== undefined ? { username } : {}),
      ...(bio !== undefined ? { bio: String(bio).slice(0, 200) } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: String(avatarUrl) } : {}),
    },
    select: { username: true, bio: true, avatarUrl: true },
  });

  return NextResponse.json(updated);
}
