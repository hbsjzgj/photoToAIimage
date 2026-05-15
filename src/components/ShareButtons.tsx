'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface ShareButtonsProps {
  workId: string;
  styleName: string;
  compact?: boolean;
}

export function ShareButtons({ workId, styleName, compact = false }: ShareButtonsProps) {
  const t = useTranslations('work');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const workUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/work/${workId}`
    : `/${locale}/work/${workId}`;

  const twitterText = encodeURIComponent(`FORMAで${styleName}に変換してみた！ #FORMA #AIアート`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(workUrl)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(workUrl)}`;

  async function copyLink() {
    await navigator.clipboard.writeText(workUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btnClass = compact
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(255,255,255,0.1)] text-ink-secondary hover:text-ink hover:border-[rgba(255,255,255,0.2)] transition-all'
    : 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(255,255,255,0.1)] text-ink-secondary hover:text-ink hover:border-[rgba(255,255,255,0.2)] transition-all';

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-2'}`}>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <span>𝕏</span>
        <span>{compact ? 'X' : t('shareTwitter')}</span>
      </a>
      <a href={lineUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <span>💬</span>
        <span>{compact ? 'LINE' : t('shareLine')}</span>
      </a>
      <button onClick={copyLink} className={btnClass}>
        <span>{copied ? '✓' : '🔗'}</span>
        <span>{copied ? t('copied') : (compact ? t('copyLink') : t('copyLink'))}</span>
      </button>
    </div>
  );
}
