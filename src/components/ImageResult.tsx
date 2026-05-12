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
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const currentUrl = variants[selected]?.imageUrl ?? '';

  async function download() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(currentUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `forma_avatar_${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: 'FORMA AI Avatar', url: window.location.href }).catch(() => {});
    } else {
      copyLink();
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">生成完了</h3>
          {hasWatermark && (
            <p className="text-xs text-ink-muted mt-0.5">
              ウォーターマーク入り · クレジット購入でHD版を取得
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <motion.button
              onClick={onRegenerate}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost text-xs py-2 px-4"
            >
              再生成
            </motion.button>
          )}
        </div>
      </div>

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

      {/* ── Thumbnail strip ── */}
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
              <Image src={v.imageUrl} alt={`Variant ${i + 1}`} fill className="object-contain bg-[rgba(0,0,0,0.25)]" unoptimized />
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Download */}
        <motion.button
          onClick={download}
          disabled={downloading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-1.5 py-4 rounded-2xl
                     bg-gold text-surface font-medium text-xs
                     shadow-gold hover:bg-gold-light transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>{downloading ? '...' : hasWatermark ? 'ダウンロード' : 'HD保存'}</span>
        </motion.button>

        {/* Share */}
        <motion.button
          onClick={share}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-1.5 py-4 rounded-2xl
                     bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.09)]
                     text-ink-secondary text-xs font-medium
                     hover:bg-[rgba(255,255,255,0.09)] hover:text-ink transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span>シェア</span>
        </motion.button>

        {/* Copy link */}
        <motion.button
          onClick={copyLink}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-1.5 py-4 rounded-2xl
                     bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.09)]
                     text-xs font-medium transition-colors
                     hover:bg-[rgba(255,255,255,0.09)]"
          style={{ color: copied ? 'var(--color-gold)' : undefined }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.svg key="check" className="w-5 h-5 text-gold"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
            ) : (
              <motion.svg key="copy" className="w-5 h-5 text-ink-secondary"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </motion.svg>
            )}
          </AnimatePresence>
          <span>{copied ? 'コピー済' : 'リンク'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
