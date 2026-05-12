import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCards from '@/components/PricingCards';

export default async function PricingPage() {
  const t = await getTranslations('pricing');

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Header */}
          <div className="text-center space-y-4">
            <p className="text-gold text-xs font-medium tracking-widest uppercase">Pricing</p>
            <h1 className="text-4xl lg:text-5xl font-light text-ink">{t('title')}</h1>
            <p className="text-ink-secondary font-light max-w-md mx-auto">{t('subtitle')}</p>
          </div>

          <PricingCards />

          {/* FAQ */}
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-light text-ink text-center mb-8">{t('faq.title')}</h2>
            {[1, 2, 3, 4].map((n) => (
              <details
                key={n}
                className="glass-card-hover p-6 cursor-pointer group rounded-3xl"
              >
                <summary className="font-medium text-ink-secondary cursor-pointer list-none
                                    flex justify-between items-center gap-4 group-open:text-ink
                                    transition-colors duration-300">
                  <span>{t(`faq.q${n}` as 'faq.q1')}</span>
                  <svg className="w-5 h-5 text-ink-muted flex-shrink-0 transition-transform duration-300 group-open:rotate-45"
                       viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </summary>
                <p className="mt-4 text-ink-muted text-sm leading-relaxed font-light">
                  {t(`faq.a${n}` as 'faq.a1')}
                </p>
              </details>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
