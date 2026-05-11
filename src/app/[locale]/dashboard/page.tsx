'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProjectVariant { id: string; imageUrl: string }
interface Project {
  id: string; style: string; generationMode: string;
  hasWatermark: boolean; expiresAt: string; createdAt: string;
  variants: ProjectVariant[];
}
interface Transaction { id: string; type: string; amount: number; description: string; createdAt: string }
interface DashboardData {
  credits: number; freeRemaining: number;
  projects: Project[]; transactions: Transaction[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('dashboard');

  const [data, setData] = useState<DashboardData | null>(null);
  const [banner, setBanner] = useState<'success' | 'canceled' | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth`);
  }, [status, router, locale]);

  useEffect(() => {
    const s = searchParams.get('success');
    const c = searchParams.get('canceled');
    if (s === 'true') setBanner('success');
    else if (c === 'true') setBanner('canceled');
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/dashboard').then((r) => r.json()).then(setData);
  }, [status]);

  if (status === 'loading' || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Page title */}
          <div>
            <p className="text-gold text-xs font-medium tracking-widest uppercase mb-2">Account</p>
            <h1 className="text-3xl font-light text-ink">{t('title')}</h1>
          </div>

          {/* Success / Canceled banners */}
          <AnimatePresence>
            {banner === 'success' && (
              <motion.div
                className="glass-card p-5 border-emerald-500/20 bg-emerald-500/5 flex items-start justify-between gap-4"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-medium text-sm">{t('banner.successTitle')}</p>
                    <p className="text-ink-muted text-xs mt-0.5">{t('banner.successSubtitle')}</p>
                  </div>
                </div>
                <button onClick={() => setBanner(null)} className="text-ink-muted hover:text-ink transition-colors text-lg leading-none">×</button>
              </motion.div>
            )}
            {banner === 'canceled' && (
              <motion.div
                className="glass-card p-5 border-amber-500/20 bg-amber-500/5 flex items-start justify-between gap-4"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-amber-400 font-medium text-sm">{t('banner.canceledTitle')}</p>
                    <p className="text-ink-muted text-xs mt-0.5">{t('banner.canceledSubtitle')}</p>
                  </div>
                </div>
                <button onClick={() => setBanner(null)} className="text-ink-muted hover:text-ink transition-colors text-lg leading-none">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { value: data.credits, label: t('credits.title'), action: <Link href={`/${locale}/pricing`} className="text-gold text-xs hover:text-gold-light transition-colors mt-1 inline-block">{t('credits.buy')}</Link> },
              { value: data.freeRemaining, label: t('stats.freeRemaining') },
              { value: data.projects.length, label: t('stats.totalGenerated') }
            ].map(({ value, label, action }, i) => (
              <motion.div
                key={i}
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-4xl font-light text-gold">{value}</div>
                <div className="text-xs text-ink-muted mt-1.5">{label}</div>
                {action}
              </motion.div>
            ))}
          </div>

          {/* Generation history */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-light text-ink mb-5">{t('history.title')}</h2>
            {data.projects.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-muted text-sm">{t('history.empty')}</p>
                <Link href={`/${locale}/generate`} className="btn-gold inline-flex mt-4 text-sm px-5 py-2.5">
                  Generate Now
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                {data.projects.map((p, i) => {
                  const isExpired = new Date(p.expiresAt) < new Date();
                  const imageUrl = p.variants[0]?.imageUrl;
                  return (
                    <motion.div
                      key={p.id}
                      className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="aspect-square bg-[rgba(255,255,255,0.03)] relative">
                        {imageUrl && !isExpired ? (
                          <img src={imageUrl} alt={p.style} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-muted text-3xl">
                            {isExpired ? '⏰' : '🖼'}
                          </div>
                        )}
                        {p.hasWatermark && !isExpired && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] bg-black/50 text-white/60">
                            FREE
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 space-y-1">
                        <p className="text-xs font-medium text-ink-secondary truncate">{p.style.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-ink-muted">{new Date(p.createdAt).toLocaleDateString()}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          isExpired ? 'bg-[rgba(255,255,255,0.05)] text-ink-muted' :
                          p.generationMode === 'paid' ? 'bg-gold/10 text-gold' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isExpired ? t('history.expired') : p.generationMode}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction history */}
          {data.transactions.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-light text-ink mb-5">{t('credits.history')}</h2>
              <div className="space-y-1">
                {data.transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                    <div>
                      <p className="text-sm text-ink-secondary">{tx.description}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${tx.amount > 0 ? 'text-emerald-400' : 'text-ink-muted'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
