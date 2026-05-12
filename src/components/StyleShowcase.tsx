'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ALL_STYLES, FREE_STYLES, STYLE_PROMPTS, StyleId } from '@/types';
import { STYLE_IMAGE_URLS, STYLE_FALLBACK_URLS } from '@/lib/styleImages';

const STYLE_LABELS: Record<StyleId, string> = {
  anime_basic: 'Anime Basic',
  soft_cartoon: 'Soft Cartoon',
  cute_pet: 'Cute Pet',
  simple_icon: 'Simple Icon',
  '3d_cartoon': '3D Cartoon',
  anime_pro: 'Anime Pro',
  soft_storybook: 'Storybook',
  cyberpunk: 'Cyberpunk',
  comic_hero: 'Comic Hero',
  fashion_avatar: 'Fashion',
  business_profile: 'Business',
  pet_portrait_pro: 'Pet Pro',
  couple_avatar: 'Couple',
  kawaii_icon: 'Kawaii'
};

function ShowcaseImage({ style, index }: { style: StyleId; index: number }) {
  const [src, setSrc] = useState(STYLE_IMAGE_URLS[style]);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleError() {
    const fallback = STYLE_FALLBACK_URLS[style];
    if (src !== fallback) {
      timerRef.current = setTimeout(() => {
        setLoaded(false);
        setSrc(fallback);
      }, index * 2000);
    } else {
      setSrc('');
    }
  }

  if (!src) return null;

  return (
    <img
      src={src}
      alt={STYLE_LABELS[style]}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={handleError}
      className={`w-full h-full object-cover object-top transition-all duration-700
                   group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

export default function StyleShowcase() {
  const t = useTranslations('home.styles');
  const [copied, setCopied] = useState<StyleId | null>(null);

  function copyPrompt(style: StyleId) {
    navigator.clipboard.writeText(STYLE_PROMPTS[style]);
    setCopied(style);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-gold text-xs font-medium tracking-widest uppercase mb-3">Styles</p>
          <h2 className="text-3xl font-light text-ink">{t('title')}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ALL_STYLES.map((style, i) => {
            const isFree = FREE_STYLES.includes(style);
            return (
              <motion.div
                key={style}
                className="relative group rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] cursor-pointer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03 }}
              >
                {/* Image area */}
                <div className="aspect-square relative overflow-hidden bg-[rgba(255,255,255,0.03)]">
                  <ShowcaseImage style={style} index={i} />
                  {/* Shimmer skeleton always behind the image */}
                  <div className="absolute inset-0 skeleton -z-10" />

                  {/* Hover overlay with copy-prompt button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <motion.button
                      onClick={() => copyPrompt(style)}
                      className="px-3 py-1.5 rounded-xl bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] text-white text-[11px] font-medium backdrop-blur-sm"
                      whileTap={{ scale: 0.95 }}
                    >
                      <AnimatePresence mode="wait">
                        {copied === style ? (
                          <motion.span key="copied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            Copied!
                          </motion.span>
                        ) : (
                          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            Copy Prompt
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>

                {/* Label row */}
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-ink-secondary truncate">{STYLE_LABELS[style]}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ml-1 ${
                    isFree ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gold/10 text-gold'
                  }`}>
                    {isFree ? t('freeTag') : t('paidTag')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
