'use client';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { StyleId, FREE_STYLES, ALL_STYLES } from '@/types';

interface StyleMeta {
  emoji: string;
  gradient: string;
  textColor: string;
}

const STYLE_META: Record<StyleId, StyleMeta> = {
  anime_basic:      { emoji: '🌸', gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',    textColor: '#f9a8d4' },
  soft_cartoon:     { emoji: '🎨', gradient: 'from-orange-400/20 via-amber-400/10 to-transparent', textColor: '#fbbf24' },
  cute_pet:         { emoji: '🐱', gradient: 'from-yellow-400/20 via-orange-300/10 to-transparent',textColor: '#fb923c' },
  simple_icon:      { emoji: '⭕', gradient: 'from-zinc-400/15 via-gray-400/8 to-transparent',     textColor: '#d1d5db' },
  '3d_cartoon':     { emoji: '🎭', gradient: 'from-purple-500/20 via-violet-400/10 to-transparent',textColor: '#c084fc' },
  anime_pro:        { emoji: '✨', gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',textColor: '#a78bfa' },
  soft_storybook:   { emoji: '📖', gradient: 'from-green-500/15 via-emerald-400/8 to-transparent', textColor: '#6ee7b7' },
  cyberpunk:        { emoji: '🤖', gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',    textColor: '#22d3ee' },
  comic_hero:       { emoji: '💥', gradient: 'from-red-500/20 via-orange-500/10 to-transparent',   textColor: '#f87171' },
  fashion_avatar:   { emoji: '👗', gradient: 'from-amber-400/20 via-gold/10 to-transparent',       textColor: '#C8A96B' },
  business_profile: { emoji: '💼', gradient: 'from-slate-400/15 via-gray-500/8 to-transparent',   textColor: '#94a3b8' },
  pet_portrait_pro: { emoji: '🐾', gradient: 'from-amber-600/20 via-yellow-600/10 to-transparent',textColor: '#d97706' },
  couple_avatar:    { emoji: '💑', gradient: 'from-pink-500/20 via-rose-400/10 to-transparent',   textColor: '#fb7185' },
  kawaii_icon:      { emoji: '🌈', gradient: 'from-sky-400/20 via-indigo-400/10 to-transparent',  textColor: '#38bdf8' },
};

interface Props {
  selected: StyleId | '';
  onSelect: (style: StyleId) => void;
  mode: 'free' | 'paid';
}

export default function StyleSelector({ selected, onSelect, mode }: Props) {
  const t = useTranslations();
  const available = mode === 'free' ? FREE_STYLES : ALL_STYLES;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {available.map((style, i) => {
        const meta = STYLE_META[style];
        const isFree = FREE_STYLES.includes(style);
        const isSelected = selected === style;

        return (
          <motion.button
            key={style}
            onClick={() => onSelect(style)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={`relative flex flex-col items-center gap-3 p-5 rounded-3xl border
                        overflow-hidden text-left cursor-pointer group
                        transition-all duration-400
                        ${isSelected
                          ? 'border-gold/50 bg-gold/8 shadow-gold-sm'
                          : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.13)]'
                        }`}
          >
            {/* Gradient bg on hover / selected */}
            <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}
                             transition-opacity duration-400
                             ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} />

            {/* Selected ring */}
            {isSelected && (
              <motion.div
                layoutId="style-selected"
                className="absolute inset-0 rounded-3xl border-2 border-gold/60"
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            )}

            <span className="relative text-3xl transition-transform duration-400 group-hover:scale-110">
              {meta.emoji}
            </span>

            <div className="relative w-full">
              <p className="text-xs font-medium text-ink-secondary group-hover:text-ink
                             transition-colors duration-300 leading-tight text-center">
                {t(`styles.${style}`)}
              </p>
            </div>

            {/* Free / Pro badge */}
            <div className={`relative text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full
                             ${isFree
                               ? 'text-emerald-400/80 bg-emerald-500/10'
                               : 'text-gold/70 bg-gold/8'
                             }`}>
              {isFree ? 'FREE' : 'PRO'}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
