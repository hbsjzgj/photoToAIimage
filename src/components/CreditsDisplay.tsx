'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function CreditsDisplay() {
  const { data: session } = useSession();
  const t = useTranslations('generate.paid');
  const locale = useLocale();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/credits')
      .then((r) => r.json())
      .then((d) => setCredits(d.credits));
  }, [session]);

  if (!session?.user || credits === null) return null;

  return (
    <Link
      href={`/${locale}/pricing`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100
                 text-brand-700 text-sm font-medium transition-colors"
    >
      <span>💎</span>
      <span>{t('credits', { count: credits })}</span>
    </Link>
  );
}
