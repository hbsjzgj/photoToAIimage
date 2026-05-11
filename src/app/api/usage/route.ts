import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFreeUsage, remainingFree } from '@/lib/usage';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ used: 0, remaining: 3 });
  }

  const userId = (session.user as { id: string }).id;
  const used = await getFreeUsage(userId);
  return NextResponse.json({ used, remaining: remainingFree(used) });
}
