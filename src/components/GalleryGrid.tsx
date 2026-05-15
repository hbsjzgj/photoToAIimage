'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { WorkCard, WorkItem } from './WorkCard';
import { ALL_STYLES } from '@/types';

interface GalleryData {
  items: (Omit<WorkItem, 'styleName'>)[];
  total: number;
  pages: number;
}

interface GalleryGridProps {
  styleNames: Record<string, string>;
}

export function GalleryGrid({ styleNames }: GalleryGridProps) {
  const t = useTranslations('gallery');
  const [items, setItems] = useState<GalleryData['items']>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'likes'>('newest');

  const fetchGallery = useCallback(async (p: number, s: string, so: string, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sort: so });
      if (s) params.set('style', s);
      const res = await fetch(`/api/gallery?${params}`);
      const data: GalleryData = await res.json();
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchGallery(1, style, sort, false);
  }, [style, sort, fetchGallery]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchGallery(next, style, sort, true);
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="input-field text-sm py-1.5 px-3 rounded-lg"
        >
          <option value="">{t('filterAll')}</option>
          {ALL_STYLES.map((s) => (
            <option key={s} value={s}>{styleNames[s] ?? s}</option>
          ))}
        </select>
        <div className="flex rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)]">
          {(['newest', 'likes'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 text-sm transition-colors ${sort === s ? 'bg-[rgba(255,255,255,0.08)] text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              {t(s === 'newest' ? 'sortNewest' : 'sortLikes')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-ink-muted py-16">{t('empty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <WorkCard
                key={item.id}
                {...item}
                styleName={styleNames[item.style] ?? item.style}
              />
            ))}
          </div>
          {page < pages && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-ghost px-6 py-2.5 text-sm"
              >
                {loading ? '...' : t('loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
