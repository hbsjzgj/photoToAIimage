import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCredits } from '@/lib/credits';
import { getFreeUsage, remainingFree } from '@/lib/usage';
import { FREE_DAILY_LIMIT } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ credits: 0, freeRemaining: FREE_DAILY_LIMIT });
  }

  const userId = (session.user as { id: string }).id;
  const [credits, freeUsed] = await Promise.all([
    getCredits(userId),
    getFreeUsage(userId)
  ]);

  return NextResponse.json({ credits, freeRemaining: remainingFree(freeUsed) });
}
