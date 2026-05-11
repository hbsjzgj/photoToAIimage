'use client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import LanguageSwitcher from './LanguageSwitcher';
import CreditsDisplay from './CreditsDisplay';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl text-brand-700">
          <span className="text-2xl">✨</span>
          <span>{t('common.appName')}</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href={`/${locale}`} className="hover:text-brand-600 transition-colors">
            {t('nav.home')}
          </Link>
          <Link href={`/${locale}/generate`} className="hover:text-brand-600 transition-colors">
            {t('nav.generate')}
          </Link>
          <Link href={`/${locale}/pricing`} className="hover:text-brand-600 transition-colors">
            {t('nav.pricing')}
          </Link>
          {session?.user && (
            <Link href={`/${locale}/dashboard`} className="hover:text-brand-600 transition-colors">
              {t('nav.dashboard')}
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <CreditsDisplay />
          <LanguageSwitcher />

          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
            >
              {t('common.signOut')}
            </button>
          ) : (
            <Link href={`/${locale}/auth`} className="btn-primary text-sm py-2 px-4">
              {t('common.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
