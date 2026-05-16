import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const presets = await prisma.stylePreset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ presets });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name, styleId, outputSize, count } = await req.json();
  if (!name?.trim() || !styleId || !outputSize) {
    return NextResponse.json({ error: 'missingFields' }, { status: 400 });
  }

  const preset = await prisma.stylePreset.create({
    data: {
      userId,
      name: name.trim().slice(0, 50),
      styleId,
      outputSize,
      count: count ?? 1,
    },
  });
  return NextResponse.json({ preset });
}
