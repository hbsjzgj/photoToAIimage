import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  const locale = await getLocale();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-sm">
          <p className="text-[80px] font-light text-gold/30 leading-none">404</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-light text-ink">{t('title')}</h1>
            <p className="text-ink-muted text-sm">{t('subtitle')}</p>
          </div>
          <Link href={`/${locale}`} className="btn-gold inline-flex">
            {t('home')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
