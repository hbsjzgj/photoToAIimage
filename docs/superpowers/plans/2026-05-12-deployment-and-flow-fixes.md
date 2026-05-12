# Deployment Verification & Flow Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two independent tracks — (A) verify Vercel + Supabase production deployment end-to-end; (B) fix 6 broken user-flow issues that block navigation and purchase conversion.

**Architecture:** Track 1 is pure infrastructure/configuration with one schema code change. Track 2 is pure code — 5 component files and 3 message files. No cross-track dependency; execute in any order.

**Tech Stack:** Next.js 14 App Router, Prisma 5 (PostgreSQL/Supabase), Stripe, fal.ai, next-intl v3 (ja/en/zh), Framer Motion, Tailwind CSS

---

## File Map

**Track 1 (config/infra):**
- `prisma/schema.prisma` — add `directUrl`
- `.env.local` — add Supabase connection strings (never committed)
- `.env.local.example` — document new vars

**Track 2 (code):**
- `src/app/[locale]/pricing/page.tsx` — convert to client, add canceled banner
- `src/app/[locale]/auth/page.tsx` — read `callbackUrl` query param
- `src/components/PricingCards.tsx` — pass `callbackUrl` when redirecting to auth
- `src/components/GenerateForm.tsx` — add `errorCode` state; add upgrade nudge
- `src/components/Header.tsx` — add mobile hamburger + drawer
- `messages/ja.json` — add auth subtitles + upgradeNudge keys
- `messages/en.json` — same
- `messages/zh.json` — same

---

## TRACK 1 — Production Deployment Verification

### Task 1-1: Supabase schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.local` (local only — never committed)
- Modify: `.env.local.example`

- [ ] **Step 1: Add `directUrl` to `prisma/schema.prisma`**

Open `prisma/schema.prisma`. The `datasource db` block currently reads:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Replace with:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- [ ] **Step 2: Add connection strings to `.env.local`**

In Supabase Dashboard → Project → Connect → ORM tab, select **Transaction pooler** for `DATABASE_URL` and **Direct connection** for `DIRECT_URL`. Copy both URI strings and add to `.env.local`:

```env
# Supabase Transaction Pooler — used by Vercel serverless at runtime
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase Direct Connection — used only by `prisma migrate`
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

- [ ] **Step 3: Document vars in `.env.local.example`**

In `.env.local.example`, find the `DATABASE_URL` line and replace it with:

```env
# Supabase Transaction Pooler URL (used at runtime on Vercel)
DATABASE_URL="postgresql://..."
# Supabase Direct Connection URL (used only by prisma migrate)
DIRECT_URL="postgresql://..."
```

- [ ] **Step 4: Check whether a migrations directory exists**

```bash
ls prisma/migrations
```

If the directory does NOT exist (first-time setup), run:
```bash
npx prisma migrate dev --name init
```
Expected output: `Your database is now in sync with your schema.` and a new `prisma/migrations/` directory created.

If the directory already exists, skip to Step 5.

- [ ] **Step 5: Apply migrations to Supabase**

```bash
npx prisma migrate deploy
```

Expected output:
```
Applying migration `20XXXXXX_init`
All migrations have been applied
```

If you see `Error: P1001: Can't reach database server` — double-check `DIRECT_URL` is the Direct connection string (port 5432), not the pooler.

- [ ] **Step 6: Verify tables exist**

```bash
npx prisma studio
```

Expected: Browser opens at `localhost:5555`. You should see all 8 tables: `User`, `Account`, `Session`, `VerificationToken`, `UserCredits`, `CreditTransaction`, `DailyUsage`, `Project`, `ProjectVariant`, `ProcessedWebhookEvent`.

- [ ] **Step 7: Commit schema change**

```bash
git add prisma/schema.prisma .env.local.example
git commit -m "feat: add Supabase directUrl to Prisma schema"
```

---

### Task 1-2: Vercel environment variables audit

**Files:** None (Vercel Dashboard only)

Go to `vercel.com` → your project → **Settings** → **Environment Variables**. For each variable below, verify it exists with scope **Production** (at minimum). Values are visible by clicking the eye icon.

- [ ] **Step 1: Verify database vars**

| Variable | Expected value shape |
|---|---|
| `DATABASE_URL` | `postgresql://postgres.[ref]:...pooler.supabase.com:6543/postgres?pgbouncer=true...` |
| `DIRECT_URL` | `postgresql://postgres:[pwd]@db.[ref].supabase.co:5432/postgres` |

- [ ] **Step 2: Verify auth vars**

| Variable | Expected value shape |
|---|---|
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` — no trailing slash, must match actual deployment URL |
| `NEXTAUTH_SECRET` | Any 32+ char random string. Generate with: `openssl rand -base64 32` |

- [ ] **Step 3: Verify AI provider vars**

| Variable | Expected value shape |
|---|---|
| `FAL_KEY` | `fal-...` (starts with "fal-") |
| `AI_PROVIDER` | Should be absent or empty. Do NOT set to `replicate`. |
| `NEXT_PUBLIC_DEMO_MODE` | Must be absent or `false`. Never `true` in production. |

- [ ] **Step 4: Verify Stripe vars**

| Variable | Expected value shape |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Step in Task 1-3) |
| `STRIPE_PRICE_STARTER` | `price_...` (Stripe price ID for 10-credit pack) |
| `STRIPE_PRICE_CREATOR` | `price_...` (Stripe price ID for 30-credit pack) |
| `STRIPE_PRICE_PRO` | `price_...` (Stripe price ID for 100-credit pack) |

To find Price IDs: Stripe Dashboard → Products → click each product → copy the Price ID under the price.

- [ ] **Step 5: Verify optional vars**

| Variable | Notes |
|---|---|
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | If all three absent, storage falls back to inline base64 data URLs (acceptable) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional analytics |

- [ ] **Step 6: Trigger redeploy**

After adding or changing any variable: Vercel Dashboard → **Deployments** → click the `...` menu on the latest deployment → **Redeploy**. Wait for build to complete (green checkmark).

---

### Task 1-3: Stripe Webhook verification

**Files:** None (Stripe Dashboard only)

- [ ] **Step 1: Find or create webhook endpoint in Stripe Dashboard**

Stripe Dashboard → **Developers** → **Webhooks**. Look for an endpoint with URL matching `https://<your-domain>/api/webhook`.

If it doesn't exist, click **Add endpoint**:
- URL: `https://<your-vercel-domain>/api/webhook`
- Events: select `checkout.session.completed`
- Click **Add endpoint**

- [ ] **Step 2: Copy signing secret into Vercel**

On the webhook endpoint detail page → click **Reveal** next to Signing secret → copy the `whsec_...` value.

Go to Vercel → Settings → Environment Variables → set `STRIPE_WEBHOOK_SECRET` = the `whsec_...` value → Save → **Redeploy**.

- [ ] **Step 3: Send a test event**

On the Stripe webhook endpoint page → **Send test event** → select event type `checkout.session.completed` → **Send test webhook**.

Then check: Vercel Dashboard → **Functions** tab → find a recent invocation of `/api/webhook` → click to view logs.

Expected logs:
```
[Webhook] Event evt_... already processed, skipping
```
or
```
[Webhook] Added N credits to user ...
```

If you see `400 Invalid signature` — the `STRIPE_WEBHOOK_SECRET` in Vercel doesn't match the webhook's signing secret. Re-copy it.

---

### Task 1-4: End-to-end smoke test

- [ ] **Step 1: Basic navigation**

Visit `https://<your-domain>/ja`. Confirm:
- Home page renders with FORMA logo and hero text
- Language switcher: click EN → page reloads in English; click ZH → Chinese; click JA → back to Japanese
- Nav links: Home, Generate, Pricing all load their pages without 500 errors

- [ ] **Step 2: Registration and free generation**

1. Click Sign In → Create Account tab
2. Register with a test email
3. Expected: redirected to `/ja/generate`
4. Upload any face photo (JPG, at least 256×256px)
5. Select a free style (Anime Basic, Soft Cartoon, Cute Pet, or Simple Icon)
6. Click Generate
7. Expected: spinner appears, then a watermarked result image appears within 60 seconds

If generation hangs or fails: Vercel → Functions → `/api/generate` logs. Look for `[generate] env: ... FAL_KEY=` line. If it shows `FAL_KEY=NOT SET`, the `FAL_KEY` variable is missing from Vercel.

- [ ] **Step 3: Purchase flow**

1. Go to `/ja/pricing`
2. Click **Buy Now** on any credit pack
3. On Stripe Checkout page, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date (e.g., `12/28`)
   - CVC: any 3 digits (e.g., `123`)
4. Click Pay
5. Expected: redirected to `/ja/purchase/success?credits=N`
6. Check `/ja/dashboard` → credits balance should show the purchased amount

- [ ] **Step 4: Paid generation**

1. Go to `/ja/generate`
2. Select **Paid** mode tab (visible only when logged in)
3. Upload a photo, select any style, click Generate
4. Expected: HD result appears without watermark (no "FORMA" text overlay)

- [ ] **Step 5: Confirm Vercel function logs**

Vercel Dashboard → **Functions** tab → click on a recent `/api/generate` invocation.

Required: logs must contain `[generate] env: AI_PROVIDER=... FAL_KEY=set(fal-...)`.

If logs show `FAL_KEY=NOT SET` — add `FAL_KEY` to Vercel env vars and redeploy.

---

## TRACK 2 — Flow Fixes

### Task 2-1: Pricing page — show canceled banner

**Files:**
- Modify: `src/app/[locale]/pricing/page.tsx`

Current state: server async component using `getTranslations('pricing')`. Stripe's cancel URL lands here with `?canceled=true` but nothing is shown.

- [ ] **Step 1: Rewrite `pricing/page.tsx` as a client component**

Replace the entire file content with the following. The only structural changes are: `'use client'` directive, `async` removed, `getTranslations` → `useTranslations`, new `useState`/`useEffect`/`useSearchParams` imports, and the canceled banner block inserted before the existing heading. All existing content (heading, PricingCards, FAQ) is preserved exactly:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCards from '@/components/PricingCards';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const tDashboard = useTranslations('dashboard');
  const searchParams = useSearchParams();
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') setShowCanceled(true);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Canceled banner */}
          <AnimatePresence>
            {showCanceled && (
              <motion.div
                className="glass-card p-5 border-amber-500/20 bg-amber-500/5 flex items-start justify-between gap-4"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-amber-400 font-medium text-sm">{tDashboard('banner.canceledTitle')}</p>
                    <p className="text-ink-muted text-xs mt-0.5">{tDashboard('banner.canceledSubtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCanceled(false)}
                  className="text-ink-muted hover:text-ink transition-colors text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="text-center space-y-4">
            <p className="text-gold text-xs font-medium tracking-widest uppercase">Pricing</p>
            <h1 className="text-4xl lg:text-5xl font-light text-ink">{t('title')}</h1>
            <p className="text-ink-secondary font-light max-w-md mx-auto">{t('subtitle')}</p>
          </div>

          <PricingCards />

          {/* FAQ */}
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-light text-ink text-center mb-8">{t('faq.title')}</h2>
            {[1, 2, 3, 4].map((n) => (
              <details
                key={n}
                className="glass-card-hover p-6 cursor-pointer group rounded-3xl"
              >
                <summary className="font-medium text-ink-secondary cursor-pointer list-none
                                    flex justify-between items-center gap-4 group-open:text-ink
                                    transition-colors duration-300">
                  <span>{t(`faq.q${n}` as 'faq.q1')}</span>
                  <svg className="w-5 h-5 text-ink-muted flex-shrink-0 transition-transform duration-300 group-open:rotate-45"
                       viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </summary>
                <p className="mt-4 text-ink-muted text-sm leading-relaxed font-light">
                  {t(`faq.a${n}` as 'faq.a1')}
                </p>
              </details>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `Property 'banner' does not exist on type` — check that `tDashboard` is called with namespace `'dashboard'` and the key path is `'banner.canceledTitle'`.

- [ ] **Step 3: Manual verify**

Start dev server (`npm run dev`). Visit `http://localhost:3000/ja/pricing?canceled=true`. Expected: amber warning banner with cancel message appears at the top. Click × — banner disappears. Visit `http://localhost:3000/ja/pricing` (no param) — no banner.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/pricing/page.tsx
git commit -m "fix: show payment canceled banner on pricing page"
```

---

### Task 2-2: Auth `callbackUrl` — return to pricing after login

**Files:**
- Modify: `src/app/[locale]/auth/page.tsx` (line 31)
- Modify: `src/components/PricingCards.tsx` (line 27)

Current: `PricingCards.tsx` line 27 sends unauthenticated users to `/auth`. After login, `auth/page.tsx` always pushes to `/generate`. Users who click "Buy Now" on pricing lose their context.

- [ ] **Step 1: Add `useSearchParams` to `auth/page.tsx` and use `callbackUrl`**

In `src/app/[locale]/auth/page.tsx`:

Add `useSearchParams` to the existing `next/navigation` import (currently only `useRouter` is imported):
```tsx
import { useRouter, useSearchParams } from 'next/navigation';
```

Inside the `AuthPage` component, after `const router = useRouter();`, add:
```tsx
const searchParams = useSearchParams();
const callbackUrl = searchParams.get('callbackUrl') ?? `/${locale}/generate`;
```

On line 31, replace:
```tsx
router.push(`/${locale}/generate`);
```
with:
```tsx
router.push(callbackUrl);
```

- [ ] **Step 2: Update `PricingCards.tsx` to pass `callbackUrl`**

In `src/components/PricingCards.tsx`, line 27 currently reads:
```tsx
if (!session?.user) { router.push(`/${locale}/auth`); return; }
```

Replace with:
```tsx
if (!session?.user) { router.push(`/${locale}/auth?callbackUrl=/${locale}/pricing`); return; }
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual verify**

1. Sign out. Go to `/ja/pricing`. Click **Buy Now** on any pack.
2. Expected: redirected to `/ja/auth?callbackUrl=/ja/pricing`
3. Sign in with valid credentials.
4. Expected: redirected back to `/ja/pricing` (not `/ja/generate`).
5. Click **Buy Now** again — Stripe checkout should open.

Also verify default behavior: sign out, go to `/ja/auth` directly (no callbackUrl), sign in — expected: redirected to `/ja/generate` as before.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/auth/page.tsx src/components/PricingCards.tsx
git commit -m "fix: auth callbackUrl — return to pricing after login"
```

---

### Task 2-3: Generate page — robust insufficientCredits CTA

**Files:**
- Modify: `src/components/GenerateForm.tsx`

Current state: the error display already has a partial CTA (line 359) comparing `error === t('errors.insufficientCredits')`. This works but is fragile — if the translation string changes, the CTA disappears silently. This task replaces the string comparison with a typed `errorCode` state.

- [ ] **Step 1: Add `errorCode` state**

In `src/components/GenerateForm.tsx`, find the existing state declarations around line 39:
```tsx
const [error, setError] = useState('');
```

Add the `errorCode` state immediately after:
```tsx
const [error, setError] = useState('');
const [errorCode, setErrorCode] = useState('');
```

- [ ] **Step 2: Clear `errorCode` alongside `error` in `handleGenerate`**

In `handleGenerate` (around line 133–134), find:
```tsx
setLoading(true);
setError('');
setResult(null);
```

Replace with:
```tsx
setLoading(true);
setError('');
setErrorCode('');
setResult(null);
```

- [ ] **Step 3: Set `errorCode` when an API error arrives**

In `handleGenerate`, find the `!res.ok` branch (around line 152–155):
```tsx
if (!res.ok) {
  analytics.generationFailed({ style: style as string, mode, error: data.error ?? 'unknown' });
  setError(t(`errors.${data.error}`) || data.error);
  return;
}
```

Replace with:
```tsx
if (!res.ok) {
  analytics.generationFailed({ style: style as string, mode, error: data.error ?? 'unknown' });
  setErrorCode(data.error ?? '');
  setError(t(`errors.${data.error}`) || data.error);
  return;
}
```

- [ ] **Step 4: Update the error display block to use `errorCode`**

Find the error display section (around lines 349–369):
```tsx
{/* ── Error ── */}
<AnimatePresence>
  {error && (
    <motion.div
      className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between gap-3"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <span>{error}</span>
      {error === t('errors.insufficientCredits') && (
        <Link
          href={`/${locale}/pricing`}
          className="text-gold hover:text-gold-light text-xs font-medium whitespace-nowrap transition-colors"
        >
          {t('paid.buyCredits')} →
        </Link>
      )}
    </motion.div>
  )}
</AnimatePresence>
```

Replace with:
```tsx
{/* ── Error ── */}
<AnimatePresence>
  {error && (
    <motion.div
      className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between gap-3"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <span>{error}</span>
      {errorCode === 'insufficientCredits' && (
        <Link
          href={`/${locale}/pricing`}
          className="text-gold hover:text-gold-light text-xs font-medium whitespace-nowrap transition-colors"
        >
          {t('paid.buyCredits')} →
        </Link>
      )}
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual verify**

In paid mode with 0 credits, click Generate. Expected: red error message appears with `{t('errors.insufficientCredits')}` text AND a gold "Buy Credits →" link to the right. Click the link → navigates to `/ja/pricing`.

- [ ] **Step 7: Commit**

```bash
git add src/components/GenerateForm.tsx
git commit -m "fix: use errorCode state for insufficientCredits CTA (removes string comparison)"
```

---

### Task 2-4: Header — mobile navigation drawer

**Files:**
- Modify: `src/components/Header.tsx`

Current: nav is `hidden md:flex`, invisible on mobile. No hamburger button exists.

- [ ] **Step 1: Rewrite `Header.tsx` with mobile drawer**

Replace the entire file content with:

```tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import CreditsDisplay from './CreditsDisplay';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navLinks = [
    { href: `/${locale}`, label: t('nav.home') },
    { href: `/${locale}/generate`, label: t('nav.generate') },
    { href: `/${locale}/pricing`, label: t('nav.pricing') },
    ...(session?.user ? [{ href: `/${locale}/dashboard`, label: t('nav.dashboard') }] : []),
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50">
        {/* Blur backing */}
        <div className="absolute inset-0 backdrop-blur-xl border-b border-[var(--border-subtle)]"
             style={{ backgroundColor: 'var(--header-backdrop)' }} />

        <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <motion.div
              className="relative w-7 h-7 rounded-lg bg-gold/90 flex items-center justify-center overflow-hidden flex-shrink-0"
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <span className="text-surface text-xs font-black tracking-tighter select-none">F</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/forma-icon.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </motion.div>
            <span className="hidden sm:block font-semibold text-ink tracking-wide text-sm">FORMA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (pathname.startsWith(href + '/') && href !== `/${locale}`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    ${active ? 'text-ink' : 'text-ink-secondary hover:text-ink hover:bg-[var(--nav-hover)]'}`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-[rgba(255,255,255,0.07)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right — desktop */}
          <div className="flex items-center gap-3">
            <CreditsDisplay />
            <div className="hidden md:block"><LanguageSwitcher /></div>

            <div className="hidden md:block">
              {session?.user ? (
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="text-sm text-ink-secondary hover:text-ink transition-colors duration-200"
                >
                  {t('common.signOut')}
                </button>
              ) : (
                <Link href={`/${locale}/auth`} className="btn-ghost text-sm py-2 px-4">
                  {t('common.signIn')}
                </Link>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 -mr-1 text-ink-secondary hover:text-ink transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              onClick={() => setMobileOpen(false)}
            />

            {/* Nav panel */}
            <motion.nav
              className="absolute top-16 inset-x-0 bg-surface border-b border-[rgba(255,255,255,0.07)] px-6 py-5 space-y-1"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-ink-secondary hover:text-ink hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium"
                >
                  {label}
                </Link>
              ))}

              <div className="pt-4 mt-3 border-t border-[rgba(255,255,255,0.07)] flex items-center justify-between">
                <LanguageSwitcher />
                {session?.user ? (
                  <button
                    onClick={() => { signOut({ callbackUrl: `/${locale}` }); setMobileOpen(false); }}
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    {t('common.signOut')}
                  </button>
                ) : (
                  <Link
                    href={`/${locale}/auth`}
                    onClick={() => setMobileOpen(false)}
                    className="btn-ghost text-sm py-2 px-4"
                  >
                    {t('common.signIn')}
                  </Link>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual verify on mobile viewport**

In browser DevTools, set viewport to 375×812 (iPhone). Confirm:
1. Desktop nav (`hidden md:flex`) is not visible
2. Hamburger icon (☰) appears in top-right
3. Tap hamburger → drawer slides down with all nav links + Sign In/Out + LanguageSwitcher
4. Tap any nav link → navigates to that page, drawer closes
5. Tap the semi-transparent backdrop → drawer closes
6. Navigate to a different page → drawer closes automatically

Also verify desktop (viewport ≥ 768px): hamburger not visible, desktop nav shows as before.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add mobile hamburger navigation drawer"
```

---

### Task 2-5: Auth page — i18n subtitle

**Files:**
- Modify: `messages/ja.json`
- Modify: `messages/en.json`
- Modify: `messages/zh.json`
- Modify: `src/app/[locale]/auth/page.tsx`

Current: `auth/page.tsx` line 73 has hardcoded Japanese `'アカウントにサインイン'` / `'アカウントを作成'`.

- [ ] **Step 1: Add subtitle keys to `messages/ja.json`**

In `messages/ja.json`, find the `"auth"` → `"signin"` object (currently ends at `"error": "..."`) and add `"subtitle"`. Do the same for `"signup"`:

```json
"auth": {
  "signin": {
    "title": "ログイン",
    "email": "メールアドレス",
    "password": "パスワード",
    "submit": "ログイン",
    "noAccount": "アカウントをお持ちでない方は",
    "signupLink": "新規登録",
    "error": "メールアドレスまたはパスワードが正しくありません",
    "subtitle": "アカウントにサインイン"
  },
  "signup": {
    "title": "新規登録",
    "name": "お名前",
    "email": "メールアドレス",
    "password": "パスワード（8文字以上）",
    "submit": "登録する",
    "hasAccount": "すでにアカウントをお持ちの方は",
    "signinLink": "ログイン",
    "success": "登録が完了しました。ログインしてください。",
    "subtitle": "アカウントを作成"
  },
  ...
}
```

- [ ] **Step 2: Add subtitle keys to `messages/en.json`**

```json
"signin": { ..., "subtitle": "Sign in to your account" },
"signup": { ..., "subtitle": "Create your account" }
```

- [ ] **Step 3: Add subtitle keys to `messages/zh.json`**

```json
"signin": { ..., "subtitle": "登录你的账号" },
"signup": { ..., "subtitle": "创建账号" }
```

- [ ] **Step 4: Replace hardcoded string in `auth/page.tsx`**

In `src/app/[locale]/auth/page.tsx`, find line 73 (inside the logo section):
```tsx
{tab === 'signin' ? 'アカウントにサインイン' : 'アカウントを作成'}
```

Replace with:
```tsx
{tab === 'signin' ? t('signin.subtitle') : t('signup.subtitle')}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual verify**

Visit `/en/auth` — subtitle reads "Sign in to your account". Switch to signup tab — reads "Create your account". Visit `/zh/auth` — reads "登录你的账号".

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/auth/page.tsx messages/ja.json messages/en.json messages/zh.json
git commit -m "fix: replace hardcoded Japanese auth subtitle with i18n keys"
```

---

### Task 2-6: Generate page — free result upgrade nudge

**Files:**
- Modify: `messages/ja.json`
- Modify: `messages/en.json`
- Modify: `messages/zh.json`
- Modify: `src/components/GenerateForm.tsx`

Current: after a free (watermarked) generation, there is no call-to-action guiding the user to upgrade.

- [ ] **Step 1: Add `upgradeNudge` keys to `messages/ja.json`**

Inside `"generate"` object, add after the `"errors"` block:
```json
"upgradeNudge": {
  "title": "HD・透かしなし版を入手",
  "desc": "全14スタイル · 1024×1024 · 4枚同時生成",
  "cta": "アップグレード"
}
```

- [ ] **Step 2: Add `upgradeNudge` keys to `messages/en.json`**

```json
"upgradeNudge": {
  "title": "Get HD without watermark",
  "desc": "All 14 styles · 1024×1024 · 4 images at once",
  "cta": "Upgrade"
}
```

- [ ] **Step 3: Add `upgradeNudge` keys to `messages/zh.json`**

```json
"upgradeNudge": {
  "title": "获取高清无水印版本",
  "desc": "全部14种风格 · 1024×1024 · 同时生成4张",
  "cta": "立即升级"
}
```

- [ ] **Step 4: Add `Link` import to `GenerateForm.tsx` if not already present**

Check the top of `src/components/GenerateForm.tsx`. It should already have `import Link from 'next/link';` (line 7). If missing, add it.

- [ ] **Step 5: Add upgrade nudge after the result block**

In `src/components/GenerateForm.tsx`, find the result `AnimatePresence` block (lines 423–454), which ends with:
```tsx
      </AnimatePresence>
    </div>
  );
}
```

Insert the upgrade nudge between the closing `</AnimatePresence>` and the closing `</div>`:

```tsx
      </AnimatePresence>

      {/* ── Upgrade nudge (free result only) ── */}
      <AnimatePresence>
        {result?.hasWatermark && (
          <motion.div
            className="glass-card p-5 flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gold" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"
                        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{t('upgradeNudge.title')}</p>
                <p className="text-xs text-ink-muted mt-0.5">{t('upgradeNudge.desc')}</p>
              </div>
            </div>
            <Link
              href={`/${locale}/pricing`}
              className="btn-gold text-sm px-4 py-2 whitespace-nowrap flex-shrink-0"
            >
              {t('upgradeNudge.cta')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Manual verify**

1. Free mode: upload photo, select free style, generate. Expected: result appears, then after ~0.4s a gold-star nudge card animates in below with upgrade CTA. Click "Upgrade" / "アップグレード" → goes to `/pricing`.
2. Paid mode: generate with paid mode. Expected: result appears, NO nudge card below.
3. Start a new generation (clear result): nudge card disappears.

- [ ] **Step 8: Commit**

```bash
git add src/components/GenerateForm.tsx messages/ja.json messages/en.json messages/zh.json
git commit -m "feat: show upgrade nudge after free watermarked generation"
```

---

## Final verification

After all Track 2 tasks are committed, run a full build:

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no type errors. Only the existing `<img>` warnings are acceptable (they are pre-existing, not introduced by this plan).

Then push and run the smoke test from Task 1-4 against production to confirm all flows work end-to-end.

```bash
git push origin main
```
