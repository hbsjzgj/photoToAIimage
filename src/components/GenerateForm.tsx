'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StyleSelector from './StyleSelector';
import { ShareButtons } from './ShareButtons';
import BeforeAfterSlider from './BeforeAfterSlider';
import CropDragger from './CropDragger';
import { analytics } from '@/lib/analytics';
import { getPromptForStyle } from '@/lib/prompts';
import type { StyleId, GenerationMode } from '@/types';
import { ALL_STYLES, FREE_STYLES } from '@/types';
import { USE_CASES, QUICK_REFINEMENTS } from '@/lib/styleMeta';

interface CreditsState { credits: number; freeRemaining: number }

type CropAspect = '1:1' | '3:4' | '4:5' | '9:16' | 'original';

const PROVIDER_DISPLAY: Record<string, { label: string; gradient: string }> = {
  gemini:      { label: 'Google Gemini 2.5 Flash Image', gradient: 'linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)' },
  fal:         { label: 'FLUX.1 Dev · fal.ai',     gradient: 'linear-gradient(90deg,#9B5DE5,#F15BB5)' },
  replicate:   { label: 'PhotoMaker · Replicate',  gradient: 'linear-gradient(90deg,#FF6B6B,#FFE66D)' },
  huggingface: { label: 'InstructPix2Pix · HF',    gradient: 'linear-gradient(90deg,#FF9D00,#FFD166)' },
};

const OUTPUT_SIZES: { id: string; w: number; h: number; ratio: CropAspect; label: string; platform: string }[] = [
  { id: '1024x1024',  w: 1024, h: 1024, ratio: '1:1',  label: '1024 × 1024', platform: 'Standard'                  },
  { id: '1080x1080',  w: 1080, h: 1080, ratio: '1:1',  label: '1080 × 1080', platform: 'Instagram · 小红书 · X · LINE' },
  { id: '1080x1350',  w: 1080, h: 1350, ratio: '4:5',  label: '1080 × 1350', platform: 'Instagram'                 },
  { id: '1080x1440',  w: 1080, h: 1440, ratio: '3:4',  label: '1080 × 1440', platform: '小红书'                    },
  { id: '1080x1920',  w: 1080, h: 1920, ratio: '9:16', label: '1080 × 1920', platform: 'TikTok · Story · LINE'     },
  { id: '1536x1536',  w: 1536, h: 1536, ratio: '1:1',  label: '1536 × 1536', platform: 'HD'                        },
  { id: '2048x2048',  w: 2048, h: 2048, ratio: '1:1',  label: '2048 × 2048', platform: '2K'                        },
  { id: '4096x4096',  w: 4096, h: 4096, ratio: '1:1',  label: '4096 × 4096', platform: '4K'                        },
];

type ResultData = {
  projectId: string | null;
  variants: { id: string; imageUrl: string }[];
  creditsUsed: number;
  hasWatermark: boolean;
  providerUsed?: string;
  isDemo?: boolean;
};


export default function GenerateForm({ initialStyle }: { initialStyle?: string }) {
  const t = useTranslations('generate');
  const tWork = useTranslations('work');
  const tPresets = useTranslations('presets');
  const tQuality = useTranslations('quality');
  const tStrength = useTranslations('strength');
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [imageBase64, setImageBase64] = useState('');
  const [preview, setPreview] = useState('');
  const DEFAULT_STYLE: StyleId = 'anime_basic';
  const [style, setStyle] = useState<StyleId | ''>(
    initialStyle
      ? (ALL_STYLES.includes(initialStyle as StyleId) ? (initialStyle as StyleId) : DEFAULT_STYLE)
      : ''
  );
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('free');
  const [count, setCount] = useState<1 | 4>(1);
  const [outputSize, setOutputSize] = useState('1024x1024');
  const [styleStrength, setStyleStrength] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [creditsState, setCreditsState] = useState<CreditsState>({ credits: 0, freeRemaining: 3 });
  const [dragging, setDragging] = useState(false);
  const [loadingSecs, setLoadingSecs] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const [originalImageBase64, setOriginalImageBase64] = useState('');
  const [naturalW, setNaturalW] = useState(1);
  const [naturalH, setNaturalH] = useState(1);
  const [cropAspect, setCropAspect] = useState<CropAspect>('1:1');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showFeedbackReasons, setShowFeedbackReasons] = useState(false);
  const [feedbackTimer, setFeedbackTimer] = useState(false);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; styleId: string; outputSize: string; count: number }>>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetSaved, setPresetSaved] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Loading timer + stage labels ── */
  const loadingStages = locale === 'zh'
    ? ['上传照片中…', '分析风格中…', '正在渲染…', '即将完成…']
    : locale === 'ja'
    ? ['アップロード中…', 'スタイル解析中…', 'レンダリング中…', 'もうすぐ完成…']
    : ['Uploading…', 'Analyzing style…', 'Rendering…', 'Almost done…'];

  useEffect(() => {
    if (!loading) { setLoadingSecs(0); setLoadingStage(0); return; }
    const timer = setInterval(() => {
      setLoadingSecs((s) => s + 1);
      setLoadingStage((s) => Math.min(s + 1, loadingStages.length - 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!result) {
      setFeedbackTimer(false);
      setFeedbackSent(false);
      setShowFeedbackReasons(false);
      return;
    }
    const timer = setTimeout(() => setFeedbackTimer(true), 5000);
    return () => clearTimeout(timer);
  }, [result]);

  function handleStyleSelect(s: StyleId | '') {
    setStyle(s);
    if (s) {
      analytics.styleSelected(s);
      // Auto-switch to paid mode when logged-in user picks a PRO style
      if (session?.user && !FREE_STYLES.includes(s)) {
        setMode('paid');
      }
    }
  }

  function handleCropChange(ratio: CropAspect) {
    setCropAspect(ratio);
  }

  function handleSizeSelect(sizeId: string) {
    setOutputSize(sizeId);
    const sz = OUTPUT_SIZES.find((s) => s.id === sizeId);
    if (sz) setCropAspect(sz.ratio);
  }

  async function download() {
    const url = result?.variants[selectedVariantIdx]?.imageUrl;
    if (!url || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `forma_avatar_${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally { setDownloading(false); }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: 'FORMA AI Avatar', url: window.location.href }).catch(() => {});
    } else { copyLink(); }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function appendRefinement(chip: string) {
    setCustomPrompt((prev) => {
      const txt = prev.trim();
      if (!txt) return chip;
      if (txt.includes(chip)) return prev;
      return `${txt}，${chip}`;
    });
  }

  useEffect(() => {
    fetch('/api/usage').then((r) => r.json()).then((d) => {
      setCreditsState((s) => ({ ...s, freeRemaining: d.remaining ?? 3 }));
    });
  }, [result]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/credits').then((r) => r.json()).then(setCreditsState);
  }, [session, result]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/presets')
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []));
  }, [session?.user]);

  const didAutoSwitch = useRef(false);
  useEffect(() => {
    if (didAutoSwitch.current) return;
    if (session?.user && creditsState.credits > 0) {
      setMode('paid');
      didAutoSwitch.current = true;
    }
  }, [creditsState, session]);

  const handleFile = useCallback((file: File) => {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED.includes(file.type)) {
      setPreview(''); setImageBase64(''); setOriginalImageBase64(''); setCropAspect('1:1'); setResult(null);
      setError(t('errors.invalidFileType')); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPreview(''); setImageBase64(''); setOriginalImageBase64(''); setCropAspect('1:1'); setResult(null);
      setError(t('errors.fileTooLarge')); return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.onload = async () => {
      const { naturalWidth: w0, naturalHeight: h0 } = img;
      if (w0 < 256 || h0 < 256) {
        setPreview(''); setImageBase64(''); setOriginalImageBase64(''); setCropAspect('1:1'); setResult(null);
        setError(t('errors.imageTooSmall')); URL.revokeObjectURL(objectUrl); return;
      }
      if (w0 > 4096 || h0 > 4096) {
        setPreview(''); setImageBase64(''); setOriginalImageBase64(''); setCropAspect('1:1'); setResult(null);
        setError(t('errors.imageTooLarge')); URL.revokeObjectURL(objectUrl); return;
      }
      const MAX = 768;
      const scale = Math.min(1, MAX / Math.max(w0, h0));
      const w = Math.round(w0 * scale); const h = Math.round(h0 * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const b64 = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      analytics.uploadStarted();
      setNaturalW(w); setNaturalH(h);
      setOriginalImageBase64(b64); setCropAspect(w > h ? 'original' : '1:1');
      setImageBase64(b64); setPreview(b64); setResult(null); setError('');
    };
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
  }, [t]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleGenerate() {
    if (!imageBase64) { setError(t('errors.noImage')); return; }
    if (!style) { setError(t('errors.noStyle')); return; }
    if (mode === 'paid' && !session?.user) { router.push(`/${locale}/auth`); return; }

    setLoading(true); setError(''); setErrorCode(''); setResult(null); setIsPublic(false);
    const startMs = Date.now();
    analytics.generationStarted({ style: style as string, mode, count });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, style, mode, count, outputSize, customPrompt: customPrompt.trim() || undefined, styleStrength }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        analytics.generationFailed({ style: style as string, mode, error: data.error ?? 'unknown', count });
        setErrorCode(data.error ?? '');
        setError(t(`errors.${data.error}`) || data.error);
        return;
      }
      analytics.generationSuccess({ style: style as string, provider: data.providerUsed ?? 'unknown', durationMs: Date.now() - startMs, mode, count });
      setSelectedVariantIdx(0);
      setResult(data);
      window.dispatchEvent(new CustomEvent('credits:refresh'));
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        analytics.generationFailed({ style: style as string, mode, error: 'timeout', count });
        setError(t('errors.timeout'));
      } else {
        analytics.generationFailed({ style: style as string, mode, error: 'clientError', count });
        setError(t('errors.generationFailed'));
      }
    } finally { setLoading(false); }
  }

  /* ── Locale helpers ── */
  const lz = (zh: string, en: string, ja: string) =>
    locale === 'zh' ? zh : locale === 'ja' ? ja : en;

  /* ── Cost calculation ── */
  const costCredits = mode === 'paid' ? count : 0;

  const insufficientCredits = mode === 'paid' && !!session?.user && creditsState.credits < costCredits;
  const canGenerate = !loading && !!imageBase64 && !!style && !insufficientCredits;
  const showResult = !!(result && imageBase64);
  const imageAspectRatio = useMemo(() => {
    if (cropAspect === 'original') return naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 1;
    if (cropAspect === '1:1') return 1;
    if (cropAspect === '3:4') return 3 / 4;
    if (cropAspect === '4:5') return 4 / 5;
    if (cropAspect === '9:16') return 9 / 16;
    return 1;
  }, [cropAspect, naturalW, naturalH]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-4 lg:gap-0
                    lg:divide-x lg:divide-[rgba(255,255,255,0.06)]
                    rounded-3xl border border-[rgba(255,255,255,0.07)]
                    bg-[rgba(255,255,255,0.02)] overflow-hidden">

      {/* ══════════════════════════════════════════
          LEFT PANEL — Upload + Use Case + Mode
      ══════════════════════════════════════════ */}
      <div className="p-5 space-y-5 lg:sticky lg:top-20 lg:self-start
                      lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">

        {/* Upload area */}
        <div>
          <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase mb-2.5">
            {lz('上传照片', 'Upload Photo', '写真をアップ')}
          </p>
          <AnimatePresence mode="wait">
            {originalImageBase64 ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <CropDragger
                  src={originalImageBase64}
                  imageW={naturalW}
                  imageH={naturalH}
                  aspect={cropAspect}
                  onChange={(cropped) => { setImageBase64(cropped); setPreview(cropped); }}
                  onChangeSrc={() => inputRef.current?.click()}
                  changeLabel={t('upload.change')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className={`relative rounded-2xl overflow-hidden border transition-all duration-300
                            cursor-pointer
                            ${dragging ? 'border-gold/50 bg-gold/5' : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.04)]'}`}
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <motion.div
                    className="w-12 h-12 rounded-xl border border-[rgba(255,255,255,0.10)]
                               bg-[rgba(255,255,255,0.04)] flex items-center justify-center"
                    animate={dragging ? { scale: 1.1, borderColor: 'rgba(200,169,107,0.5)' } : {}}
                  >
                    <svg className="w-5 h-5 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </motion.div>
                  <div className="text-center">
                    <p className="text-ink-secondary text-xs">{t('upload.drag')}</p>
                    <p className="text-ink-muted text-[10px] mt-0.5">{t('upload.hint')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {/* Crop ratio */}
        <AnimatePresence>
          {originalImageBase64 && !result && (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {(['1:1', '4:5', '9:16', 'original'] as const).map((ratio) => (
                <motion.button
                  key={ratio}
                  onClick={() => handleCropChange(ratio)}
                  whileTap={{ scale: 0.94 }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all
                    ${cropAspect === ratio
                      ? 'bg-gold/15 text-gold border border-gold/40'
                      : 'bg-[rgba(255,255,255,0.04)] text-ink-muted border border-[rgba(255,255,255,0.07)] hover:text-ink'
                    }`}
                >
                  {ratio === 'original' ? t('crop.original') : ratio}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Use case quick-select */}
        <div>
          <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase mb-2.5">
            {lz('用途', 'Use Case', '用途')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {USE_CASES.map((uc) => {
              const label = locale === 'zh' ? uc.zh : locale === 'ja' ? uc.ja : uc.en;
              const active = style === uc.styleId;
              return (
                <motion.button
                  key={uc.id}
                  onClick={() => handleStyleSelect(uc.styleId)}
                  whileTap={{ scale: 0.94 }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-medium text-center transition-all duration-200
                    ${active
                      ? 'bg-gold/15 text-gold border border-gold/40'
                      : 'bg-[rgba(255,255,255,0.04)] text-ink-muted border border-[rgba(255,255,255,0.06)] hover:text-ink hover:bg-[rgba(255,255,255,0.08)]'
                    }`}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Free/Paid mode tabs (logged-in only) */}
        {session?.user && (
          <div>
            <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase mb-2.5">
              {lz('生成模式', 'Mode', 'モード')}
            </p>
            <div className="flex rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-0.5">
              {(['free', 'paid'] as GenerationMode[]).map((m) => (
                <motion.button
                  key={m}
                  onClick={() => { setMode(m); handleStyleSelect(''); }}
                  className={`relative flex-1 py-2 rounded-lg text-xs font-medium transition-colors duration-300
                              ${mode === m ? 'text-ink' : 'text-ink-muted hover:text-ink-secondary'}`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="mode-tab"
                      className="absolute inset-0 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.10)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    {m === 'free'
                      ? `${lz('免费', 'Free', '無料')} (${creditsState.freeRemaining})`
                      : `${lz('积分', 'Credits', '有料')} (${creditsState.credits})`}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Count (paid mode only) */}
        <AnimatePresence>
          {session?.user && mode === 'paid' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
            >
              <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase mb-2.5">
                {lz('生成数量', 'Count', '枚数')}
              </p>
              <div className="flex gap-2">
                {([1, 4] as (1 | 4)[]).map((n) => (
                  <motion.button
                    key={n}
                    onClick={() => setCount(n)}
                    whileTap={{ scale: 0.94 }}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all
                      ${count === n
                        ? 'bg-gold/15 text-gold border border-gold/40'
                        : 'bg-[rgba(255,255,255,0.04)] text-ink-muted border border-[rgba(255,255,255,0.07)] hover:text-ink'
                      }`}
                  >
                    {n === 1 ? lz('1 张', '1 image', '1枚') : lz('4 张', '4 images', '4枚')}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ══════════════════════════════════════════
          CENTER PANEL — Style Selector / Result
      ══════════════════════════════════════════ */}
      <div className="relative p-5 min-h-[400px]">
        {/* Loading shimmer overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4
                         bg-surface/70 backdrop-blur-sm rounded-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative w-14 h-14">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-gold/20 border-t-gold"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border border-gold/10 border-b-gold/40"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-ink font-medium">{loadingStages[loadingStage]}</p>
                {loadingSecs > 0 && (
                  <p className="text-xs text-ink-muted mt-1 tabular-nums">{loadingSecs}s</p>
                )}
              </div>
              {/* Shimmer cards hint */}
              <div className="grid grid-cols-3 gap-2 w-48 opacity-30">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-lg skeleton" />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showResult ? (
            /* ── Result view ── */
            <motion.div
              key="result"
              className="space-y-4"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Before/After slider */}
              <div className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
                <BeforeAfterSlider
                  beforeSrc={imageBase64}
                  afterSrc={result!.variants[selectedVariantIdx]?.imageUrl ?? ''}
                  aspectRatio={imageAspectRatio}
                />
              </div>

              {/* Variant thumbnails */}
              {result!.variants.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {result!.variants.map((v, i) => (
                    <motion.button
                      key={v.id}
                      onClick={() => setSelectedVariantIdx(i)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                                  ${selectedVariantIdx === i
                                    ? 'border-gold shadow-[0_0_0_1px_rgba(200,169,107,0.4)]'
                                    : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.20)]'
                                  }`}
                    >
                      <img src={v.imageUrl} alt={`${i + 1}`} className="w-full h-full object-cover" />
                      {selectedVariantIdx === i && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-surface" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/60 text-[8px] text-white">
                        {i + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Result action row */}
              <div className="flex gap-2">
                <motion.button
                  onClick={download} disabled={downloading}
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2
                             bg-gold text-surface font-medium text-sm
                             shadow-[0_4px_20px_rgba(200,169,107,0.3)]
                             hover:bg-gold-light transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {downloading ? '…' : result?.hasWatermark ? t('result.download') : t('result.downloadHD')}
                </motion.button>

                <motion.button onClick={share} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center
                             bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.10)]
                             text-ink-secondary hover:text-ink hover:bg-[rgba(255,255,255,0.11)] transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                </motion.button>

                <motion.button onClick={copyLink} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center
                             bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.10)]
                             transition-all hover:bg-[rgba(255,255,255,0.11)]"
                  style={{ color: copied ? 'var(--color-gold)' : undefined }}>
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.svg key="check" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </motion.svg>
                    ) : (
                      <motion.svg key="link" className="w-4 h-4 text-ink-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {/* Public toggle + share */}
              {result?.variants[selectedVariantIdx]?.id && session?.user && (
                <div className="mt-4 border-t border-[rgba(255,255,255,0.07)] pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ink-secondary">{isPublic ? tWork('makePrivate') : tWork('makePublic')}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{tWork('publicHint')}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const variantId = result.variants[selectedVariantIdx].id;
                        if (!variantId || togglingPublic) return;
                        setTogglingPublic(true);
                        try {
                          const res = await fetch(`/api/works/${variantId}/public`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isPublic: !isPublic }),
                          });
                          if (res.ok) setIsPublic(!isPublic);
                        } finally {
                          setTogglingPublic(false);
                        }
                      }}
                      disabled={togglingPublic}
                      className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-[var(--color-gold)]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {isPublic && (
                    <div>
                      <p className="text-xs text-ink-muted mb-2">{tWork('share')}</p>
                      <ShareButtons
                        workId={result.variants[selectedVariantIdx].id}
                        styleName={style ?? ''}
                        compact
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Save as Preset */}
              {session?.user && result && (
                <div className="mt-3">
                  {!showSavePreset ? (
                    <button
                      onClick={() => setShowSavePreset(true)}
                      className="btn-ghost text-xs py-1.5 px-3 w-full"
                    >
                      {tPresets('saveAs')}
                    </button>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <input
                        className="input-field text-sm py-1.5 flex-1 min-w-0"
                        placeholder={tPresets('namePlaceholder')}
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        maxLength={50}
                      />
                      <button
                        disabled={savingPreset || !presetName.trim()}
                        onClick={async () => {
                          setSavingPreset(true);
                          try {
                            const r = await fetch('/api/presets', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: presetName.trim(), styleId: style, outputSize, count }),
                            });
                            if (r.ok) {
                              const { preset } = await r.json();
                              setPresets((prev) => [preset, ...prev]);
                              setPresetSaved(true);
                              setShowSavePreset(false);
                              setPresetName('');
                              setTimeout(() => setPresetSaved(false), 2000);
                            }
                          } finally {
                            setSavingPreset(false);
                          }
                        }}
                        className="btn-gold text-xs py-1.5 px-3 shrink-0"
                      >
                        {savingPreset ? '…' : tPresets('saveButton')}
                      </button>
                    </div>
                  )}
                  {presetSaved && <p className="text-xs text-center text-green-400 mt-1">{tPresets('saved')}</p>}
                </div>
              )}

              {/* AI engine attribution */}
              {result?.providerUsed && result.providerUsed !== 'mock' && (
                <motion.div
                  className="flex items-center justify-center gap-1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 12 12" fill="none" style={{ color: '#4285F4' }}>
                    <path d="M6 1l1.2 3.6H11L8.1 6.8l1.1 3.6L6 8.4l-3.2 2 1.1-3.6L1 4.6h3.8z" fill="currentColor" />
                  </svg>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {lz('由', 'Generated by', '生成：')}
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      background: PROVIDER_DISPLAY[result.providerUsed]?.gradient ?? 'linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                      display: 'inline-block',
                    }}
                  >
                    {PROVIDER_DISPLAY[result.providerUsed]?.label ?? result.providerUsed}
                  </span>
                </motion.div>
              )}

              {/* Upgrade nudge */}
              {result?.hasWatermark && (
                <motion.div
                  className="glass-card p-4 flex items-center justify-between gap-3"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{t('upgradeNudge.title')}</p>
                      <p className="text-xs text-ink-muted">{t('upgradeNudge.desc')}</p>
                    </div>
                  </div>
                  <Link href={`/${locale}/pricing`} className="btn-gold text-xs px-3 py-1.5 whitespace-nowrap">
                    {t('upgradeNudge.cta')}
                  </Link>
                </motion.div>
              )}

              {/* Quality feedback — appears 5 seconds after generation */}
              {feedbackTimer && !feedbackSent && result?.variants?.[selectedVariantIdx]?.id && (
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] text-center">
                  <p className="text-xs text-ink-muted mb-2">{tQuality('feedbackPrompt')}</p>
                  {!showFeedbackReasons ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={async () => {
                          await fetch('/api/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              variantId: result.variants[selectedVariantIdx].id,
                              positive: true,
                            }),
                          });
                          setFeedbackSent(true);
                        }}
                        className="btn-ghost text-sm px-4 py-2"
                      >
                        👍 {tQuality('good')}
                      </button>
                      <button
                        onClick={() => setShowFeedbackReasons(true)}
                        className="btn-ghost text-sm px-4 py-2"
                      >
                        👎 {tQuality('bad')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {(['tooMuchChange', 'tooSubtle', 'lowQuality', 'other'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={async () => {
                            await fetch('/api/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                variantId: result.variants[selectedVariantIdx].id,
                                positive: false,
                                reason: r,
                              }),
                            });
                            setFeedbackSent(true);
                          }}
                          className="btn-ghost text-sm w-full py-1.5"
                        >
                          {tQuality(`reasons.${r}` as Parameters<typeof tQuality>[0])}
                        </button>
                      ))}
                    </div>
                  )}
                  {feedbackSent && (
                    <p className="text-xs text-green-400 mt-2">{tQuality('thanks')}</p>
                  )}
                </div>
              )}

              {/* "Generate again" shortcut */}
              <motion.button
                onClick={() => { setResult(null); }}
                className="w-full py-2.5 rounded-xl text-xs text-ink-muted border border-[rgba(255,255,255,0.07)]
                           hover:text-ink hover:border-[rgba(255,255,255,0.15)] transition-all duration-200"
              >
                {lz('← 重新选择风格', '← Change style', '← スタイルを変更')}
              </motion.button>
            </motion.div>
          ) : (
            /* ── Style selector view ── */
            <motion.div
              key="styles"
              className="space-y-4"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase">
                {t('styleLabel')}
              </p>

              {/* Empty-state guide when no image */}
              {!preview && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-gold/5 border border-gold/15 flex items-start gap-3">
                  <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5A6.5 6.5 0 108 14.5 6.5 6.5 0 008 1.5zM8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {lz(
                      '先上传照片（左侧），再选择风格，点击生成。',
                      'Upload a photo on the left, pick a style below, then generate.',
                      '左側に写真をアップし、スタイルを選んで生成してください。',
                    )}
                  </p>
                </div>
              )}

              {session?.user && presets.length > 0 && (
                <div className="px-0 pt-0 pb-2">
                  <label className="block text-xs text-ink-muted mb-1.5">{tPresets('loadPreset')}</label>
                  <select
                    className="w-full input-field text-sm py-1.5"
                    defaultValue=""
                    onChange={(e) => {
                      const p = presets.find((x) => x.id === e.target.value);
                      if (!p) return;
                      setStyle(p.styleId as StyleId);
                      setOutputSize(p.outputSize);
                      setCount(p.count as 1 | 4);
                    }}
                  >
                    <option value="" disabled>{tPresets('noPresets')}</option>
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <StyleSelector
                selected={style}
                onSelect={handleStyleSelect}
                mode={session?.user ? 'paid' : 'free'}
                gridClassName="grid grid-cols-3 sm:grid-cols-4 gap-3"
              />

              {/* Style strength slider */}
              {style && (
                <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-ink-muted">{tStrength('label')}</label>
                    <span className="text-xs text-ink-muted">
                      {styleStrength <= 3
                        ? tStrength('weak')
                        : styleStrength >= 8
                        ? tStrength('strong')
                        : tStrength('medium')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={styleStrength}
                    onChange={(e) => setStyleStrength(Number(e.target.value))}
                    className="w-full accent-[var(--color-gold)]"
                  />
                  <div className="flex justify-between text-[10px] text-ink-muted mt-0.5">
                    <span>{tStrength('weak')}</span>
                    <span>{tStrength('strong')}</span>
                  </div>
                </div>
              )}

              {/* Selected style description */}
              <AnimatePresence>
                {style && (
                  <motion.div
                    key={style}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)]
                               border border-[rgba(255,255,255,0.07)]"
                  >
                    <p className="text-[10px] text-gold font-medium tracking-wider uppercase mb-1">
                      {t('stylePromptLabel')}
                    </p>
                    <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-3">
                      {(t as (k: string) => string)(`stylePrompts.${style}`)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Refinement + Cost + Generate
      ══════════════════════════════════════════ */}
      <div className="p-5 space-y-5 lg:sticky lg:top-20 lg:self-start
                      lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">

        {/* Natural language refinement */}
        <div>
          <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase mb-2.5">
            {lz('精修指令', 'Refinement', '調整指示')}
            <span className="ml-1.5 text-ink-muted/50 normal-case tracking-normal font-normal">
              {lz('(选填)', '(optional)', '(任意)')}
            </span>
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value.slice(0, 200))}
            placeholder={lz(
              '告诉 AI 你想怎么改，例如：背景换成高级灰，发型更自然，眼神更温柔…',
              'Tell AI how to refine, e.g. sophisticated gray background, natural hair…',
              'AIへの調整指示、例：背景をグレーに、髪をナチュラルに…',
            )}
            rows={3}
            maxLength={200}
            className="w-full input-field text-sm resize-none leading-relaxed"
          />
          <p className={`text-right text-[10px] mt-1 tabular-nums transition-colors
                         ${customPrompt.length >= 190 ? 'text-gold/70' : 'text-ink-muted/40'}`}>
            {customPrompt.length}/200
          </p>

          {/* Quick refinement chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_REFINEMENTS.map((chip) => {
              const label = locale === 'zh' ? chip.zh : locale === 'ja' ? chip.ja : chip.en;
              return (
                <motion.button
                  key={chip.zh}
                  onClick={() => appendRefinement(label)}
                  whileTap={{ scale: 0.93 }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium
                             bg-[rgba(255,255,255,0.04)] text-ink-muted
                             border border-[rgba(255,255,255,0.08)]
                             hover:text-ink hover:border-[rgba(255,255,255,0.18)]
                             transition-all duration-150"
                >
                  + {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Output size (paid) */}
        <AnimatePresence>
          {session?.user && mode === 'paid' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
            >
              <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase mb-2.5">
                {t('sizeLabel')}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {OUTPUT_SIZES.map((sz) => {
                  const active = outputSize === sz.id;
                  return (
                    <motion.button
                      key={sz.id}
                      onClick={() => handleSizeSelect(sz.id)}
                      whileTap={{ scale: 0.97 }}
                      className={`p-2 rounded-xl text-left transition-all duration-200
                        ${active
                          ? 'bg-gold/15 border border-gold/40'
                          : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.07)]'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`font-mono text-[9px] font-semibold leading-none ${active ? 'text-gold' : 'text-ink-secondary'}`}>
                          {sz.label}
                        </span>
                        <span className={`text-[8px] px-1 py-0.5 rounded flex-shrink-0
                          ${active ? 'bg-gold/20 text-gold' : 'bg-[rgba(255,255,255,0.08)] text-ink-muted'}`}>
                          {sz.ratio}
                        </span>
                      </div>
                      <p className={`text-[9px] truncate leading-none ${active ? 'text-gold/70' : 'text-ink-muted/60'}`}>
                        {sz.platform}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cost breakdown */}
        <div className="rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] p-4 space-y-3">
          <p className="text-[10px] text-ink-muted font-medium tracking-widest uppercase">
            {lz('本次预计消耗', 'Estimated Cost', '消費予定')}
          </p>

          {mode === 'free' || !session?.user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{lz('生成模式', 'Mode', 'モード')}</span>
                <span className="text-emerald-400 font-medium">
                  {lz('免费额度', 'Free quota', '無料枠')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{lz('今日剩余', 'Remaining today', '本日残り')}</span>
                <span className={`font-medium tabular-nums ${creditsState.freeRemaining === 0 ? 'text-red-400' : 'text-ink'}`}>
                  {creditsState.freeRemaining} / 3
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{lz('生成', 'Generation', '生成')} ({count}{lz('张', '', '枚')})</span>
                <span className="font-medium text-gold tabular-nums">{costCredits} cr</span>
              </div>
              <div className="w-full h-px bg-[rgba(255,255,255,0.06)]" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{lz('当前余额', 'Your balance', '残高')}</span>
                <span className={`font-medium tabular-nums ${creditsState.credits < costCredits ? 'text-red-400' : 'text-ink'}`}>
                  {creditsState.credits} cr
                </span>
              </div>
              {creditsState.credits < costCredits && (
                <Link href={`/${locale}/pricing`}
                  className="block w-full py-2 rounded-xl text-center text-xs font-medium
                             bg-gold/10 text-gold border border-gold/20 hover:bg-gold/15 transition-colors">
                  {t('paid.buyCredits')} →
                </Link>
              )}
            </div>
          )}

          <div className="w-full h-px bg-[rgba(255,255,255,0.06)]" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-secondary">{lz('AI 引擎', 'AI Engine', 'AIエンジン')}</span>
            <span
              className="text-[10px] font-semibold"
              style={{
                background: result?.providerUsed
                  ? (PROVIDER_DISPLAY[result.providerUsed]?.gradient ?? 'linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)')
                  : 'linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                display: 'inline-block',
              }}
            >
              {result?.providerUsed
                ? (PROVIDER_DISPLAY[result.providerUsed]?.label ?? result.providerUsed)
                : 'Google Gemini 2.5 Flash Image'}
            </span>
          </div>

          <p className="text-[10px] text-ink-muted/60 flex items-center gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
              <path d="M6 5v4M6 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {lz('生成失败不扣除积分', 'No charge on failure', '失敗時は課金なし')}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <div className="px-4 py-3 text-red-400 text-sm flex items-center justify-between gap-3">
                <span>{error}</span>
                {errorCode === 'insufficientCredits' && (
                  <Link href={`/${locale}/pricing`} className="text-gold text-xs font-medium whitespace-nowrap">
                    {t('paid.buyCredits')} →
                  </Link>
                )}
              </div>
              <div className="px-4 py-2 bg-[rgba(255,255,255,0.03)] border-t border-red-500/10
                             text-[10px] text-ink-muted/70 flex items-center gap-1.5">
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                  <path d="M6 5v4M6 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {lz('本次生成失败，未扣除任何积分', 'Generation failed — no credits charged', '生成失敗 — クレジット未消費')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate button */}
        {insufficientCredits ? (
          <Link
            href={`/${locale}/pricing`}
            className="block w-full py-4 rounded-2xl font-medium text-sm text-center
                       bg-gold/10 text-gold border border-gold/25
                       hover:bg-gold/15 transition-all duration-200"
          >
            {lz('积分不足，去购买 →', 'Buy credits →', 'クレジット不足 — 購入する →')}
          </Link>
        ) : (
          <motion.button
            onClick={handleGenerate}
            disabled={!canGenerate}
            whileHover={canGenerate ? { scale: 1.01, y: -1 } : {}}
            whileTap={canGenerate ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-2xl font-medium text-sm transition-all duration-400
                        ${canGenerate
                          ? 'bg-gold text-surface shadow-gold hover:bg-gold-light cursor-pointer'
                          : 'bg-[rgba(255,255,255,0.05)] text-ink-muted cursor-not-allowed'
                        }`}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.span
                  key="loading"
                  className="flex flex-col items-center gap-1"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <span className="flex items-center gap-2.5">
                    <motion.div
                      className="w-3.5 h-3.5 rounded-full border-2 border-surface/40 border-t-surface"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    {loadingStages[loadingStage]}
                  </span>
                  {loadingSecs > 0 && (
                    <span className="text-[10px] text-surface/50 font-normal tabular-nums">
                      {loadingSecs}s
                    </span>
                  )}
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {mode === 'paid' && session?.user
                    ? lz(
                        `生成 ${count} 张头像 · 消耗 ${costCredits} 积分`,
                        `Generate ${count} image${count > 1 ? 's' : ''} · ${costCredits} cr`,
                        `${count}枚生成 · ${costCredits}クレジット`,
                      )
                    : t('generateBtn')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Credits buy shortcut (free mode, 0 remaining) */}
        <AnimatePresence>
          {creditsState.freeRemaining === 0 && (mode === 'free' || !session?.user) && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <p className="text-xs text-ink-muted mb-2">
                {lz('今日免费次数已用完', 'Daily free limit reached', '本日の無料枠を使い切りました')}
              </p>
              <Link href={`/${locale}/pricing`}
                className="text-xs text-gold hover:text-gold-light transition-colors font-medium">
                {t('free.upgradePrompt')} →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
