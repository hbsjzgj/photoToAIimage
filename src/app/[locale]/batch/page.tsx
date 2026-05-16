import { getTranslations } from 'next-intl/server';
import { BatchQueue } from '@/components/BatchQueue';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'batch' });
  return { title: t('title') };
}

export default async function BatchPage() {
  const t = await getTranslations('batch');
  return (
    <main className="min-h-screen bg-surface py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-1">{t('title')}</h1>
        <p className="text-ink-muted text-sm mb-8">{t('subtitle')}</p>
        <BatchQueue />
      </div>
    </main>
  );
}
