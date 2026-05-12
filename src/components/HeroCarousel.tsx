'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  { label: 'アニメ・プロ',   gradient: 'from-rose-900/60 via-pink-900/40 to-surface',   emoji: '✨', accent: '#f472b6' },
  { label: 'サイバーパンク', gradient: 'from-cyan-900/60 via-blue-900/40 to-surface',    emoji: '🤖', accent: '#22d3ee' },
  { label: 'ファッション',   gradient: 'from-amber-900/60 via-yellow-900/40 to-surface', emoji: '👗', accent: '#C8A96B' },
  { label: '水彩アート',     gradient: 'from-violet-900/60 via-purple-900/40 to-surface',emoji: '🎨', accent: '#a78bfa' },
];

export default function HeroCarousel() {
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
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>

        {/* Floating emoji avatar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`emoji-${current}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="w-36 h-36 rounded-full flex items-center justify-center text-8xl
                         bg-[rgba(0,0,0,0.25)] backdrop-blur-sm border border-[rgba(255,255,255,0.10)]"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {slide.emoji}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`label-${current}`}
            className="absolute bottom-6 left-0 right-0 flex justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="px-4 py-2 rounded-full bg-[rgba(0,0,0,0.5)] backdrop-blur-md
                             text-xs font-medium text-ink border border-[rgba(255,255,255,0.10)]">
              {slide.label}
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
        14 スタイル
      </motion.div>
      <motion.div
        className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-2xl glass-card text-xs text-gold"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        HD 品質
      </motion.div>
    </div>
  );
}
