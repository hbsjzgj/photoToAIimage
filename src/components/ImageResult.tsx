'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Variant { id: string; imageUrl: string }

interface Props {
  variants: Variant[];
  hasWatermark: boolean;
  onRegenerate?: () => void;
}

export default function ImageResult({ variants, hasWatermark, onRegenerate }: Props) {
  const [selected, setSelected] = useState(0);

  async function download(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `forma_${Date.now()}.png`;
    a.click();
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-ink">生成完了</h3>
          {hasWatermark && (
            <p className="text-xs text-ink-muted mt-0.5">
              ウォーターマーク入り · クレジット購入でHD版を取得
            </p>
          )}
        </div>
        {onRegenerate && (
          <motion.button
            onClick={onRegenerate}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost text-xs py-2 px-4"
          >
            再生成
          </motion.button>
        )}
      </div>

      {/* Main large preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          className="relative aspect-square rounded-3xl overflow-hidden bg-[rgba(255,255,255,0.04)]
                     border border-[rgba(255,255,255,0.07)] group"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={variants[selected].imageUrl}
            alt="Generated"
            fill
            className="object-cover"
            unoptimized
          />

          {/* Overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/40 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => download(variants[selected].imageUrl)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-6 py-3 rounded-2xl bg-ink text-surface font-medium text-sm
                         backdrop-blur-md shadow-glass"
            >
              {hasWatermark ? 'ダウンロード' : 'HD ダウンロード'}
            </motion.button>
          </motion.div>

          {/* Watermark badge */}
          {hasWatermark && (
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-xl
                            bg-[rgba(0,0,0,0.6)] backdrop-blur-md
                            text-xs text-ink-secondary border border-[rgba(255,255,255,0.08)]">
              ウォーターマーク
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Thumbnail strip (if multiple) */}
      {variants.length > 1 && (
        <div className="flex gap-3">
          {variants.map((v, i) => (
            <motion.button
              key={v.id}
              onClick={() => setSelected(i)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex-1 aspect-square rounded-2xl overflow-hidden
                          border-2 transition-all duration-300
                          ${selected === i
                            ? 'border-gold/60 shadow-gold-sm'
                            : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                          }`}
            >
              <Image src={v.imageUrl} alt={`Variant ${i + 1}`} fill className="object-cover" unoptimized />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
