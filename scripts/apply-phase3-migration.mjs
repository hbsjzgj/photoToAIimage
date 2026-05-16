import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const steps = [
  `CREATE TABLE IF NOT EXISTS "GenerationFeedback" (
    "id"        TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "userId"    TEXT,
    "positive"  BOOLEAN NOT NULL,
    "reason"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenerationFeedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GenerationFeedback_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProjectVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `DO $$ BEGIN
    ALTER TABLE "Project" ADD COLUMN "styleStrength" INTEGER NOT NULL DEFAULT 5;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END $$`,
];

async function main() {
  for (let i = 0; i < steps.length; i++) {
    try {
      await prisma.$executeRawUnsafe(steps[i]);
      console.log(`✅ Step ${i + 1}/${steps.length} done`);
    } catch (e) {
      console.error(`❌ Step ${i + 1} failed:`, e.message);
      throw e;
    }
  }
  console.log('Phase 3 migration complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
