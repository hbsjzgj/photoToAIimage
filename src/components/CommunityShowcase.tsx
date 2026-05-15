'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

interface WorkPreview { id: string; imageUrl: string; style: string; likeCount: number }

export function CommunityShowcase() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [works, setWorks] = useState<WorkPreview[]>([]);

  useEffect(() => {
    fetch('/api/gallery?limit=8&sort=likes')
      .then((r) => r.json())
      .then((d) => setWorks(d.items ?? []));
  }, []);

  if (works.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink">{t('community.title')}</h2>
            <p className="text-ink-muted text-sm mt-1">{t('community.subtitle')}</p>
          </div>
          <Link href={`/${locale}/gallery`} className="text-sm text-ink-muted hover:text-ink transition-colors">
            {t('community.viewAll')}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {works.slice(0, 8).map((w) => (
            <Link key={w.id} href={`/${locale}/work/${w.id}`}
                  className="relative aspect-square rounded-xl overflow-hidden group border border-[rgba(255,255,255,0.06)]">
              <Image src={w.imageUrl} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="25vw" />
              <div className="absolute bottom-0 inset-x-0 p-2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                <span className="text-white text-xs">♥ {w.likeCount}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
