'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { StyleId, FREE_STYLES, ALL_STYLES } from '@/types';
import { STYLE_IMAGE_URLS, STYLE_FALLBACK_URLS } from '@/lib/styleImages';

interface StyleVisual {
  gradient: string;
  accent: string;
}

const STYLE_VISUALS: Record<StyleId, StyleVisual> = {
  anime_basic:      { gradient: 'from-rose-600/60 via-pink-700/40 to-[#0F1115]',      accent: '#f9a8d4' },
  soft_cartoon:     { gradient: 'from-amber-500/60 via-orange-600/40 to-[#0F1115]',   accent: '#fbbf24' },
  cute_pet:         { gradient: 'from-yellow-400/60 via-orange-400/40 to-[#0F1115]',  accent: '#fb923c' },
  simple_icon:      { gradient: 'from-slate-400/50 via-gray-600/30 to-[#0F1115]',     accent: '#d1d5db' },
  '3d_cartoon':     { gradient: 'from-purple-600/60 via-violet-700/40 to-[#0F1115]',  accent: '#c084fc' },
  anime_pro:        { gradient: 'from-violet-600/60 via-indigo-700/40 to-[#0F1115]',  accent: '#a78bfa' },
  soft_storybook:   { gradient: 'from-emerald-500/50 via-green-600/30 to-[#0F1115]',  accent: '#6ee7b7' },
  cyberpunk:        { gradient: 'from-cyan-500/60 via-blue-600/40 to-[#0F1115]',      accent: '#22d3ee' },
  comic_hero:       { gradient: 'from-red-600/60 via-orange-600/40 to-[#0F1115]',     accent: '#f87171' },
  fashion_avatar:   { gradient: 'from-amber-400/60 via-yellow-600/40 to-[#0F1115]',   accent: '#C8A96B' },
  business_profile: { gradient: 'from-slate-500/50 via-gray-600/30 to-[#0F1115]',     accent: '#94a3b8' },
  pet_portrait_pro: { gradient: 'from-amber-700/60 via-yellow-700/40 to-[#0F1115]',   accent: '#d97706' },
  couple_avatar:    { gradient: 'from-pink-600/60 via-rose-600/40 to-[#0F1115]',      accent: '#fb7185' },
  kawaii_icon:      { gradient: 'from-sky-400/60 via-indigo-500/40 to-[#0F1115]',     accent: '#38bdf8' },
};

interface Props {
  selected: StyleId | '';
  onSelect: (style: StyleId) => void;
  mode: 'free' | 'paid';
  gridClassName?: string;
}

function StyleCard({
  style,
  isSelected,
  isFree,
  index,
  onSelect,
  t,
}: {
  style: StyleId;
  isSelected: boolean;
  isFree: boolean;
  index: number;
  onSelect: (s: StyleId) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(STYLE_IMAGE_URLS[style]);
  const [imgError, setImgError] = useState(false);
  const visual = STYLE_VISUALS[style];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up stagger timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleError() {
    const fallback = STYLE_FALLBACK_URLS[style];
    if (imgSrc !== fallback) {
      // Stagger Pollinations.ai requests by index (2s apart) to avoid 429
      timerRef.current = setTimeout(() => {
        setImgLoaded(false);
        setImgSrc(fallback);
      }, index * 2000);
    } else {
      setImgError(true);
    }
  }

  return (
    <motion.button
      onClick={() => onSelect(style)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.035, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.025, y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex flex-col rounded-2xl overflow-hidden cursor-pointer
                  aspect-[3/4] text-left group
                  transition-shadow duration-400
                  ${isSelected
                    ? 'shadow-[0_0_0_2px_rgba(200,169,107,0.7),0_8px_32px_rgba(200,169,107,0.20)]'
                    : 'shadow-[0_2px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_28px_rgba(0,0,0,0.5)]'
                  }`}
    >
      {/* Gradient fallback background — always visible until image loads */}
      <div className={`absolute inset-0 bg-gradient-to-b ${visual.gradient} transition-opacity duration-500
                       ${imgLoaded && !imgError ? 'opacity-0' : 'opacity-100'}`} />

      {/* Preview image: tries /style-previews/{style}.jpg first, falls back to Pollinations.ai */}
      {!imgError && (
        <img
          src={imgSrc}
          alt={t(`styles.${style}`)}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-700
                       group-hover:scale-105
                       ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Bottom overlay — always on top of image */}
      <div className="absolute inset-x-0 bottom-0 h-2/3
                      bg-gradient-to-t from-[rgba(10,11,14,0.96)] via-[rgba(10,11,14,0.6)] to-transparent
                      pointer-events-none" />

      {/* Selected gold ring */}
      {isSelected && (
        <motion.div
          layoutId="style-ring"
          className="absolute inset-0 rounded-2xl border-2 border-[rgba(200,169,107,0.7)] z-10"
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />
      )}

      {/* Selected gold tick */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'var(--color-gold)' }}>
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* FREE / PRO badge */}
      <div className={`absolute top-2.5 left-2.5 z-20 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full
                       ${isFree
                         ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25'
                         : 'bg-gold/15 text-gold border border-gold/20'
                       }`}>
        {isFree ? 'FREE' : 'PRO'}
      </div>

      {/* Text info */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3">
        <p className="text-xs font-semibold text-white leading-tight mb-0.5 truncate"
           style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {t(`styles.${style}`)}
        </p>
        <p className="text-[10px] leading-snug truncate"
           style={{ color: 'rgba(184,194,208,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {t(`styleDesc.${style}`)}
        </p>
      </div>
    </motion.button>
  );
}

export default function StyleSelector({ selected, onSelect, mode, gridClassName }: Props) {
  const t = useTranslations();
  const available = mode === 'free' ? FREE_STYLES : ALL_STYLES;

  return (
    <div className={gridClassName ?? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'}>
      {available.map((style, i) => (
        <StyleCard
          key={style}
          style={style}
          isSelected={selected === style}
          isFree={FREE_STYLES.includes(style)}
          index={i}
          onSelect={onSelect}
          t={t}
        />
      ))}
    </div>
  );
}
