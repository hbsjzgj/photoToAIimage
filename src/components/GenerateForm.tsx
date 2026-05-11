'use client';
import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import StyleSelector from './StyleSelector';
import ImageResult from './ImageResult';
import type { StyleId, GenerationMode } from '@/types';

interface CreditsState { credits: number; freeRemaining: number }

export default function GenerateForm() {
  const t = useTranslations('generate');
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [imageBase64, setImageBase64] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [style, setStyle] = useState<StyleId | ''>('');
  const [mode, setMode] = useState<GenerationMode>('free');
  const [count, setCount] = useState<1 | 4>(1);
  const [outputSize, setOutputSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ projectId: string; variants: { id: string; imageUrl: string }[]; creditsUsed: number; hasWatermark: boolean } | null>(null);
  const [creditsState, setCreditsState] = useState<CreditsState>({ credits: 0, freeRemaining: 3 });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/credits').then(r => r.json()).then(setCreditsState);
  }, [session, result]);

  function handleFile(file: File) {
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
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleGenerate() {
    if (!session?.user) { router.push(`/${locale}/auth`); return; }
    if (!imageBase64) { setError(t('errors.noImage')); return; }
    if (!style) { setError(t('errors.noStyle')); return; }
    if (mode === 'free' && creditsState.freeRemaining <= 0) { setError(t('free.limitReached')); return; }
    if (mode === 'paid' && creditsState.credits < count) { setError(t('paid.insufficientCredits')); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, style, mode, count, outputSize })
      });
      const data = await res.json();
      if (!res.ok) { setError(t(`errors.${data.error}`) || data.error); return; }
      setResult(data);
    } catch {
      setError(t('errors.generationFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload area */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-3">{t('upload.label')}</label>
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer
                     hover:border-brand-400 hover:bg-brand-50 transition-all group"
        >
          {preview ? (
            <div className="relative w-48 h-48 mx-auto">
              <Image src={preview} alt="Preview" fill className="object-cover rounded-xl" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-5xl">📷</div>
              <p className="text-gray-600 group-hover:text-brand-600">{t('upload.drag')}</p>
              <p className="text-xs text-gray-400">{t('upload.hint')}</p>
            </div>
          )}
        </div>
        {preview && (
          <button onClick={() => inputRef.current?.click()} className="mt-2 text-sm text-brand-600 hover:underline">
            {t('upload.change')}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* Mode selector */}
      {session?.user && (
        <div className="card space-y-4">
          <label className="block text-sm font-semibold text-gray-700">{t('modeLabel')}</label>
          <div className="grid grid-cols-2 gap-3">
            {(['free', 'paid'] as GenerationMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setStyle(''); }}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  mode === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <div className="font-bold">{m === 'free' ? t('freeMode') : t('paidMode')}</div>
                {m === 'free' && (
                  <div className="text-xs mt-1 text-gray-500">{t('free.remaining', { count: creditsState.freeRemaining })}</div>
                )}
                {m === 'paid' && (
                  <div className="text-xs mt-1 text-gray-500">{t('paid.credits', { count: creditsState.credits })}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style selector */}
      <div className="card space-y-4">
        <label className="block text-sm font-semibold text-gray-700">{t('styleLabel')}</label>
        <StyleSelector selected={style} onSelect={setStyle} mode={session?.user ? mode : 'free'} />
      </div>

      {/* Paid options */}
      {session?.user && mode === 'paid' && (
        <div className="card grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('countLabel')}</label>
            <div className="space-y-2">
              {([1, 4] as (1 | 4)[]).map((n) => (
                <label key={n} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="count" value={n} checked={count === n}
                    onChange={() => setCount(n)} className="accent-brand-600" />
                  <span className="text-sm">{n === 1 ? t('count1') : t('count4')}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('sizeLabel')}</label>
            <div className="space-y-2">
              {['1024x1024', '1536x1536'].map((s) => (
                <label key={s} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="size" value={s} checked={outputSize === s}
                    onChange={() => setOutputSize(s)} className="accent-brand-600" />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
          {error === t('free.limitReached') && (
            <button onClick={() => router.push(`/${locale}/pricing`)}
              className="ml-2 underline font-semibold">{t('paid.buyCredits')}</button>
          )}
        </div>
      )}

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={loading || !imageBase64 || !style}
        className="btn-primary w-full py-4 text-base">
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="animate-spin">⟳</span> {t('generating')}
          </span>
        ) : t('generateBtn')}
      </button>

      {/* Result */}
      {result && (
        <div className="card">
          <ImageResult
            variants={result.variants}
            hasWatermark={result.hasWatermark}
            onRegenerate={!result.hasWatermark ? handleGenerate : undefined}
          />
        </div>
      )}
    </div>
  );
}
