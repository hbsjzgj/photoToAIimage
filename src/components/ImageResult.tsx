'use client';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface Variant { id: string; imageUrl: string }

interface Props {
  variants: Variant[];
  hasWatermark: boolean;
  onRegenerate?: () => void;
}

export default function ImageResult({ variants, hasWatermark, onRegenerate }: Props) {
  const t = useTranslations('generate.result');

  async function downloadImage(url: string, filename: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{t('title')}</h3>

      {hasWatermark && (
        <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          ⚠️ {t('watermarkNote')}
        </p>
      )}

      <div className={`grid gap-4 ${variants.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {variants.map((v, i) => (
          <div key={v.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
            <Image
              src={v.imageUrl}
              alt={`Generated avatar ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                            flex items-center justify-center">
              <button
                onClick={() => downloadImage(v.imageUrl, `avatar_${i + 1}.png`)}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
              >
                {hasWatermark ? t('download') : t('downloadHD')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {onRegenerate && !hasWatermark && (
        <button onClick={onRegenerate} className="btn-secondary w-full">
          🔄 {t('regenerate')}
        </button>
      )}
    </div>
  );
}
