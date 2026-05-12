'use client';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PackageId = 'starter' | 'creator' | 'pro';

const PACKAGES: { id: PackageId; featured?: boolean; credits: string; price: string }[] = [
  { id: 'starter', credits: '10',  price: '¥500' },
  { id: 'creator', credits: '30',  price: '¥1,200', featured: true },
  { id: 'pro',     credits: '100', price: '¥3,000' },
];

export default function PricingCards() {
  const t = useTranslations('pricing');
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<PackageId | null>(null);

  async function handleBuy(packageId: PackageId) {
    if (!session?.user) { router.push(`/${locale}/auth`); return; }
    setLoading(packageId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, locale })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-16">

      {/* Credit packs */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-ink mb-2">{t('credits.title')}</h2>
          <p className="text-ink-muted text-sm">{t('credits.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PACKAGES.map(({ id, featured, credits, price }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-3xl border overflow-hidden flex flex-col
                          ${featured
                            ? 'border-gold/30 bg-[rgba(200,169,107,0.05)]'
                            : 'border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)]'
                          }`}
            >
              {featured && (
                <>
                  {/* Gold glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px
                                  h-px w-1/2 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gold text-surface text-[10px] font-semibold tracking-wider">
                      {t(`credits.${id}.badge` as `credits.creator.badge`)}
                    </span>
                  </div>
                </>
              )}

              <div className="relative p-8 flex-1 flex flex-col">
                <div className="mb-8">
                  <p className="text-ink-muted text-xs font-medium tracking-wider uppercase mb-3">
                    {t(`credits.${id}.name` as `credits.starter.name`)}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-light ${featured ? 'text-gold' : 'text-ink'}`}>
                      {price}
                    </span>
                  </div>
                  <p className="text-ink-secondary text-sm mt-2">
                    {credits} クレジット ·&nbsp;
                    <span className="text-ink-muted">1枚 = 1クレジット</span>
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {(t.raw('paid.features') as string[]).map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${featured ? 'text-gold' : 'text-ink-muted'}`}
                           viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => handleBuy(id)}
                  disabled={loading === id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-4 rounded-2xl font-medium text-sm transition-all duration-300
                              ${featured
                                ? 'bg-gold text-surface hover:bg-gold-light shadow-gold'
                                : 'bg-[rgba(255,255,255,0.07)] text-ink hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.08)]'
                              }
                              disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === id ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      処理中…
                    </span>
                  ) : t(`credits.${id}.cta` as `credits.starter.cta`)}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Free tier */}
      <motion.div
        className="max-w-sm mx-auto rounded-3xl border border-[rgba(255,255,255,0.06)]
                   bg-[rgba(255,255,255,0.03)] p-8 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-xs text-ink-muted uppercase tracking-wider mb-4">{t('free.name')}</p>
        <p className="text-4xl font-light text-ink mb-6">{t('free.price')}</p>
        <ul className="space-y-3 text-sm text-ink-secondary text-left mb-8">
          {(t.raw('free.features') as string[]).map((f, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-400/70 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <button
          onClick={() => router.push(`/${locale}/generate`)}
          className="btn-ghost w-full py-3.5"
        >
          {t('free.cta')}
        </button>
      </motion.div>
    </div>
  );
}
