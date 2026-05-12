import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFreeUsage, remainingFree } from '@/lib/usage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (userId) {
    const used = await getFreeUsage(userId);
    return NextResponse.json({ used, remaining: remainingFree(used, true) });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const used = await getFreeUsage(undefined, ip);
  return NextResponse.json({ used, remaining: remainingFree(used, false) });
}
