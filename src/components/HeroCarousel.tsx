'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { STYLE_IMAGE_URLS, STYLE_FALLBACK_URLS } from '@/lib/styleImages';
import type { StyleId } from '@/types';

const SLIDES: { key: 'animePro' | 'cyberpunk' | 'fashion' | 'watercolor'; styleId: StyleId; gradient: string }[] = [
  { key: 'animePro',   styleId: 'anime_pro',      gradient: 'from-[#1a0a1e] via-[#2d0f3a] to-[#0F1115]' },
  { key: 'cyberpunk',  styleId: 'cyberpunk',       gradient: 'from-[#001a2e] via-[#0a1a3a] to-[#0F1115]' },
  { key: 'fashion',    styleId: 'fashion_avatar',  gradient: 'from-[#1e1200] via-[#2e1c00] to-[#0F1115]' },
  { key: 'watercolor', styleId: 'soft_storybook',  gradient: 'from-[#130a1e] via-[#1e1030] to-[#0F1115]' },
];

function SlideVisual({ styleId, gradient }: { styleId: StyleId; gradient: string }) {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(STYLE_IMAGE_URLS[styleId]);

  function handleError() {
    const fallback = STYLE_FALLBACK_URLS[styleId];
    if (src !== fallback) setSrc(fallback);
    else setSrc('');
  }

  return (
    <div className="absolute inset-0">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      {src && (
        <img
          src={src}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000
                       ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-3/5
                      bg-gradient-to-t from-[rgba(5,5,8,0.98)] via-[rgba(5,5,8,0.65)] to-transparent" />
    </div>
  );
}

export default function HeroCarousel() {
  const t = useTranslations();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 4200);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative w-full max-w-sm mx-auto lg:max-w-none select-none">
      {/* ── Main card ── */}
      <div className="relative aspect-square rounded-3xl overflow-hidden"
           style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)' }}>

        {/* Background + image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <SlideVisual styleId={slide.styleId} gradient={slide.gradient} />
          </motion.div>
        </AnimatePresence>

        {/* ── Top-right badge: "✦ 14 スタイル" ── */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5
                        px-3 py-1.5 rounded-full
                        bg-[rgba(0,0,0,0.50)] backdrop-blur-md
                        border border-[rgba(255,255,255,0.13)]">
          <span className="text-gold text-[10px] leading-none">✦</span>
          <span className="text-[11px] font-medium text-white/90">
            {t('home.carousel.styleCount')}
          </span>
        </div>

        {/* ── Bottom content ── */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 flex flex-col items-center text-center">
          {/* Style name */}
          <AnimatePresence mode="wait">
            <motion.h3
              key={`name-${current}`}
              className="text-xl font-medium text-white mb-1 tracking-wide"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {t(`home.carousel.${slide.key}`)}
            </motion.h3>
          </AnimatePresence>

          {/* Style description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${current}`}
              className="text-[11px] text-white/55 mb-4 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t(`styleDesc.${slide.styleId}`)}
            </motion.p>
          </AnimatePresence>

          {/* CTA button */}
          <Link
            href="/generate"
            className="flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-medium
                       text-white transition-all duration-300 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(to right, #C8A96B, #e879f9)',
              boxShadow: '0 0 24px rgba(200,169,107,0.3)',
            }}
          >
            <span className="text-[13px] leading-none">✦</span>
            {t('home.carousel.ctaButton')}
          </Link>
        </div>
      </div>

      {/* ── Navigation dots ── */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className="transition-all duration-400">
            <motion.div
              className="rounded-full"
              animate={{
                width:   i === current ? 20 : 6,
                height:  6,
                opacity: i === current ? 1 : 0.35,
                backgroundColor: i === current ? '#C8A96B' : 'rgba(255,255,255,0.4)',
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </button>
        ))}
      </div>

      {/* ── "HD 品質" floating tag ── */}
      <motion.div
        className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-2xl glass-card text-xs text-gold"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        {t('home.carousel.quality')}
      </motion.div>
    </div>
  );
}
