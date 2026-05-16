'use client';
import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  imageUrl: string;
  filename?: string;
}

type FilterPreset = 'natural' | 'vivid' | 'matte' | 'cool';

const FILTER_PRESETS: Record<FilterPreset, { brightness: number; contrast: number; saturation: number }> = {
  natural:  { brightness: 0,   contrast: 0,   saturation: 0   },
  vivid:    { brightness: 10,  contrast: 15,  saturation: 40  },
  matte:    { brightness: 5,   contrast: -10, saturation: -20 },
  cool:     { brightness: 5,   contrast: 5,   saturation: -10 },
};

export function PostEditToolbar({ imageUrl, filename = 'edited.jpg' }: Props) {
  const t = useTranslations('edit');
  const [expanded, setExpanded] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('natural');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cssFilter = [
    `brightness(${1 + brightness / 100})`,
    `contrast(${1 + contrast / 100})`,
    `saturate(${1 + saturation / 100})`,
  ].join(' ');

  const applyPreset = (preset: FilterPreset) => {
    setActiveFilter(preset);
    const p = FILTER_PRESETS[preset];
    setBrightness(p.brightness);
    setContrast(p.contrast);
    setSaturation(p.saturation);
  };

  const reset = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setActiveFilter('natural');
  };

  const downloadEdited = useCallback(async () => {
    setDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = cssFilter;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename.replace(/\.[^.]+$/, '') + '_edited.jpg';
          a.click();
          URL.revokeObjectURL(url);
        },
        'image/jpeg',
        0.92,
      );
    } finally {
      setDownloading(false);
    }
  }, [imageUrl, cssFilter, filename]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="btn-ghost text-xs py-1.5 px-3 w-full mt-2"
      >
        ✨ {t('title')}
      </button>
    );
  }

  return (
    <div className="mt-3 glass-card p-3 space-y-3">
      {/* Live preview */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="w-full rounded-xl object-cover"
        style={{ filter: cssFilter }}
        crossOrigin="anonymous"
      />

      {/* Sliders */}
      {(
        [
          { key: 'brightness' as const, value: brightness, set: setBrightness, label: t('brightness') },
          { key: 'contrast' as const,   value: contrast,   set: setContrast,   label: t('contrast')   },
          { key: 'saturation' as const, value: saturation, set: setSaturation, label: t('saturation') },
        ]
      ).map(({ key, value, set, label }) => (
        <div key={key}>
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>{label}</span>
            <span>{value > 0 ? `+${value}` : value}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={value}
            onChange={(e) => {
              set(Number(e.target.value));
              setActiveFilter('natural');
            }}
            className="w-full accent-[var(--color-gold)]"
          />
        </div>
      ))}

      {/* Filter presets */}
      <div>
        <p className="text-xs text-ink-muted mb-1.5">{t('filters')}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {(['natural', 'vivid', 'matte', 'cool'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`text-xs py-1.5 rounded-lg transition-colors ${
                activeFilter === preset
                  ? 'bg-[var(--color-gold)] text-black font-medium'
                  : 'bg-white/5 text-ink-muted hover:bg-white/10'
              }`}
            >
              {t(preset)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={reset} className="btn-ghost text-xs flex-1 py-1.5">
          {t('reset')}
        </button>
        <button
          onClick={downloadEdited}
          disabled={downloading}
          className="btn-gold text-xs flex-1 py-1.5"
        >
          {downloading ? '…' : t('download')}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
