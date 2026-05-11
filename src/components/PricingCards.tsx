'use client';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clsx } from 'clsx';

type PackageId = 'starter' | 'creator' | 'pro';

const PACKAGES: { id: PackageId; badge?: boolean }[] = [
  { id: 'starter' },
  { id: 'creator', badge: true },
  { id: 'pro' }
];

export default function PricingCards() {
  const t = useTranslations('pricing');
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<PackageId | null>(null);

  async function handleBuy(packageId: PackageId) {
    if (!session?.user) {
      router.push(`/${locale}/auth`);
      return;
    }

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
    <div className="space-y-8">
      {/* Credit packs */}
      <div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{t('credits.title')}</h2>
        <p className="text-center text-gray-500 mb-8">{t('credits.subtitle')}</p>

        <div className="grid md:grid-cols-3 gap-6">
          {PACKAGES.map(({ id, badge }) => (
            <div
              key={id}
              className={clsx(
                'card relative flex flex-col',
                badge && 'border-brand-400 shadow-md ring-2 ring-brand-200'
              )}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white
                                text-xs font-bold px-3 py-1 rounded-full">
                  {t(`credits.${id}.badge` as `credits.creator.badge`)}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {t(`credits.${id}.name` as `credits.starter.name`)}
                </h3>
                <p className="text-3xl font-black text-brand-600">
                  {t(`credits.${id}.price` as `credits.starter.price`)}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {t(`credits.${id}.credits` as `credits.starter.credits`)}
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {(t.raw('paid.features') as string[]).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-brand-500 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(id)}
                disabled={loading === id}
                className={clsx('btn-primary w-full', badge ? '' : 'bg-gray-700 hover:bg-gray-800')}
              >
                {loading === id ? '...' : t(`credits.${id}.cta` as `credits.starter.cta`)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Free plan */}
      <div className="card max-w-sm mx-auto text-center">
        <h3 className="text-lg font-bold text-gray-700 mb-1">{t('free.name')}</h3>
        <p className="text-3xl font-black text-gray-800">{t('free.price')}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-gray-500 text-left">
          {(t.raw('free.features') as string[]).map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-green-500">✓</span> {f}
            </li>
          ))}
        </ul>
        <button
          onClick={() => router.push(`/${locale}/generate`)}
          className="btn-secondary w-full mt-6"
        >
          {t('free.cta')}
        </button>
      </div>
    </div>
  );
}
