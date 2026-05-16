'use client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { StyleId } from '@/types';
import { ALL_STYLES, FREE_STYLES } from '@/types';
import { STYLE_IMAGE_URLS, STYLE_FALLBACK_URLS } from '@/lib/styleImages';

// Per-style gradient used as a fallback when the preview image hasn't loaded yet
const STYLE_GRADIENTS: Record<StyleId, string> = {
  anime_basic:      'from-rose-600/60 via-pink-700/40 to-[#0F1115]',
  soft_cartoon:     'from-amber-500/60 via-orange-600/40 to-[#0F1115]',
  cute_pet:         'from-yellow-400/60 via-orange-400/40 to-[#0F1115]',
  simple_icon:      'from-slate-400/50 via-gray-600/30 to-[#0F1115]',
  '3d_cartoon':     'from-purple-600/60 via-violet-700/40 to-[#0F1115]',
  anime_pro:        'from-violet-600/60 via-indigo-700/40 to-[#0F1115]',
  soft_storybook:   'from-emerald-500/50 via-green-600/30 to-[#0F1115]',
  cyberpunk:        'from-cyan-500/60 via-blue-600/40 to-[#0F1115]',
  comic_hero:       'from-red-600/60 via-orange-600/40 to-[#0F1115]',
  fashion_avatar:   'from-amber-400/60 via-yellow-600/40 to-[#0F1115]',
  business_profile: 'from-slate-500/50 via-gray-600/30 to-[#0F1115]',
  pet_portrait_pro: 'from-amber-700/60 via-yellow-700/40 to-[#0F1115]',
  couple_avatar:    'from-pink-600/60 via-rose-600/40 to-[#0F1115]',
  kawaii_icon:      'from-sky-400/60 via-indigo-500/40 to-[#0F1115]',
  ghibli:           'from-emerald-400/60 via-teal-500/40 to-[#0F1115]',
  oil_painting:     'from-amber-700/60 via-yellow-800/40 to-[#0F1115]',
  pixel_art:        'from-lime-500/60 via-green-600/40 to-[#0F1115]',
  pop_art:          'from-fuchsia-500/60 via-pink-600/40 to-[#0F1115]',
  pencil_sketch:    'from-stone-400/60 via-gray-500/40 to-[#0F1115]',
  van_gogh:         'from-yellow-500/60 via-orange-600/40 to-[#0F1115]',
  lego_figure:      'from-red-500/60 via-yellow-500/40 to-[#0F1115]',
  action_figure:    'from-blue-600/60 via-indigo-700/40 to-[#0F1115]',
  claymation:       'from-orange-400/60 via-amber-500/40 to-[#0F1115]',
  sumi_e:           'from-zinc-500/50 via-neutral-600/30 to-[#0F1115]',
  dark_fantasy:     'from-purple-900/60 via-violet-900/40 to-[#0F1115]',
  kpop_idol:        'from-rose-400/60 via-pink-500/40 to-[#0F1115]',
  neon_portrait:    'from-fuchsia-600/60 via-purple-700/40 to-[#0F1115]',
  vintage_film:     'from-amber-600/60 via-orange-700/40 to-[#0F1115]',
  ukiyo_e:          'from-indigo-400/60 via-blue-500/40 to-[#0F1115]',
  tarot_card:       'from-violet-700/60 via-purple-800/40 to-[#0F1115]',
  webtoon:          'from-sky-500/60 via-cyan-600/40 to-[#0F1115]',
  sticker_art:      'from-pink-400/60 via-rose-500/40 to-[#0F1115]',
  '3d_clay':        'from-orange-300/60 via-amber-400/40 to-[#0F1115]',
  impressionist:    'from-violet-400/60 via-purple-500/40 to-[#0F1115]',
};

function BatchStyleCard({
  styleId,
  isSelected,
  name,
  disabled,
  onSelect,
}: {
  styleId: StyleId;
  isSelected: boolean;
  name: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(STYLE_IMAGE_URLS[styleId]);
  const [imgError, setImgError] = useState(false);
  const isFree = FREE_STYLES.includes(styleId);

  function handleError() {
    const fallback = STYLE_FALLBACK_URLS[styleId];
    if (imgSrc !== fallback) {
      setImgLoaded(false);
      setImgSrc(fallback);
    } else {
      setImgError(true);
    }
  }

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`relative rounded-xl overflow-hidden aspect-square text-left cursor-pointer
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  ${isSelected
                    ? 'shadow-[0_0_0_2px_rgba(200,169,107,0.8),0_4px_16px_rgba(200,169,107,0.2)]'
                    : 'shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:scale-[1.03]'
                  }`}
    >
      {/* Gradient background fallback */}
      <div className={`absolute inset-0 bg-gradient-to-b ${STYLE_GRADIENTS[styleId]}
                       transition-opacity duration-500
                       ${imgLoaded && !imgError ? 'opacity-0' : 'opacity-100'}`} />

      {/* Preview image */}
      {!imgError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover object-top
                       transition-opacity duration-500
                       ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Bottom gradient + name */}
      <div className="absolute inset-x-0 bottom-0 h-3/5
                      bg-gradient-to-t from-[rgba(10,11,14,0.95)] via-[rgba(10,11,14,0.5)] to-transparent
                      pointer-events-none" />
      <p className="absolute inset-x-0 bottom-0 z-10 px-1.5 py-1.5 text-[10px] font-semibold text-white leading-tight truncate"
         style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
        {name}
      </p>

      {/* FREE badge */}
      {isFree && (
        <div className="absolute top-1 left-1 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-full
                        bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">
          FREE
        </div>
      )}

      {/* Selected gold tick */}
      {isSelected && (
        <div className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'var(--color-gold)' }}>
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}

interface QueueItem {
  id: string;
  file: File;
  preview: string;
  status: 'waiting' | 'processing' | 'done' | 'failed';
  resultUrl?: string;
}

const OUTPUT_SIZES = [
  { id: '1024x1024', label: '1024 × 1024' },
  { id: '1080x1080', label: '1080 × 1080' },
  { id: '1080x1350', label: '1080 × 1350' },
  { id: '1080x1920', label: '1080 × 1920' },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BatchQueue() {
  const t = useTranslations('batch');
  const [items, setItems] = useState<QueueItem[]>([]);
  const [style, setStyle] = useState<StyleId>('anime_basic');
  const [outputSize, setOutputSize] = useState('1024x1024');
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const stopRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setItems((prev) => {
      const remaining = 20 - prev.length;
      if (remaining <= 0) { alert(t('tooMany')); return prev; }
      const toAdd = arr.slice(0, remaining);
      const newItems: QueueItem[] = toAdd.map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        preview: URL.createObjectURL(f),
        status: 'waiting',
      }));
      return [...prev, ...newItems];
    });
  }, [t]);

  const startBatch = async () => {
    const waiting = items.filter((x) => x.status === 'waiting' || x.status === 'failed');
    if (waiting.length === 0) { alert(t('noFiles')); return; }
    setRunning(true);
    stopRef.current = false;
    setDoneCount(0);

    for (const item of waiting) {
      if (stopRef.current) break;
      setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: 'processing' } : x));
      try {
        const imageBase64 = await fileToBase64(item.file);
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, style, count: 1, outputSize, mode: 'free' }),
        });
        const data = await res.json();
        const url = data.variants?.[0]?.imageUrl ?? data.results?.[0];
        if (url) {
          setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: 'done', resultUrl: url } : x));
        } else {
          setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: 'failed' } : x));
        }
      } catch {
        setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: 'failed' } : x));
      }
      setDoneCount((n) => n + 1);
    }
    setRunning(false);
  };

  const downloadAll = async () => {
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');
    const zip = new JSZip();
    const done = items.filter((x) => x.status === 'done' && x.resultUrl);
    await Promise.all(done.map(async (item, i) => {
      const resp = await fetch(item.resultUrl!);
      const blob = await resp.blob();
      zip.file(`result_${i + 1}.jpg`, blob);
    }));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `batch_${style}_${Date.now()}.zip`);
  };

  const doneItems = items.filter((x) => x.status === 'done');
  const allDone = !running && items.length > 0 && items.every((x) => x.status === 'done' || x.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-2xl p-8 text-center cursor-pointer hover:border-[rgba(200,169,107,0.4)] transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <p className="text-ink-muted">{t('uploadArea')}</p>
        <p className="text-xs text-ink-muted mt-1">{t('uploadHint')}</p>
      </div>

      {/* Style picker */}
      <div>
        <label className="block text-xs text-ink-muted mb-2">{t('selectStyle')}</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto pr-0.5">
          {ALL_STYLES.map((s) => (
            <BatchStyleCard
              key={s}
              styleId={s}
              isSelected={style === s}
              name={t(`styles.${s}`)}
              disabled={running}
              onSelect={() => setStyle(s)}
            />
          ))}
        </div>
      </div>

      {/* Output size */}
      <div>
        <label className="block text-xs text-ink-muted mb-1">{t('selectSize')}</label>
        <select
          className="w-full input-field text-sm"
          value={outputSize}
          onChange={(e) => setOutputSize(e.target.value)}
          disabled={running}
        >
          {OUTPUT_SIZES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Queue grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-[rgba(255,255,255,0.08)]">
              <Image
                src={item.status === 'done' && item.resultUrl ? item.resultUrl : item.preview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              {item.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {item.status === 'failed' && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                  <span className="text-white text-xs">&#10007;</span>
                </div>
              )}
              {item.status === 'done' && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">&#10003;</span>
                </div>
              )}
              {!running && item.status !== 'processing' && (
                <button
                  className="absolute bottom-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white/70 text-xs flex items-center justify-center hover:text-red-400"
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {!running && !allDone && items.length > 0 && (
          <button onClick={startBatch} className="btn-gold flex-1">
            {t('startButton')}
          </button>
        )}
        {running && (
          <div className="flex-1 text-center text-ink-muted text-sm pt-2">
            {t('processing', { done: doneCount, total: items.length })}
          </div>
        )}
        {allDone && doneItems.length > 0 && (
          <>
            <div className="flex-1 text-center text-green-400 text-sm pt-2">
              {t('done', { total: doneItems.length })}
            </div>
            <button onClick={downloadAll} className="btn-gold">
              {t('downloadAll')}
            </button>
          </>
        )}
        {items.length > 0 && !running && (
          <button onClick={() => setItems([])} className="btn-ghost text-sm">
            {t('clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}
