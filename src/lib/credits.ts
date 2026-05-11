import { prisma } from './prisma';

export async function getCredits(userId: string): Promise<number> {
  const record = await prisma.userCredits.findUnique({ where: { userId } });
  return record?.creditsBalance ?? 0;
}

export async function ensureCredits(userId: string): Promise<void> {
  await prisma.userCredits.upsert({
    where: { userId },
    create: { userId, creditsBalance: 0 },
    update: {}
  });
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string
): Promise<number> {
  await ensureCredits(userId);

  const updated = await prisma.userCredits.update({
    where: { userId },
    data: { creditsBalance: { increment: amount } }
  });

  await prisma.creditTransaction.create({
    data: { userId, type: 'purchase', amount, description }
  });

  return updated.creditsBalance;
}

export async function spendCredits(
  userId: string,
  amount: number,
  projectId: string,
  description: string
): Promise<{ success: boolean; balance: number }> {
  // Use a transaction to atomically check and deduct credits
  try {
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.userCredits.findUnique({ where: { userId } });
      const current = record?.creditsBalance ?? 0;

      if (current < amount) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const updated = await tx.userCredits.update({
        where: { userId },
        data: { creditsBalance: { decrement: amount } }
      });

      await tx.creditTransaction.create({
        data: { userId, projectId, type: 'spend', amount: -amount, description }
      });

      return updated.creditsBalance;
    });

    return { success: true, balance: result };
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_CREDITS') {
      const balance = await getCredits(userId);
      return { success: false, balance };
    }
    throw err;
  }
}
