'use client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { StyleId } from '@/types';
import { ALL_STYLES } from '@/types';

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

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-muted mb-1">{t('selectStyle')}</label>
          <select
            className="w-full input-field text-sm"
            value={style}
            onChange={(e) => setStyle(e.target.value as StyleId)}
            disabled={running}
          >
            {ALL_STYLES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
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
