// One-time migration script: apply Phase 1 social schema via Prisma executeRawUnsafe
// Run: node scripts/apply-social-migration.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const steps = [
  // User columns
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
  // Username unique constraint (idempotent)
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_username_key') THEN
      ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
    END IF;
  END $$`,
  // ProjectVariant columns
  `ALTER TABLE "ProjectVariant" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "ProjectVariant" ADD COLUMN IF NOT EXISTS "title" TEXT`,
  `ALTER TABLE "ProjectVariant" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ProjectVariant" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0`,
  // Like table
  `CREATE TABLE IF NOT EXISTS "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
  )`,
  // SavedWork table
  `CREATE TABLE IF NOT EXISTS "SavedWork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedWork_pkey" PRIMARY KEY ("id")
  )`,
  // Follow table
  `CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
  )`,
  // Unique constraints (idempotent)
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Like_userId_variantId_key') THEN
      ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_variantId_key" UNIQUE ("userId", "variantId");
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedWork_userId_variantId_key') THEN
      ALTER TABLE "SavedWork" ADD CONSTRAINT "SavedWork_userId_variantId_key" UNIQUE ("userId", "variantId");
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followerId_followingId_key') THEN
      ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_followingId_key" UNIQUE ("followerId", "followingId");
    END IF;
  END $$`,
  // Foreign keys (idempotent)
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Like_userId_fkey') THEN
      ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Like_variantId_fkey') THEN
      ALTER TABLE "Like" ADD CONSTRAINT "Like_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProjectVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedWork_userId_fkey') THEN
      ALTER TABLE "SavedWork" ADD CONSTRAINT "SavedWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedWork_variantId_fkey') THEN
      ALTER TABLE "SavedWork" ADD CONSTRAINT "SavedWork_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProjectVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followerId_fkey') THEN
      ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Follow_followingId_fkey') THEN
      ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

async function main() {
  console.log('Applying Phase 1 social schema migration...\n');
  for (let i = 0; i < steps.length; i++) {
    const sql = steps[i].trim();
    const preview = sql.split('\n')[0].slice(0, 80);
    process.stdout.write(`[${i + 1}/${steps.length}] ${preview}... `);
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('OK');
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      throw err;
    }
  }
  console.log('\nMigration complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
