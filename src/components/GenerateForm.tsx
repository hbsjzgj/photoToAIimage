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

export default function GenerateForm() {
  const t = useTranslations('generate');
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [imageBase64, setImageBase64] = useState('');
  const [preview, setPreview] = useState('');
  const [style, setStyle] = useState<StyleId | ''>('');
  const [mode, setMode] = useState<GenerationMode>('free');
  const [count, setCount] = useState<1 | 4>(1);
  const [outputSize, setOutputSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [creditsState, setCreditsState] = useState<CreditsState>({ credits: 0, freeRemaining: 3 });
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setImageBase64(b64);
      setPreview(b64);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  }, []);

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
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, style, mode, count, outputSize }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) { setError(t(`errors.${data.error}`) || data.error); return; }
      setResult(data);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError(t('errors.timeout'));
      } else {
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
        onClick={() => inputRef.current?.click()}
        whileHover={!preview ? { scale: 1.005 } : {}}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              className="relative w-full aspect-[4/3]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image src={preview} alt="Preview" fill className="object-cover" />
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

      {/* ── Mode Tabs (logged-in only) ── */}
      {session?.user && (
        <div className="flex rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-1">
          {(['free', 'paid'] as GenerationMode[]).map((m) => (
            <motion.button
              key={m}
              onClick={() => { setMode(m); setStyle(''); }}
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
        <StyleSelector selected={style} onSelect={setStyle} mode={session?.user ? mode : 'free'} />
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
              className="flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-surface/40 border-t-surface"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              {t('generating')}
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
    </div>
  );
}
