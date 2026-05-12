'use client';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PurchaseSuccessPage() {
  const t = useTranslations('purchase');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const credits = searchParams.get('credits') ?? '0';

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6">
        <motion.div
          className="glass-card p-12 max-w-sm w-full text-center space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Success icon */}
          <motion.div
            className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl font-light text-ink">{t('successTitle')}</h1>
            <p className="text-ink-muted text-sm">{t('successSubtitle')}</p>
          </div>

          {parseInt(credits) > 0 && (
            <div className="glass-card p-4">
              <p className="text-gold text-3xl font-light">+{credits}</p>
              <p className="text-ink-muted text-xs mt-1">{t('creditsAdded', { count: credits })}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link href={`/${locale}/generate`} className="btn-gold w-full py-3.5 text-center">
              {t('startGenerating')}
            </Link>
            <Link href={`/${locale}/dashboard`} className="btn-ghost w-full py-3 text-center">
              {t('viewDashboard')}
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
