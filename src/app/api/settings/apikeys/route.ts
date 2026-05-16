import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const keys = await prisma.aPIKey.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      monthlyLimit: true,
      usedThisMonth: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const existing = await prisma.aPIKey.count({ where: { userId, isActive: true } });
  if (existing >= 5) {
    return NextResponse.json({ error: 'tooManyKeys' }, { status: 400 });
  }

  const { name, monthlyLimit = 100 } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'missingName' }, { status: 400 });

  const rawKey = `fma_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 10);

  await prisma.aPIKey.create({
    data: {
      userId,
      keyHash,
      keyPrefix,
      name: name.trim().slice(0, 50),
      monthlyLimit: Math.min(Math.max(0, Number(monthlyLimit)), 10000),
    },
  });

  return NextResponse.json({ key: rawKey, prefix: keyPrefix });
}
