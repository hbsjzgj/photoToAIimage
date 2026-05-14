'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ALL_STYLES, FREE_STYLES, type StyleId } from '@/types';
import { STYLE_IMAGE_URLS, STYLE_FALLBACK_URLS } from '@/lib/styleImages';
import {
  STYLE_CATEGORIES, STYLE_CATEGORY_MAP, STYLE_USE_CASE,
  type StyleCategory,
} from '@/lib/styleMeta';

function StyleCard({
  style,
  index,
  onGenerate,
}: {
  style: StyleId;
  index: number;
  onGenerate: (s: StyleId) => void;
}) {
  const t = useTranslations('styles');
  const locale = useLocale();
  const [src, setSrc] = useState(STYLE_IMAGE_URLS[style]);
  const [loaded, setLoaded] = useState(false);
  const isFree = FREE_STYLES.includes(style);
  const useCase = STYLE_USE_CASE[style];

  const useCaseLabel = locale === 'ja' ? useCase.ja : locale === 'zh' ? useCase.zh : useCase.en;
  const ctaLabel = locale === 'ja' ? '同じスタイルで生成 →' : locale === 'zh' ? '同款生成 →' : 'Try This Style →';

  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.07)]
                 bg-[rgba(255,255,255,0.02)] cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[rgba(255,255,255,0.03)]">
        <div className="absolute inset-0 skeleton" />
        {src && (
          <img
            src={src}
            alt={t(style)}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (src !== STYLE_FALLBACK_URLS[style]) setSrc(STYLE_FALLBACK_URLS[style]);
              else setSrc('');
            }}
            className={`absolute inset-0 w-full h-full object-cover object-top
                       group-hover:scale-105 transition-all duration-700
                       ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Free badge */}
        {isFree && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full
                          bg-emerald-500/20 border border-emerald-500/25
                          text-emerald-400 text-[9px] font-bold tracking-wider">
            FREE
          </span>
        )}
        {!isFree && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full
                          bg-gold/15 border border-gold/20
                          text-gold text-[9px] font-bold tracking-wider">
            PRO
          </span>
        )}

        {/* Hover CTA */}
        <div className="absolute inset-x-3 bottom-3
                       translate-y-2 opacity-0
                       group-hover:translate-y-0 group-hover:opacity-100
                       transition-all duration-300 ease-out">
          <button
            onClick={() => onGenerate(style)}
            className="w-full py-2.5 rounded-xl bg-gold text-surface text-xs font-semibold
                      hover:bg-gold-light active:scale-95 transition-all duration-200"
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-3 space-y-0.5">
        <p className="text-xs font-semibold text-ink truncate">{t(style)}</p>
        <p className="text-[11px] text-ink-muted leading-snug line-clamp-1">{useCaseLabel}</p>
      </div>
    </motion.div>
  );
}

export default function StyleCaseGrid() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const locale = useLocale();
  const router = useRouter();

  const getCatLabel = (cat: (typeof STYLE_CATEGORIES)[0]) =>
    locale === 'ja' ? cat.ja : locale === 'zh' ? cat.zh : cat.en;

  const filtered =
    activeCategory === 'all'
      ? ALL_STYLES
      : ALL_STYLES.filter((s) =>
          STYLE_CATEGORY_MAP[s].includes(activeCategory as StyleCategory)
        );

  function handleGenerate(style: StyleId) {
    router.push(`/${locale}/generate?style=${style}`);
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold text-xs font-medium tracking-widest uppercase mb-3">
            Style Gallery
          </p>
          <h2 className="text-3xl lg:text-4xl font-light text-ink">
            {locale === 'ja'
              ? '34 種類のプレミアムスタイル'
              : locale === 'zh'
              ? '34 种专属 AI 风格'
              : '34 Premium AI Styles'}
          </h2>
          <p className="mt-3 text-ink-secondary text-sm font-light max-w-xs mx-auto">
            {locale === 'ja'
              ? 'スタイルを選んで写真をアップロードするだけ'
              : locale === 'zh'
              ? '点击「同款生成」，自动载入风格，上传照片即可'
              : 'Click any style to auto-load it, then upload your photo'}
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {STYLE_CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              whileTap={{ scale: 0.94 }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${activeCategory === cat.id
                  ? 'bg-gold text-surface shadow-[0_0_20px_rgba(200,169,107,0.25)]'
                  : 'bg-[rgba(255,255,255,0.05)] text-ink-muted border border-[rgba(255,255,255,0.07)] hover:text-ink hover:bg-[rgba(255,255,255,0.09)]'
                }`}
            >
              {getCatLabel(cat)}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <motion.div
          key={activeCategory}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filtered.map((style, i) => (
            <StyleCard
              key={style}
              style={style}
              index={i}
              onGenerate={handleGenerate}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
