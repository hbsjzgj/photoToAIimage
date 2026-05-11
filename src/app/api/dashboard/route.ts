import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCredits } from '@/lib/credits';
import { getFreeUsage, remainingFree } from '@/lib/usage';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const [credits, freeUsed, projects, transactions] = await Promise.all([
    getCredits(userId),
    getFreeUsage(userId),
    prisma.project.findMany({
      where: { userId },
      include: { variants: { take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  return NextResponse.json({ credits, freeRemaining: remainingFree(freeUsed), projects, transactions });
}
