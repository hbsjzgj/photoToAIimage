'use client';
import { useTranslations } from 'next-intl';
import { StyleId, FREE_STYLES, ALL_STYLES } from '@/types';
import { clsx } from 'clsx';

const STYLE_EMOJI: Record<StyleId, string> = {
  anime_basic: '🌸',
  soft_cartoon: '🎨',
  cute_pet: '🐱',
  simple_icon: '⭕',
  '3d_cartoon': '🎭',
  anime_pro: '✨',
  soft_storybook: '📖',
  cyberpunk: '🤖',
  comic_hero: '💥',
  fashion_avatar: '👗',
  business_profile: '💼',
  pet_portrait_pro: '🐾',
  couple_avatar: '💑',
  kawaii_icon: '🌈'
};

interface Props {
  selected: StyleId | '';
  onSelect: (style: StyleId) => void;
  mode: 'free' | 'paid';
}

export default function StyleSelector({ selected, onSelect, mode }: Props) {
  const t = useTranslations();

  const availableStyles = mode === 'free' ? FREE_STYLES : ALL_STYLES;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {availableStyles.map((style) => {
        const isFree = FREE_STYLES.includes(style);
        const isSelected = selected === style;

        return (
          <button
            key={style}
            onClick={() => onSelect(style)}
            className={clsx(
              'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm',
              isSelected
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-100 hover:border-brand-200 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="text-2xl">{STYLE_EMOJI[style]}</span>
            <span className="text-xs font-medium text-center leading-tight">
              {t(`styles.${style}`)}
            </span>
            <span
              className={clsx(
                'absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                isFree
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              )}
            >
              {isFree ? t('home.styles.freeTag') : t('home.styles.paidTag')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
