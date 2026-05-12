'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

const SLIDES = [
  { key: 'animePro',   styleId: 'anime_pro',       gradient: 'from-rose-900/80 via-pink-900/60 to-[#0F1115]',    accent: '#f472b6' },
  { key: 'cyberpunk',  styleId: 'cyberpunk',        gradient: 'from-cyan-900/80 via-blue-900/60 to-[#0F1115]',    accent: '#22d3ee' },
  { key: 'fashion',    styleId: 'fashion_avatar',   gradient: 'from-amber-900/80 via-yellow-900/60 to-[#0F1115]', accent: '#C8A96B' },
  { key: 'watercolor', styleId: 'soft_storybook',   gradient: 'from-violet-900/80 via-purple-900/60 to-[#0F1115]',accent: '#a78bfa' },
];

function SlideImage({ styleId, gradient }: { styleId: string; gradient: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="absolute inset-0">
      {/* Gradient fallback — always rendered below image */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* Preview image */}
      {!error && (
        <img
          src={`/style-previews/${styleId}.webp`}
          alt={styleId}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700
                       ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(10,11,14,0.7)] to-transparent" />
    </div>
  );
}

export default function HeroCarousel() {
  const t = useTranslations('home.carousel');
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 3800);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative w-full max-w-sm mx-auto lg:max-w-none">
      {/* Main card */}
      <div className="relative aspect-square rounded-3xl overflow-hidden glass-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <SlideImage styleId={slide.styleId} gradient={slide.gradient} />
          </motion.div>
        </AnimatePresence>

        {/* Label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`label-${current}`}
            className="absolute bottom-6 left-0 right-0 flex justify-center z-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="px-4 py-2 rounded-full bg-[rgba(0,0,0,0.55)] backdrop-blur-md
                             text-xs font-medium text-ink border border-[rgba(255,255,255,0.10)]">
              {t(slide.key as 'animePro' | 'cyberpunk' | 'fashion' | 'watercolor')}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="transition-all duration-400"
          >
            <motion.div
              className="rounded-full bg-ink-secondary/40"
              animate={{
                width:   i === current ? 20 : 6,
                height:  6,
                opacity: i === current ? 1 : 0.4,
                backgroundColor: i === current ? '#C8A96B' : undefined,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </button>
        ))}
      </div>

      {/* Floating tags (decorative) */}
      <motion.div
        className="absolute -top-4 -right-4 px-3 py-1.5 rounded-2xl glass-card text-xs text-ink-secondary"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        {t('styleCount')}
      </motion.div>
      <motion.div
        className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-2xl glass-card text-xs text-gold"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        {t('quality')}
      </motion.div>
    </div>
  );
}
