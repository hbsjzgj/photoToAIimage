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

No test suite is configured. TypeScript check (`npx tsc --noEmit`) is the primary correctness gate.

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

`src/lib/generate.ts` is the single entry point. It selects the provider:
1. **Demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`) — returns mock picsum images
2. **Replicate** (`AI_PROVIDER=replicate`) — PhotoMaker-Style model, requires `REPLICATE_API_TOKEN`
3. **Default** — free provider chain via `src/lib/providers/index.ts`: HuggingFace (`timbrooks/instruct-pix2pix` img2img) → Mock

The HuggingFace provider requires `imageBase64` (data URI or raw base64); it strips the `data:...;base64,` prefix before sending. `STYLE_INSTRUCTIONS` (not `STYLE_PROMPTS`) are used as the instruction prompt for instruct-pix2pix.

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
- **HuggingFace AI**: `HUGGINGFACE_API_TOKEN`
- **Cloudinary storage**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Replicate** (opt-in only): `REPLICATE_API_TOKEN` + `AI_PROVIDER=replicate`

## Prisma Schema Notes

- Database: SQLite in dev (`prisma/dev.db`), PostgreSQL in production
- After any schema change: run `npx prisma migrate dev --name <name>` (or `npm run db:push` for dev-only quick sync)
- After migration: `npm run db:generate` is NOT needed — `migrate dev` regenerates the client automatically
- Key models: `User`, `UserCredits`, `CreditTransaction`, `DailyUsage`, `Project`, `ProjectVariant`, `ProcessedWebhookEvent`
- `DailyUsage` tracks free-tier usage with unique constraints on `[userId, date]` and `[anonymousId, date]`
