import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const steps = [
  `CREATE TABLE IF NOT EXISTS "StylePreset" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "styleId"    TEXT NOT NULL,
    "outputSize" TEXT NOT NULL,
    "count"      INTEGER NOT NULL DEFAULT 1,
    "isPublic"   BOOLEAN NOT NULL DEFAULT false,
    "useCount"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StylePreset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StylePreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "APIKey" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "keyHash"       TEXT NOT NULL,
    "keyPrefix"     TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "monthlyLimit"  INTEGER NOT NULL DEFAULT 100,
    "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt"    TIMESTAMP(3),
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "APIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `DO $$ BEGIN
    ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_keyHash_key" UNIQUE ("keyHash");
  EXCEPTION WHEN duplicate_object THEN NULL;
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
  console.log('Phase 2 migration complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
