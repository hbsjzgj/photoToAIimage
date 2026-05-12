'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function CreditsDisplay() {
  const { data: session } = useSession();
  const locale = useLocale();
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(() => {
    if (!session?.user) return;
    fetch('/api/credits')
      .then((r) => r.json())
      .then((d) => setCredits(d.credits));
  }, [session]);

  // Initial fetch + re-fetch on session change
  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  // Re-fetch when GenerateForm dispatches credits:refresh
  useEffect(() => {
    window.addEventListener('credits:refresh', fetchCredits);
    return () => window.removeEventListener('credits:refresh', fetchCredits);
  }, [fetchCredits]);

  if (!session?.user || credits === null) return null;

  return (
    <Link
      href={`/${locale}/pricing`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                 bg-gold-muted border border-gold/20
                 text-gold text-xs font-medium
                 hover:bg-gold/20 hover:border-gold/40
                 transition-all duration-300"
    >
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 3.5v5M4 5.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span>{credits} cr</span>
    </Link>
  );
}
