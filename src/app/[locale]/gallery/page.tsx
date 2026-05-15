import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GalleryGrid } from '@/components/GalleryGrid';
import { ALL_STYLES } from '@/types';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return {
    title: `${t('title')} | FORMA`,
    description: t('subtitle'),
    openGraph: { title: `${t('title')} | FORMA`, description: t('subtitle') },
  };
}

export default async function GalleryPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'gallery' });
  const tStyles = await getTranslations({ locale, namespace: 'styles' });

  const styleNames = Object.fromEntries(
    ALL_STYLES.map((s) => {
      try { return [s, tStyles(s as Parameters<typeof tStyles>[0])]; } catch { return [s, s]; }
    })
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">{t('title')}</h1>
          <p className="text-ink-muted mt-1">{t('subtitle')}</p>
        </div>
        <GalleryGrid styleNames={styleNames} />
      </main>
      <Footer />
    </div>
  );
}
