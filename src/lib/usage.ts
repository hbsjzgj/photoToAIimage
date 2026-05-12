import { prisma } from './prisma';
import { FREE_DAILY_LIMIT, FREE_DAILY_LIMIT_ANON } from '@/types';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getFreeUsage(userId?: string, anonymousId?: string): Promise<number> {
  const date = todayStr();
  let record = null;

  if (userId) {
    record = await prisma.dailyUsage.findUnique({ where: { userId_date: { userId, date } } });
  } else if (anonymousId) {
    record = await prisma.dailyUsage.findUnique({
      where: { anonymousId_date: { anonymousId, date } }
    });
  }

  return record?.freeGenerationsUsed ?? 0;
}

export async function canUseFree(userId?: string, anonymousId?: string): Promise<boolean> {
  const limit = userId ? FREE_DAILY_LIMIT : FREE_DAILY_LIMIT_ANON;
  const used = await getFreeUsage(userId, anonymousId);
  return used < limit;
}

export async function incrementFreeUsage(
  userId?: string,
  anonymousId?: string
): Promise<number> {
  const date = todayStr();

  if (userId) {
    const record = await prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, freeGenerationsUsed: 1 },
      update: { freeGenerationsUsed: { increment: 1 } }
    });
    return record.freeGenerationsUsed;
  }

  if (anonymousId) {
    const record = await prisma.dailyUsage.upsert({
      where: { anonymousId_date: { anonymousId, date } },
      create: { anonymousId, date, freeGenerationsUsed: 1 },
      update: { freeGenerationsUsed: { increment: 1 } }
    });
    return record.freeGenerationsUsed;
  }

  return 0;
}

export function remainingFree(used: number, isLoggedIn = false): number {
  const limit = isLoggedIn ? FREE_DAILY_LIMIT : FREE_DAILY_LIMIT_ANON;
  return Math.max(0, limit - used);
}
