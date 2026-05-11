import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const t = await getTranslations('generate');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('title')}</h1>
          <GenerateForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
