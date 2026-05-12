# Generate UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 UX issues in the generate flow: credits sync, invalid upload reset, no image stretching, before/after in upload area, style prompt display, and aspect ratio crop.

**Architecture:** All changes are isolated to 4 component files and 1 lib file. No API, database, or payment changes. `GenerateForm.tsx` is the main orchestrator; `CreditsDisplay.tsx`, `ImageResult.tsx`, `BeforeAfterSlider.tsx` each get targeted changes.

**Tech Stack:** Next.js 14, React 18, Framer Motion, Tailwind CSS, next-intl, HTML Canvas API (for crop)

---

## File Map

- `src/components/CreditsDisplay.tsx` — add `credits:refresh` custom event listener
- `src/components/GenerateForm.tsx` — dispatch event, fix reset, add before/after state, add crop state + UI, add style prompt display
- `src/components/ImageResult.tsx` — remove `originalSrc` prop + slider toggle, fix `object-contain`
- `src/components/BeforeAfterSlider.tsx` — fix `object-contain` + dark bg
- `src/lib/prompts.ts` — export `STYLE_DISPLAY_PROMPTS` record

---

## Task 1 (P0): CreditsDisplay auto-refresh after generation

**Files:**
- Modify: `src/components/CreditsDisplay.tsx`
- Modify: `src/components/GenerateForm.tsx` (dispatch site only)

### Context

`CreditsDisplay` in the header only re-fetches when `session` changes. After paid generation, credits drop but the display stays stale. Fix: dispatch a `credits:refresh` custom event from `GenerateForm` after any successful generation, and listen for it in `CreditsDisplay`.

- [ ] **Step 1: Add event listener to `CreditsDisplay.tsx`**

Read `src/components/CreditsDisplay.tsx`. Replace the entire file with:

```tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function CreditsDisplay() {
  const { data: session } = useSession();
  const locale = useLocale();
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(() => {
    if (!session?.user) return;
    fetch('/api/credits')
      .then((r) => r.json())
      .then((d) => setCredits(d.credits));
  }, [session]);

  // Initial fetch + re-fetch on session change
  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  // Re-fetch when GenerateForm dispatches credits:refresh
  useEffect(() => {
    window.addEventListener('credits:refresh', fetchCredits);
    return () => window.removeEventListener('credits:refresh', fetchCredits);
  }, [fetchCredits]);

  if (!session?.user || credits === null) return null;

  return (
    <Link
      href={`/${locale}/pricing`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                 bg-gold-muted border border-gold/20
                 text-gold text-xs font-medium
                 hover:bg-gold/20 hover:border-gold/40
                 transition-all duration-300"
    >
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 3.5v5M4 5.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span>{credits} cr</span>
    </Link>
  );
}
```

- [ ] **Step 2: Dispatch `credits:refresh` in `GenerateForm.tsx` after successful generation**

Read `src/components/GenerateForm.tsx`. Find the line `setResult(data);` inside `handleGenerate` (around line 161). Add the dispatch immediately after it:

```tsx
      setResult(data);
      window.dispatchEvent(new CustomEvent('credits:refresh'));
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CreditsDisplay.tsx src/components/GenerateForm.tsx
git commit -m "fix: auto-refresh CreditsDisplay after generation via credits:refresh event"
```

---

## Task 2 (P0): Full reset on invalid upload

**Files:**
- Modify: `src/components/GenerateForm.tsx`

### Context

`handleFile` currently only calls `setError(...)` + `return` when validation fails (wrong type, too large, too small, too large dimensions). The old preview, imageBase64, and result remain visible. Fix: clear all image state before returning on any validation failure.

- [ ] **Step 1: Update `handleFile` in `GenerateForm.tsx`**

Read `src/components/GenerateForm.tsx`. Find `handleFile`. There are 4 early-return validation paths:

**Path A** — wrong file type (before `img.onload`, around line 77):
```tsx
    if (!ALLOWED.includes(file.type)) {
      setError(t('errors.invalidFileType'));
      return;
    }
```
Replace with:
```tsx
    if (!ALLOWED.includes(file.type)) {
      setPreview('');
      setImageBase64('');
      setResult(null);
      setError(t('errors.invalidFileType'));
      return;
    }
```

**Path B** — file too large (around line 81):
```tsx
    if (file.size > 5 * 1024 * 1024) {
      setError(t('errors.fileTooLarge'));
      return;
    }
```
Replace with:
```tsx
    if (file.size > 5 * 1024 * 1024) {
      setPreview('');
      setImageBase64('');
      setResult(null);
      setError(t('errors.fileTooLarge'));
      return;
    }
```

**Path C** — image too small (inside `img.onload`, around line 91):
```tsx
      if (w0 < 256 || h0 < 256) {
        setError(t('errors.imageTooSmall'));
        URL.revokeObjectURL(objectUrl);
        return;
      }
```
Replace with:
```tsx
      if (w0 < 256 || h0 < 256) {
        setPreview('');
        setImageBase64('');
        setResult(null);
        setError(t('errors.imageTooSmall'));
        URL.revokeObjectURL(objectUrl);
        return;
      }
```

**Path D** — image too large dimensions (around line 96):
```tsx
      if (w0 > 4096 || h0 > 4096) {
        setError(t('errors.imageTooLarge'));
        URL.revokeObjectURL(objectUrl);
        return;
      }
```
Replace with:
```tsx
      if (w0 > 4096 || h0 > 4096) {
        setPreview('');
        setImageBase64('');
        setResult(null);
        setError(t('errors.imageTooLarge'));
        URL.revokeObjectURL(objectUrl);
        return;
      }
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/GenerateForm.tsx
git commit -m "fix: fully reset image state when invalid file is uploaded"
```

---

## Task 3 (P0): Replace object-cover with object-contain everywhere

**Files:**
- Modify: `src/components/GenerateForm.tsx` (upload preview)
- Modify: `src/components/ImageResult.tsx` (result image + thumbnails)
- Modify: `src/components/BeforeAfterSlider.tsx` (both images)

### Context

All `<Image>` components currently use `className="object-cover"` which crops/distorts non-square images. Replace with `object-contain` and add a dark background so letterboxed areas look intentional.

- [ ] **Step 1: Fix upload preview in `GenerateForm.tsx`**

Read `src/components/GenerateForm.tsx`. Find the preview `<Image>` (around line 207):
```tsx
              <Image src={preview} alt="Preview" fill className="object-cover" />
```
Replace with:
```tsx
              <Image src={preview} alt="Preview" fill className="object-contain" />
```

Also find the container `motion.div` with `className="relative w-full aspect-[4/3]"` (around line 200). Add a dark background:
```tsx
              className="relative w-full aspect-[4/3] bg-[rgba(0,0,0,0.25)]"
```

- [ ] **Step 2: Fix result image and thumbnails in `ImageResult.tsx`**

Read `src/components/ImageResult.tsx`.

Find the main result image (around line 119):
```tsx
            <Image
              src={currentUrl}
              alt="Generated avatar"
              fill
              className="object-cover"
              unoptimized
            />
```
Replace `className="object-cover"` with `className="object-contain"`.

Also add `bg-[rgba(0,0,0,0.25)]` to its container `motion.div` (the one with `className="relative aspect-square rounded-3xl..."`):
```tsx
            className="relative aspect-square rounded-3xl overflow-hidden
                       bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.07)]"
```

Find the thumbnail images (around line 153):
```tsx
              <Image src={v.imageUrl} alt={`Variant ${i + 1}`} fill className="object-cover" unoptimized />
```
Replace with:
```tsx
              <Image src={v.imageUrl} alt={`Variant ${i + 1}`} fill className="object-contain bg-[rgba(0,0,0,0.25)]" unoptimized />
```

- [ ] **Step 3: Fix BeforeAfterSlider images**

Read `src/components/BeforeAfterSlider.tsx`.

Find the AI result image (line 43):
```tsx
        <Image src={afterSrc} alt="AI result" fill className="object-cover" unoptimized />
```
Replace with:
```tsx
        <Image src={afterSrc} alt="AI result" fill className="object-contain" unoptimized />
```

Find the original image (line 51):
```tsx
        <Image src={beforeSrc} alt="Original" fill className="object-cover" unoptimized />
```
Replace with:
```tsx
        <Image src={beforeSrc} alt="Original" fill className="object-contain" unoptimized />
```

Add `bg-[rgba(0,0,0,0.3)]` to both wrapper divs (lines 42 and 47):
```tsx
      {/* AI result — full layer underneath */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]">
        <Image src={afterSrc} alt="AI result" fill className="object-contain" unoptimized />
      </div>

      {/* Original — clipped to left side of slider */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.3)]"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image src={beforeSrc} alt="Original" fill className="object-contain" unoptimized />
      </div>
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/GenerateForm.tsx src/components/ImageResult.tsx src/components/BeforeAfterSlider.tsx
git commit -m "fix: use object-contain everywhere to prevent image distortion"
```

---

## Task 4 (P1): Upload area transforms to Before/After slider after generation

**Files:**
- Modify: `src/components/GenerateForm.tsx` — add 3rd state (slider) to upload area
- Modify: `src/components/ImageResult.tsx` — remove slider toggle + `originalSrc` prop

### Context

After generation, the upload area (top section) should replace the preview with `BeforeAfterSlider`. The separate `ImageResult` slider toggle becomes redundant and should be removed. The `ImageResult` component keeps the variant thumbnails and action buttons.

- [ ] **Step 1: Import BeforeAfterSlider in `GenerateForm.tsx`**

Read `src/components/GenerateForm.tsx`. Find the import section at the top. Add:
```tsx
import BeforeAfterSlider from './BeforeAfterSlider';
```

- [ ] **Step 2: Replace upload area AnimatePresence with 3-state version**

Find the `<AnimatePresence mode="wait">` inside the upload `motion.div` (around line 197). Currently it has two branches: `preview` (shows image) and `empty` (shows drag zone).

Replace the entire `<AnimatePresence mode="wait">` block (lines 197–247) with:

```tsx
        <AnimatePresence mode="wait">
          {result && imageBase64 ? (
            /* ── State 3: After generation — Before/After slider ── */
            <motion.div
              key="slider"
              className="relative w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BeforeAfterSlider
                beforeSrc={imageBase64}
                afterSrc={result.variants[0]?.imageUrl ?? ''}
              />
              {/* Change photo overlay */}
              <div className="absolute top-3 right-3 z-20">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="px-3 py-1.5 rounded-xl bg-[rgba(0,0,0,0.6)] backdrop-blur-md
                             border border-[rgba(255,255,255,0.10)] text-xs text-ink
                             hover:bg-[rgba(0,0,0,0.8)] transition-colors"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {t('upload.change')}
                </motion.button>
              </div>
            </motion.div>
          ) : preview ? (
            /* ── State 2: Image uploaded — show preview ── */
            <motion.div
              key="preview"
              className="relative w-full aspect-[4/3] bg-[rgba(0,0,0,0.25)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image src={preview} alt="Preview" fill className="object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <span className="text-sm text-ink/80">{t('upload.label')}</span>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="px-4 py-2 rounded-xl bg-[rgba(0,0,0,0.5)] backdrop-blur-md
                             border border-[rgba(255,255,255,0.10)] text-xs text-ink
                             hover:bg-[rgba(0,0,0,0.7)] transition-colors"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {t('upload.change')}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* ── State 1: Empty — drag zone ── */
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-20 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 rounded-2xl border border-[rgba(255,255,255,0.10)]
                           bg-[rgba(255,255,255,0.04)] flex items-center justify-center"
                animate={dragging ? { scale: 1.1, borderColor: 'rgba(200,169,107,0.5)' } : {}}
              >
                <svg className="w-6 h-6 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </motion.div>
              <div className="text-center">
                <p className="text-ink-secondary text-sm">{t('upload.drag')}</p>
                <p className="text-ink-muted text-xs mt-1">{t('upload.hint')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
```

- [ ] **Step 3: Disable outer onClick when slider is shown**

Find the outer upload `motion.div` (around line 182). It has `onClick={() => inputRef.current?.click()}`. Change it to only trigger when not in slider state:

```tsx
        onClick={result && imageBase64 ? undefined : () => inputRef.current?.click()}
```

- [ ] **Step 4: Remove `originalSrc` prop from `<ImageResult>` in `GenerateForm.tsx`**

Find (around line 449–454):
```tsx
            <ImageResult
              variants={result.variants}
              hasWatermark={result.hasWatermark}
              originalSrc={imageBase64 || undefined}
              onRegenerate={!result.hasWatermark ? handleGenerate : undefined}
            />
```
Replace with:
```tsx
            <ImageResult
              variants={result.variants}
              hasWatermark={result.hasWatermark}
              onRegenerate={!result.hasWatermark ? handleGenerate : undefined}
            />
```

- [ ] **Step 5: Remove slider logic from `ImageResult.tsx`**

Read `src/components/ImageResult.tsx`. Apply these changes:

1. Remove `BeforeAfterSlider` import (line 5): delete `import BeforeAfterSlider from './BeforeAfterSlider';`

2. Remove `originalSrc` from the Props interface:
```tsx
interface Props {
  variants: Variant[];
  hasWatermark: boolean;
  onRegenerate?: () => void;
}
```

3. Remove `showSlider` state: delete `const [showSlider, setShowSlider] = useState(!!originalSrc);`

4. Update function signature — remove `originalSrc`:
```tsx
export default function ImageResult({ variants, hasWatermark, onRegenerate }: Props) {
```

5. In the header row, remove the Before/After toggle button (the `originalSrc &&` block containing the `motion.button` with `showSlider ? '結果のみ' : 'Before / After'`).

6. Replace the `<AnimatePresence mode="wait">` main image block (which currently has `showSlider` branching) with the simple result-only version:
```tsx
      {/* ── Main image ── */}
      <motion.div
        key={`result-${selected}`}
        className="relative aspect-square rounded-3xl overflow-hidden
                   bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.07)]"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src={currentUrl}
          alt="Generated avatar"
          fill
          className="object-contain"
          unoptimized
        />
        {hasWatermark && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-xl
                          bg-[rgba(0,0,0,0.6)] backdrop-blur-md
                          text-xs text-ink-secondary border border-[rgba(255,255,255,0.08)]">
            ウォーターマーク
          </div>
        )}
      </motion.div>
```

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/GenerateForm.tsx src/components/ImageResult.tsx
git commit -m "feat: transform upload area to before/after slider after generation"
```

---

## Task 5 (P1): Style display prompt + supplement custom prompt

**Files:**
- Modify: `src/lib/prompts.ts` — add `STYLE_DISPLAY_PROMPTS`
- Modify: `src/components/GenerateForm.tsx` — show style prompt read-only, rename custom textarea

### Context

When a style is selected, show a short user-friendly description of that style in a read-only field above the custom textarea. The existing `customPrompt` state is used as a supplement (appended to the style's technical prompt by the API — no server change needed).

- [ ] **Step 1: Add `STYLE_DISPLAY_PROMPTS` to `src/lib/prompts.ts`**

Read `src/lib/prompts.ts`. Add this export after the `getPromptForStyle` function:

```ts
export const STYLE_DISPLAY_PROMPTS: Record<string, string> = {
  anime_basic:      'Clean anime portrait · soft lighting · expressive eyes',
  soft_cartoon:     'Soft premium cartoon · warm cinematic tones · elegant rendering',
  cute_pet:         'Adorable kawaii pet portrait · fluffy details · expressive eyes',
  simple_icon:      'Minimal flat illustration · clean modern app icon aesthetic',
  '3d_cartoon':     'Pixar-inspired 3D animated portrait · cinematic global illumination',
  anime_pro:        'Premium Japanese anime · cinematic rim lighting · high-end detail',
  soft_storybook:   'Dreamy watercolor storybook · whimsical mood · hand-painted texture',
  cyberpunk:        'Neon-lit cyberpunk portrait · futuristic atmosphere · holographic glow',
  comic_hero:       'Cinematic superhero portrait · dramatic lighting · graphic novel quality',
  fashion_avatar:   'Luxury fashion editorial · premium magazine aesthetic · elegant lighting',
  business_profile: 'Professional executive portrait · premium LinkedIn style · studio quality',
  pet_portrait_pro: 'Luxury pet portrait photography · cinematic studio lighting · rich warm tones',
  couple_avatar:    'Romantic couple portrait · cinematic emotional lighting · harmonious mood',
  kawaii_icon:      'Super cute Japanese kawaii icon · soft pastel palette · rounded modern design',
};
```

- [ ] **Step 2: Update the Custom Prompt section in `GenerateForm.tsx`**

Read `src/components/GenerateForm.tsx`. Import `STYLE_DISPLAY_PROMPTS`:
```tsx
import { STYLE_DISPLAY_PROMPTS } from '@/lib/prompts';
```

Find the `{/* ── Custom Prompt ── */}` section (around lines 289–306). Replace the entire block with:

```tsx
      {/* ── Style Prompt + Custom Supplement ── */}
      <div className="space-y-3">
        {/* Style prompt — read-only, shown when a style is selected */}
        <AnimatePresence>
          {style && (
            <motion.div
              key={style}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-ink-muted font-medium tracking-wider uppercase mb-1.5">
                {t('stylePromptLabel')}
              </p>
              <div className="w-full input-field text-sm text-ink-muted/70
                              bg-[rgba(255,255,255,0.02)] cursor-default select-text
                              leading-relaxed">
                {STYLE_DISPLAY_PROMPTS[style] ?? style}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom supplement — always visible */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-ink-muted font-medium tracking-wider uppercase">
              {t('promptLabel')}
            </p>
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value.slice(0, 200))}
            placeholder={t('promptPlaceholder')}
            rows={2}
            maxLength={200}
            className="w-full input-field text-sm resize-none leading-relaxed"
          />
          <p className={`text-right text-[10px] mt-1 tabular-nums transition-colors
                         ${customPrompt.length >= 190 ? 'text-gold/70' : 'text-ink-muted/40'}`}>
            {customPrompt.length}/200
          </p>
        </div>
      </div>
```

- [ ] **Step 3: Add `stylePromptLabel` i18n key to all 3 message files**

In `messages/ja.json`, find `"generate"` → `"promptLabel"`. Add the new key adjacent to it:
```json
"stylePromptLabel": "スタイル説明",
```

In `messages/en.json`:
```json
"stylePromptLabel": "Style",
```

In `messages/zh.json`:
```json
"stylePromptLabel": "风格说明",
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompts.ts src/components/GenerateForm.tsx messages/ja.json messages/en.json messages/zh.json
git commit -m "feat: show style display prompt and separate supplement custom prompt input"
```

---

## Task 6 (P2): Aspect ratio crop presets after upload

**Files:**
- Modify: `src/components/GenerateForm.tsx` — add `originalImageBase64`, `cropAspect` state, `applyCrop` utility, crop buttons UI

### Context

After a valid upload, show crop ratio buttons (1:1, 4:5, Original). Default is 1:1. Selecting a ratio performs a center crop via Canvas. "Restore" resets to the full original aspect. The crop operates on the already-scaled `originalImageBase64` (max 768px), so it stays within the existing compression pipeline.

- [ ] **Step 1: Add `applyCrop` utility above the component**

Read `src/components/GenerateForm.tsx`. Find the line `export default function GenerateForm()`. Directly above it (outside the component), add:

```tsx
async function applyCrop(src: string, aspectW: number, aspectH: number): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const ratio = aspectW / aspectH;
      let cropW = w, cropH = h, cropX = 0, cropY = 0;
      if (w / h > ratio) {
        cropW = h * ratio;
        cropX = (w - cropW) / 2;
      } else {
        cropH = w / ratio;
        cropY = (h - cropH) / 2;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);
      canvas.getContext('2d')!.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  });
}
```

- [ ] **Step 2: Add crop state variables**

Inside the `GenerateForm` component, after the existing state declarations (near line 43), add:

```tsx
  const [originalImageBase64, setOriginalImageBase64] = useState('');
  const [cropAspect, setCropAspect] = useState<'1:1' | '4:5' | 'original'>('1:1');
```

- [ ] **Step 3: Update `handleFile` to store original and apply default 1:1 crop**

In `handleFile`, find the success path inside `img.onload` (around lines 102–119):
```tsx
      const b64 = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      analytics.uploadStarted();
      setImageBase64(b64);
      setPreview(b64);
      setResult(null);
      setError('');
```

Replace with:
```tsx
      const b64 = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      analytics.uploadStarted();
      setOriginalImageBase64(b64);
      setCropAspect('1:1');
      const cropped = await applyCrop(b64, 1, 1);
      setImageBase64(cropped);
      setPreview(cropped);
      setResult(null);
      setError('');
```

Since `img.onload` is now async, change the callback assignment:
```tsx
      img.onload = async () => {
```
(It was previously `img.onload = () => {`)

Also add `setOriginalImageBase64('');` and `setCropAspect('1:1');` to each of the 4 validation failure paths added in Task 2 (all 4 early returns in `handleFile`). Example for Path A:
```tsx
    if (!ALLOWED.includes(file.type)) {
      setPreview('');
      setImageBase64('');
      setOriginalImageBase64('');
      setCropAspect('1:1');
      setResult(null);
      setError(t('errors.invalidFileType'));
      return;
    }
```
Apply the same two additional lines to Paths B, C, D.

- [ ] **Step 4: Add `handleCropChange` function**

After `handleStyleSelect` (around line 58), add:

```tsx
  async function handleCropChange(ratio: '1:1' | '4:5' | 'original') {
    if (!originalImageBase64) return;
    setCropAspect(ratio);
    if (ratio === 'original') {
      setImageBase64(originalImageBase64);
      setPreview(originalImageBase64);
      return;
    }
    const [w, h] = ratio === '1:1' ? [1, 1] : [4, 5];
    const cropped = await applyCrop(originalImageBase64, w, h);
    setImageBase64(cropped);
    setPreview(cropped);
  }
```

- [ ] **Step 5: Add crop buttons UI after the upload area**

In `GenerateForm.tsx`, find the `<input ref={inputRef} .../>` hidden input (around line 250). Directly after it, add the crop buttons block:

```tsx
      {/* ── Crop ratio buttons (visible after valid upload, hidden when result is shown) ── */}
      <AnimatePresence>
        {originalImageBase64 && !result && (
          <motion.div
            className="flex items-center gap-2 flex-wrap"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {(['1:1', '4:5', 'original'] as const).map((ratio) => (
              <motion.button
                key={ratio}
                onClick={() => handleCropChange(ratio)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200
                  ${cropAspect === ratio
                    ? 'bg-gold/15 text-gold border border-gold/40'
                    : 'bg-[rgba(255,255,255,0.04)] text-ink-muted border border-[rgba(255,255,255,0.07)] hover:text-ink hover:border-[rgba(255,255,255,0.15)]'
                  }`}
              >
                {ratio === 'original' ? t('crop.original') : ratio}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
```

- [ ] **Step 6: Add crop i18n keys**

In `messages/ja.json`, inside `"generate"`, add:
```json
"crop": {
  "original": "オリジナル"
}
```

In `messages/en.json`:
```json
"crop": {
  "original": "Original"
}
```

In `messages/zh.json`:
```json
"crop": {
  "original": "原始比例"
}
```

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npx tsc --noEmit
```

Expected: no errors. If you see `Type 'void' is not assignable to type 'EventHandler'` on the async `img.onload`, that is fine — async void callbacks are valid in browser code and TypeScript 5 accepts them.

- [ ] **Step 8: Commit**

```bash
git add src/components/GenerateForm.tsx messages/ja.json messages/en.json messages/zh.json
git commit -m "feat: add 1:1 / 4:5 / original aspect ratio crop presets after upload"
```

---

## Final Step: Full build + push

- [ ] **Step 1: Full production build**

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage && npm run build
```

Expected: `✓ Compiled successfully` with no type errors. Pre-existing `<img>` warnings are acceptable.

- [ ] **Step 2: Push to origin**

```bash
git push origin main
```
