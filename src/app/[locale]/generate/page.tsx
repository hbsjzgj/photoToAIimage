import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const t = await getTranslations('generate');

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Page header */}
          <div className="text-center mb-14">
            <p className="text-gold text-xs font-medium tracking-widest uppercase mb-4">Studio</p>
            <h1 className="text-4xl font-light text-ink">{t('title')}</h1>
            <p className="mt-3 text-ink-secondary text-sm font-light">
              写真をアップロードして、AIアートスタイルに変換します
            </p>
          </div>
          <GenerateForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
