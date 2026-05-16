# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type-check without building

# Database
npm run db:push      # Sync schema to DB without migration (dev)
npm run db:generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create + apply named migration
npm run db:studio    # Prisma Studio GUI
```

# Testing

```bash
npm test                  # Run all tests (Vitest)
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

Test framework: **Vitest** with `vite-tsconfig-paths` for `@/` alias resolution.

Test layout under `src/__tests__/`:
- `unit/` — pure logic (rate-limit, prompts, provider-chain, strength-multiplier)
- `api/` — route-level integration tests (gallery, like, presets, feedback, apikeys)
- `combo/` — cross-endpoint lifecycle tests (generate-flow, preset-lifecycle, api-key-lifecycle)

All external dependencies (Prisma, NextAuth, next-intl, AI providers) are mocked. Use `vi.hoisted()` to declare mock functions **before** `vi.mock()` factory references them — this is required because `vi.mock` is hoisted to the top of the file at compile time.

## Architecture Overview

### Request flow

Browser → Next.js App Router (`src/app/`) → API routes (`src/app/api/`) → lib layer (`src/lib/`) → Prisma / external APIs

### Key directories

- `src/app/[locale]/` — All user-facing pages, wrapped by next-intl locale routing
- `src/app/api/` — REST endpoints: `generate`, `dashboard`, `usage`, `credits`, `checkout`, `webhook`, `outputs/[filename]`, `auth/*`
- `src/lib/` — Business logic: `generate.ts`, `credits.ts`, `usage.ts`, `watermark.ts`, `auth.ts`, `stripe.ts`, `prisma.ts`
- `src/lib/providers/` — AI provider chain abstraction
- `src/lib/storage/` — Storage provider abstraction
- `src/components/` — Client components
- `src/types/index.ts` — Shared constants and types (`StyleId`, `STYLE_PROMPTS`, `STYLE_INSTRUCTIONS`, `FREE_STYLES`, `FREE_DAILY_LIMIT`)
- `messages/` — i18n JSON files at project root (NOT inside `src/`)

### AI generation pipeline

`src/lib/generate.ts` is the single entry point. It selects the provider via `src/lib/providers/index.ts`:
1. **Demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`) — returns mock picsum images
2. **Forced provider** (`AI_PROVIDER=gemini|fal|huggingface|mock`) — explicit override
3. **Default auto-chain** — first available key wins:
   - `GEMINI_API_KEY` set → **Gemini** (`gemini-2.5-flash-image`) → Fal → Mock
   - `FAL_KEY` set → **Fal** (`fal-ai/flux/dev/image-to-image`) → Mock
   - `HUGGINGFACE_API_TOKEN` set → **HuggingFace** (`timbrooks/instruct-pix2pix`) → Mock
   - No keys → Mock only

All providers are img2img (require `imageBase64`). `NonRetriableError` (e.g. safety blocks) stops the chain immediately — it must NOT fall through to the next provider. Provider name is returned in the response as `providerUsed`.

### Style preview images

`public/style-previews/{styleId}.jpg` — static 512×512 preview images for all 34 styles, served directly. `src/lib/styleImages.ts` maps each `StyleId` to its static path and a Pollinations.ai fallback URL. To regenerate missing images: `node scripts/dl-missing-previews.mjs`.

### Storage abstraction

`src/lib/storage/index.ts` exports `getStorageProvider()` which returns:
- `CloudinaryProvider` when all three `CLOUDINARY_*` env vars are set
- `LocalProvider` otherwise (saves to `/tmp/outputs/` on Vercel, `public/outputs/` locally)

The `LocalProvider` on Vercel saves files that are served by `src/app/api/outputs/[filename]/route.ts`.

### Free vs Paid modes

- **Free**: No login required. 3 generations/day tracked by `userId` (if logged in) or IP address. Style limited to `FREE_STYLES`. Output is 768×768 with watermark. Anonymous users are identified by `x-forwarded-for`/`x-real-ip` headers.
- **Paid**: Login required. Deducts credits atomically via Prisma transaction. No watermark, HD output.

### Internationalization

- Locales: `ja` (default), `en`, `zh`
- Routing: next-intl v3 with `src/i18n/routing.ts` (defines locales) and `src/i18n/request.ts` (loads message files)
- Message files: `messages/{locale}.json` at project root
- Client-side navigation: import `useRouter`/`usePathname` from `@/i18n/navigation` (not from `next/navigation`) to get locale-aware routing
- All pages live under `src/app/[locale]/`

### Design system

Defined in `tailwind.config.ts` (extended tokens) + `src/app/globals.css` (component classes):
- Colors: `surface` (#0F1115), `gold` (#C8A96B), `ink` (#F5F7FA), `ink-secondary`, `ink-muted`
- Component classes: `glass-card`, `glass-card-hover`, `btn-gold`, `btn-ghost`, `input-field`, `skeleton`
- **Important**: `@apply` in `@layer components` cannot use extended Tailwind theme tokens (e.g., `bg-gold` fails). Use CSS custom properties (`var(--color-gold)`) or inline Tailwind utilities in JSX instead.

### Stripe payment flow

1. `POST /api/checkout` creates a Stripe Checkout session with `metadata.userId`, `metadata.credits`, `metadata.package`
2. Success redirects to `/{locale}/purchase/success?credits=N&package=X`
3. `POST /api/webhook` verifies signature, checks idempotency via `ProcessedWebhookEvent` model, then calls `addCredits()`

### Auth

NextAuth.js v4 with JWT strategy + credentials provider (email/password with bcrypt). User `id` is injected into the JWT and session via callbacks in `src/lib/auth.ts`. Access session user id as `(session.user as { id: string }).id`.

## Environment Variables

See `.env.local.example` for the full list. Required for each mode:
- **Any mode**: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- **Gemini AI** (primary): `GEMINI_API_KEY` — requires a free-tier Google AI Studio key (billing-enabled / prepay projects return 429)
- **Fal AI** (fallback): `FAL_KEY`
- **HuggingFace AI** (fallback): `HUGGINGFACE_API_TOKEN`
- **Cloudinary storage**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Force provider**: `AI_PROVIDER=gemini|fal|huggingface|mock` (omit to use auto-chain)

## Prisma Schema Notes

- Database: SQLite in dev (`prisma/dev.db`), PostgreSQL in production
- After any schema change: run `npx prisma migrate dev --name <name>` (or `npm run db:push` for dev-only quick sync)
- After migration: `npm run db:generate` is NOT needed — `migrate dev` regenerates the client automatically
- Key models: `User`, `UserCredits`, `CreditTransaction`, `DailyUsage`, `Project`, `ProjectVariant`, `ProcessedWebhookEvent`
- `DailyUsage` tracks free-tier usage with unique constraints on `[userId, date]` and `[anonymousId, date]`
