import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCards from '@/components/PricingCards';

export default async function PricingPage() {
  const t = await getTranslations('pricing');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">{t('title')}</h1>
            <p className="text-gray-500 text-lg">{t('subtitle')}</p>
          </div>

          <PricingCards />

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('faq.title')}</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <details key={n} className="card cursor-pointer group">
                  <summary className="font-semibold text-gray-700 cursor-pointer list-none flex justify-between items-center">
                    {t(`faq.q${n}` as 'faq.q1')}
                    <span className="text-brand-500 group-open:rotate-180 transition-transform text-lg">▾</span>
                  </summary>
                  <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                    {t(`faq.a${n}` as 'faq.a1')}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
