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
  const current = await getCredits(userId);
  if (current < amount) return { success: false, balance: current };

  const updated = await prisma.userCredits.update({
    where: { userId },
    data: { creditsBalance: { decrement: amount } }
  });

  await prisma.creditTransaction.create({
    data: { userId, projectId, type: 'spend', amount: -amount, description }
  });

  return { success: true, balance: updated.creditsBalance };
}
