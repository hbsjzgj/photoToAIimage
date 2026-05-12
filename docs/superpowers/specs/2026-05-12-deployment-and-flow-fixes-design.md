# Deployment Verification & Flow Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two parallel tracks — (A) verify and complete Vercel + Supabase production deployment; (B) fix 6 broken user flows that block purchase conversion and general navigation.

**Architecture:** Track 1 is infrastructure/configuration with no code changes (except `schema.prisma` directUrl). Track 2 is pure code changes across 5 files with no infrastructure dependency. Both tracks are fully independent and can be executed in any order.

**Tech Stack:** Next.js 14 App Router, Prisma (PostgreSQL/Supabase), Stripe, fal.ai, next-intl (ja/en/zh), Framer Motion, Tailwind CSS

---

## Track 1 — Production Deployment Verification

### Task 1-1: Supabase database connection

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.local` (local only, never committed)
- Modify: `.env.local.example`

- [ ] **Step 1: Add `directUrl` to schema.prisma**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- [ ] **Step 2: Add both connection strings to `.env.local`**

```env
# Supabase — Transaction Pooler (Vercel serverless用)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase — Direct Connection (prisma migrate用)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

- [ ] **Step 3: Update `.env.local.example` to document both vars**

Add after `DATABASE_URL` line:
```env
DATABASE_URL="postgresql://..." # Supabase Transaction Pooler URL
DIRECT_URL="postgresql://..."   # Supabase Direct Connection URL (for prisma migrate)
```

- [ ] **Step 4: Run migration against Supabase**

```bash
npx prisma migrate deploy
```

Expected: All migrations applied successfully. If no `migrations/` directory exists, run `npx prisma migrate dev --name init` first to create the initial migration from current schema.

- [ ] **Step 5: Verify tables exist in Supabase**

```bash
npx prisma studio
```

Expected: Can connect and see all tables (User, UserCredits, CreditTransaction, DailyUsage, Project, ProjectVariant, ProcessedWebhookEvent).

- [ ] **Step 6: Commit schema change**

```bash
git add prisma/schema.prisma .env.local.example
git commit -m "feat: add Supabase directUrl to Prisma schema"
```

---

### Task 1-2: Vercel environment variables audit

**Files:** None (Vercel Dashboard configuration)

Go to Vercel Dashboard → Project → Settings → Environment Variables. Verify each variable exists for **Production** environment:

- [ ] **Step 1: Verify database vars**
  - `DATABASE_URL` — Supabase Transaction Pooler URI
  - `DIRECT_URL` — Supabase Direct Connection URI

- [ ] **Step 2: Verify auth vars**
  - `NEXTAUTH_URL` — exact production URL e.g. `https://forma.vercel.app` (no trailing slash)
  - `NEXTAUTH_SECRET` — random 32+ char string (generate: `openssl rand -base64 32`)

- [ ] **Step 3: Verify AI provider vars**
  - `FAL_KEY` — fal.ai API key (`fal-...`)
  - `AI_PROVIDER` — should NOT be set (or set to `fal` to be explicit); do NOT set to `replicate`

- [ ] **Step 4: Verify Stripe vars**
  - `STRIPE_SECRET_KEY` — `sk_live_...` or `sk_test_...`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_live_...` or `pk_test_...`
  - `STRIPE_WEBHOOK_SECRET` — `whsec_...` (from webhook endpoint, see Task 1-3)
  - `STRIPE_PRICE_STARTER` — Stripe Price ID for 10-credit pack
  - `STRIPE_PRICE_CREATOR` — Stripe Price ID for 30-credit pack
  - `STRIPE_PRICE_PRO` — Stripe Price ID for 100-credit pack

- [ ] **Step 5: Verify optional vars**
  - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — if using Cloudinary storage; if absent, LocalProvider (data URLs) is used
  - `NEXT_PUBLIC_POSTHOG_KEY` — if using analytics
  - `NEXT_PUBLIC_DEMO_MODE` — must NOT be `true` in production

- [ ] **Step 6: Redeploy after any changes**

In Vercel Dashboard → Deployments → Redeploy latest, or push a commit to trigger new build.

---

### Task 1-3: Stripe Webhook endpoint verification

**Files:** None (Stripe Dashboard configuration)

- [ ] **Step 1: Verify webhook endpoint in Stripe Dashboard**

Go to Stripe Dashboard → Developers → Webhooks. Confirm:
- Endpoint URL = `https://<production-domain>/api/webhook`
- Listening to event: `checkout.session.completed`
- Status: Enabled

- [ ] **Step 2: Copy signing secret**

Click the endpoint → Reveal signing secret → copy `whsec_...` value → paste into Vercel as `STRIPE_WEBHOOK_SECRET`.

- [ ] **Step 3: Send test event**

In Stripe Webhook page → "Send test event" → select `checkout.session.completed` → check Vercel function logs for `[Webhook] Added ... credits to user ...`.

---

### Task 1-4: End-to-end smoke test

- [ ] **Step 1: Basic navigation**
  - Visit `https://<domain>/ja` — home page loads
  - Language switcher: switch to en, zh, back to ja
  - All nav links work (Home, Generate, Pricing)

- [ ] **Step 2: Registration and free generation**
  - Register new account → lands on `/generate`
  - Upload a face photo → select free style → Generate
  - Expected: watermarked result appears within 60s

- [ ] **Step 3: Purchase flow**
  - Go to Pricing → click Buy Now on any pack
  - Use Stripe test card `4242 4242 4242 4242`, any future date, any CVC
  - Expected: lands on `/purchase/success` with correct credit count
  - Check Dashboard: credits balance updated

- [ ] **Step 4: Paid generation**
  - Go to Generate → switch to Paid mode → select any style → Generate
  - Expected: HD result without watermark

- [ ] **Step 5: Verify Vercel function logs**
  - In Vercel Dashboard → Functions tab, check recent `/api/generate` invocations
  - Confirm logs show: `[generate] env: ... FAL_KEY=set(...)` — NOT `FAL_KEY=NOT SET`

---

## Track 2 — Flow Fixes

### Task 2-1: Pricing page — handle `?canceled=true`

**Files:**
- Modify: `src/app/[locale]/pricing/page.tsx`

- [ ] **Step 1: Convert to client component and add canceled banner**

Change `pricing/page.tsx` from server component to client component. Add `useSearchParams` hook. Show amber banner when `?canceled=true`:

```tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ... existing imports

export default function PricingPage() {
  const searchParams = useSearchParams();
  const t = useTranslations();
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
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <div>
                  <p className="text-amber-400 font-medium text-sm">{t('dashboard.banner.canceledTitle')}</p>
                  <p className="text-ink-muted text-xs mt-0.5">{t('dashboard.banner.canceledSubtitle')}</p>
                </div>
                <button onClick={() => setShowCanceled(false)} className="text-ink-muted hover:text-ink text-lg leading-none">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ... rest of existing content unchanged ... */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

Note: `getTranslations()` (server) must be replaced with `useTranslations()` (client). The `t('pricing.*')` calls stay the same. Also remove `async` from the function signature — client components cannot be async.

- [ ] **Step 2: Verify banner appears and is dismissible**

Visit `/{locale}/pricing?canceled=true` — amber banner shows. Click × — banner hides.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/pricing/page.tsx
git commit -m "fix: show payment canceled banner on pricing page"
```

---

### Task 2-2: Auth — support `callbackUrl` for post-login redirect

**Files:**
- Modify: `src/app/[locale]/auth/page.tsx`
- Modify: `src/components/PricingCards.tsx`

- [ ] **Step 1: Read `callbackUrl` in auth page and redirect after login**

In `auth/page.tsx`, read `callbackUrl` from search params. After successful sign-in or sign-up (auto sign-in), redirect to `callbackUrl` if present, else `/generate`:

```tsx
// At top of component, add:
const searchParams = useSearchParams();
const callbackUrl = searchParams.get('callbackUrl') ?? `/${locale}/generate`;

// In handleSignIn, replace router.push line:
router.push(callbackUrl);

// In handleSignUp, after setTab('signin'), also auto sign-in:
// (sign up success shows message, user switches to signin tab manually —
//  store callbackUrl in state so it persists through tab switch)
```

Full pattern: store `callbackUrl` in a `const` derived from searchParams. After `handleSignIn` succeeds → `router.push(callbackUrl)`. After `handleSignUp` succeeds → show success message + switch to signin tab; `callbackUrl` is already in the URL so it persists.

- [ ] **Step 2: Update PricingCards to pass callbackUrl when redirecting to auth**

In `src/components/PricingCards.tsx`, find the code that redirects unauthenticated users to `/auth`. Add `callbackUrl`:

```tsx
// Before (approximate current code):
router.push(`/${locale}/auth`);

// After:
router.push(`/${locale}/auth?callbackUrl=/${locale}/pricing`);
```

- [ ] **Step 3: Verify the flow**

1. Sign out. Go to `/pricing`. Click "Buy Now". 
2. Expected: redirected to `/auth?callbackUrl=/ja/pricing`.
3. Sign in. Expected: redirected back to `/pricing`.
4. Click "Buy Now" again → Stripe checkout opens.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/auth/page.tsx src/components/PricingCards.tsx
git commit -m "fix: auth callbackUrl redirect for post-login return to pricing"
```

---

### Task 2-3: Generate page — insufficientCredits inline CTA

**Files:**
- Modify: `src/components/GenerateForm.tsx`

- [ ] **Step 1: Add `errorCode` state and update error-setting logic**

In `GenerateForm.tsx`, add a second state alongside `error`:

```tsx
const [error, setError] = useState('');
const [errorCode, setErrorCode] = useState('');  // add this
```

Wherever `setError(...)` is called, also call `setErrorCode(data.error ?? '')`. When clearing the error (`setError('')`), also call `setErrorCode('')`.

```tsx
// In the !res.ok branch:
setErrorCode(data.error ?? '');
setError(t(`errors.${data.error}`) || data.error);

// When clearing errors (e.g. at start of handleGenerate):
setError('');
setErrorCode('');
```

- [ ] **Step 2: Render inline CTA using errorCode**

Replace the plain error text block with:

```tsx
{error && (
  <motion.div
    className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span>{error}</span>
      {errorCode === 'insufficientCredits' && (
        <Link
          href={`/${locale}/pricing`}
          className="text-gold hover:text-gold/80 text-xs font-medium whitespace-nowrap transition-colors"
        >
          {t('paid.buyCredits')} →
        </Link>
      )}
    </div>
  </motion.div>
)}
```

- [ ] **Step 2: Verify CTA appears**

In paid mode with 0 credits, click Generate. Expected: error message with "Buy Credits →" link beside it. Click link → goes to `/pricing`.

- [ ] **Step 3: Commit**

```bash
git add src/components/GenerateForm.tsx
git commit -m "fix: add buy credits CTA inline when insufficient credits"
```

---

### Task 2-4: Header — mobile navigation menu

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Add hamburger button and mobile drawer**

Add state `const [mobileOpen, setMobileOpen] = useState(false)` to Header. Add hamburger icon button (visible only below `md`). Add AnimatePresence-wrapped full-screen overlay with all nav links, Sign In/Out, and LanguageSwitcher:

```tsx
// Hamburger button (add inside right section, visible below md):
<button
  className="md:hidden p-2 text-ink-secondary hover:text-ink transition-colors"
  onClick={() => setMobileOpen((o) => !o)}
  aria-label="Menu"
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

// Mobile drawer (after closing </header> tag, inside the outer fragment):
<AnimatePresence>
  {mobileOpen && (
    <motion.div
      className="fixed inset-0 z-40 md:hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface/90 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
      {/* Nav panel */}
      <motion.nav
        className="absolute top-16 inset-x-0 bg-surface border-b border-[rgba(255,255,255,0.07)] px-6 py-6 space-y-1"
        initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
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
        <div className="pt-4 border-t border-[rgba(255,255,255,0.07)] flex items-center justify-between">
          <LanguageSwitcher />
          {session?.user ? (
            <button onClick={() => { signOut({ callbackUrl: `/${locale}` }); setMobileOpen(false); }}
              className="text-sm text-ink-secondary hover:text-ink transition-colors">
              {t('common.signOut')}
            </button>
          ) : (
            <Link href={`/${locale}/auth`} onClick={() => setMobileOpen(false)}
              className="btn-ghost text-sm py-2 px-4">
              {t('common.signIn')}
            </Link>
          )}
        </div>
      </motion.nav>
    </motion.div>
  )}
</AnimatePresence>
```

Close mobile menu on route change: add `useEffect(() => setMobileOpen(false), [pathname])`.

- [ ] **Step 2: Verify on mobile viewport**

Resize browser to < 768px. Hamburger icon appears. Tap → drawer slides in with all nav links. Tap a link → navigates + drawer closes. Tap backdrop → drawer closes.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add mobile navigation hamburger menu"
```

---

### Task 2-5: Auth page — i18n subtitle

**Files:**
- Modify: `src/app/[locale]/auth/page.tsx`
- Modify: `messages/ja.json`
- Modify: `messages/en.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Add i18n keys to all three message files**

In `messages/ja.json`, add inside `"auth"`:
```json
"signin": {
  ...existing keys...,
  "subtitle": "アカウントにサインイン"
},
"signup": {
  ...existing keys...,
  "subtitle": "アカウントを作成"
}
```

In `messages/en.json`:
```json
"signin": { ..., "subtitle": "Sign in to your account" },
"signup": { ..., "subtitle": "Create your account" }
```

In `messages/zh.json`:
```json
"signin": { ..., "subtitle": "登录你的账号" },
"signup": { ..., "subtitle": "创建账号" }
```

- [ ] **Step 2: Replace hardcoded strings in auth/page.tsx**

```tsx
// Replace:
{tab === 'signin' ? 'アカウントにサインイン' : 'アカウントを作成'}

// With:
{tab === 'signin' ? t('signin.subtitle') : t('signup.subtitle')}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/auth/page.tsx messages/ja.json messages/en.json messages/zh.json
git commit -m "fix: replace hardcoded Japanese strings in auth page with i18n"
```

---

### Task 2-6: Generate page — free result upgrade nudge

**Files:**
- Modify: `src/components/GenerateForm.tsx`
- Modify: `messages/ja.json`, `messages/en.json`, `messages/zh.json`

- [ ] **Step 1: Add i18n keys for upgrade nudge**

In all three message files, add inside `"generate"`:
```json
"upgradeNudge": {
  "title": "HD無透かし版を入手",
  "desc": "全14スタイル · 1024×1024 · 4枚同時生成",
  "cta": "アップグレード"
}
```

English:
```json
"upgradeNudge": {
  "title": "Get HD without watermark",
  "desc": "All 14 styles · 1024×1024 · 4 images at once",
  "cta": "Upgrade"
}
```

Chinese:
```json
"upgradeNudge": {
  "title": "获取高清无水印版本",
  "desc": "全部14种风格 · 1024×1024 · 同时生成4张",
  "cta": "立即升级"
}
```

- [ ] **Step 2: Render upgrade nudge card below free result**

In `GenerateForm.tsx`, in the result display section, after the `<ImageResult>` component, add:

```tsx
{result && result.hasWatermark && (
  <motion.div
    className="glass-card p-5 flex items-center justify-between gap-4"
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-gold" viewBox="0 0 16 16" fill="none">
          <path d="M8 1l1.9 3.8 4.1.6-3 2.9.7 4.2L8 10.4l-3.7 1.9.7-4.2-3-2.9 4.1-.6z"
            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{t('upgradeNudge.title')}</p>
        <p className="text-xs text-ink-muted mt-0.5">{t('upgradeNudge.desc')}</p>
      </div>
    </div>
    <Link href={`/${locale}/pricing`} className="btn-gold text-sm px-4 py-2 whitespace-nowrap flex-shrink-0">
      {t('upgradeNudge.cta')}
    </Link>
  </motion.div>
)}
```

- [ ] **Step 3: Verify nudge appears only for free results**

Free mode generation → result shows → nudge card appears below. Paid mode generation → nudge does NOT appear.

- [ ] **Step 4: Commit**

```bash
git add src/components/GenerateForm.tsx messages/ja.json messages/en.json messages/zh.json
git commit -m "feat: add upgrade nudge after free watermarked generation"
```

---

## Execution Order

Track 1 and Track 2 are fully independent. Recommended sequence:

1. **Track 1 first** — get production running so Track 2 changes can be tested in real env
2. **Track 2** — execute tasks 2-1 through 2-6 in order (each is independent of the others)

After all tasks complete, run the smoke test from Task 1-4 again to verify the full flow end-to-end with fixes applied.
