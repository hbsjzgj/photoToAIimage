'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCards from '@/components/PricingCards';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const tDashboard = useTranslations('dashboard');
  const searchParams = useSearchParams();
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') setShowCanceled(true);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Canceled banner */}
          <AnimatePresence>
            {showCanceled && (
              <motion.div
                className="glass-card p-5 border-amber-500/20 bg-amber-500/5 flex items-start justify-between gap-4"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-amber-400 font-medium text-sm">{tDashboard('banner.canceledTitle')}</p>
                    <p className="text-ink-muted text-xs mt-0.5">{tDashboard('banner.canceledSubtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCanceled(false)}
                  className="text-ink-muted hover:text-ink transition-colors text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
