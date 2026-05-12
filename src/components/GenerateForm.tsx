'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import StyleSelector from './StyleSelector';
import ImageResult from './ImageResult';
import BeforeAfterSlider from './BeforeAfterSlider';
import { analytics } from '@/lib/analytics';
import { STYLE_DISPLAY_PROMPTS } from '@/lib/prompts';
import type { StyleId, GenerationMode } from '@/types';

interface CreditsState { credits: number; freeRemaining: number }

type ResultData = {
  projectId: string | null;
  variants: { id: string; imageUrl: string }[];
  creditsUsed: number;
  hasWatermark: boolean;
  providerUsed?: string;
  isDemo?: boolean;
};

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

export default function GenerateForm() {
  const t = useTranslations('generate');
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [imageBase64, setImageBase64] = useState('');
  const [preview, setPreview] = useState('');
  const [style, setStyle] = useState<StyleId | ''>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('free');
  const [count, setCount] = useState<1 | 4>(1);
  const [outputSize, setOutputSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [creditsState, setCreditsState] = useState<CreditsState>({ credits: 0, freeRemaining: 3 });
  const [dragging, setDragging] = useState(false);
  const [loadingSecs, setLoadingSecs] = useState(0);
  const [originalImageBase64, setOriginalImageBase64] = useState('');
  const [cropAspect, setCropAspect] = useState<'1:1' | '4:5' | 'original'>('1:1');

  const inputRef = useRef<HTMLInputElement>(null);

  // Elapsed-time counter while generating
  useEffect(() => {
    if (!loading) { setLoadingSecs(0); return; }
    const timer = setInterval(() => setLoadingSecs((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  function handleStyleSelect(s: StyleId | '') {
    setStyle(s);
    if (s) analytics.styleSelected(s);
  }

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

  // Fetch free usage for all users (including anonymous)
  useEffect(() => {
    fetch('/api/usage').then((r) => r.json()).then((d) => {
      setCreditsState((s) => ({ ...s, freeRemaining: d.remaining ?? 3 }));
    });
  }, [result]);

  // Fetch credit balance only for logged-in users
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/credits').then((r) => r.json()).then(setCreditsState);
  }, [session, result]);

  const handleFile = useCallback((file: File) => {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED.includes(file.type)) {
      setPreview('');
      setImageBase64('');
      setOriginalImageBase64('');
      setCropAspect('1:1');
      setResult(null);
      setError(t('errors.invalidFileType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPreview('');
      setImageBase64('');
      setOriginalImageBase64('');
      setCropAspect('1:1');
      setResult(null);
      setError(t('errors.fileTooLarge'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.onload = async () => {
      const { naturalWidth: w0, naturalHeight: h0 } = img;
      if (w0 < 256 || h0 < 256) {
        setPreview('');
        setImageBase64('');
        setOriginalImageBase64('');
        setCropAspect('1:1');
        setResult(null);
        setError(t('errors.imageTooSmall'));
        URL.revokeObjectURL(objectUrl);
        return;
      }
      if (w0 > 4096 || h0 > 4096) {
        setPreview('');
        setImageBase64('');
        setOriginalImageBase64('');
        setCropAspect('1:1');
        setResult(null);
        setError(t('errors.imageTooLarge'));
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const MAX = 768;
      const scale = Math.min(1, MAX / Math.max(w0, h0));
      const w = Math.round(w0 * scale);
      const h = Math.round(h0 * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
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
    };
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  }, [t]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleGenerate() {
    if (!imageBase64) { setError(t('errors.noImage')); return; }
    if (!style) { setError(t('errors.noStyle')); return; }
    if (mode === 'paid' && !session?.user) { router.push(`/${locale}/auth`); return; }

    setLoading(true);
    setError('');
    setErrorCode('');
    setResult(null);

    const startMs = Date.now();
    analytics.generationStarted({ style: style as string, mode });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, style, mode, count, outputSize, customPrompt: customPrompt.trim() || undefined }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        analytics.generationFailed({ style: style as string, mode, error: data.error ?? 'unknown' });
        setErrorCode(data.error ?? '');
        setError(t(`errors.${data.error}`) || data.error);
        return;
      }
      analytics.generationSuccess({ style: style as string, provider: data.providerUsed ?? 'unknown', durationMs: Date.now() - startMs, mode });
      setResult(data);
      window.dispatchEvent(new CustomEvent('credits:refresh'));
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        analytics.generationFailed({ style: style as string, mode, error: 'timeout' });
        setError(t('errors.timeout'));
      } else {
        analytics.generationFailed({ style: style as string, mode, error: 'clientError' });
        setError(t('errors.generationFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = !loading && !!imageBase64 && !!style;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Upload ── */}
      <motion.div
        className={`relative rounded-3xl overflow-hidden border transition-all duration-400 cursor-pointer
                    ${dragging
                      ? 'border-gold/50 bg-gold/5'
                      : preview
                        ? 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)]'
                        : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.13)] hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={result && imageBase64 ? undefined : () => inputRef.current?.click()}
        whileHover={!preview ? { scale: 1.005 } : {}}
        transition={{ duration: 0.3 }}
      >
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
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

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

      {/* ── Mode Tabs (logged-in only) ── */}
      {session?.user && (
        <div className="flex rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-1">
          {(['free', 'paid'] as GenerationMode[]).map((m) => (
            <motion.button
              key={m}
              onClick={() => { setMode(m); handleStyleSelect(''); }}
              className={`relative flex-1 py-3 rounded-xl text-sm font-medium transition-colors duration-300
                          ${mode === m ? 'text-ink' : 'text-ink-muted hover:text-ink-secondary'}`}
            >
              {mode === m && (
                <motion.div
                  layoutId="mode-tab"
                  className="absolute inset-0 rounded-xl bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.10)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">
                {m === 'free' ? `${t('freeMode')} (${creditsState.freeRemaining})` : `${t('paidMode')} (${creditsState.credits} cr)`}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Style Selector ── */}
      <div>
        <p className="text-xs text-ink-muted font-medium tracking-wider uppercase mb-4">{t('styleLabel')}</p>
        <StyleSelector selected={style} onSelect={handleStyleSelect} mode={session?.user ? mode : 'free'} />
      </div>

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

      {/* ── Paid options ── */}
      <AnimatePresence>
        {session?.user && mode === 'paid' && (
          <motion.div
            className="glass-card p-6 grid sm:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wider mb-4">{t('countLabel')}</p>
              <div className="space-y-2">
                {([1, 4] as (1 | 4)[]).map((n) => (
                  <label key={n} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                    ${count === n ? 'border-gold bg-gold/20' : 'border-ink-muted/30 group-hover:border-ink-muted/60'}`}
                         onClick={() => setCount(n)}>
                      {count === n && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    </div>
                    <span className="text-sm text-ink-secondary">{n === 1 ? t('count1') : t('count4')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wider mb-4">{t('sizeLabel')}</p>
              <div className="space-y-2">
                {['1024x1024', '1536x1536'].map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                    ${outputSize === s ? 'border-gold bg-gold/20' : 'border-ink-muted/30 group-hover:border-ink-muted/60'}`}
                         onClick={() => setOutputSize(s)}>
                      {outputSize === s && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    </div>
                    <span className="text-sm text-ink-secondary font-mono">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── Generate Button ── */}
      <motion.button
        onClick={handleGenerate}
        disabled={!canGenerate}
        whileHover={canGenerate ? { scale: 1.01, y: -1 } : {}}
        whileTap={canGenerate ? { scale: 0.98 } : {}}
        className={`w-full py-5 rounded-3xl font-medium text-base
                    transition-all duration-400
                    ${canGenerate
                      ? 'bg-gold text-surface shadow-gold hover:bg-gold-light hover:shadow-gold cursor-pointer'
                      : 'bg-[rgba(255,255,255,0.05)] text-ink-muted cursor-not-allowed'
                    }`}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span
              key="loading"
              className="flex flex-col items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="flex items-center gap-3">
                <motion.div
                  className="w-4 h-4 rounded-full border-2 border-surface/40 border-t-surface"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                {t('generating')}
                {loadingSecs > 0 && (
                  <span className="text-surface/60 font-normal tabular-nums">{loadingSecs}s</span>
                )}
              </span>
              {loadingSecs < 12 && (
                <span className="text-[11px] text-surface/50 font-normal">
                  通常5〜15秒
                </span>
              )}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {t('generateBtn')}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Result ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card p-6"
          >
            {result.providerUsed && (
              <div className="mb-5 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)]
                                 text-xs text-ink-muted font-mono">
                  {result.providerUsed}
                </span>
                {result.isDemo && (
                  <span className="px-2.5 py-1 rounded-xl bg-gold/10 border border-gold/20
                                   text-xs text-gold/80">
                    デモ
                  </span>
                )}
              </div>
            )}
            <ImageResult
              variants={result.variants}
              hasWatermark={result.hasWatermark}
              onRegenerate={!result.hasWatermark ? handleGenerate : undefined}
            />
          </motion.div>
        )}
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
