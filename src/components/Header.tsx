'use client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import CreditsDisplay from './CreditsDisplay';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { href: `/${locale}`, label: t('nav.home') },
    { href: `/${locale}/generate`, label: t('nav.generate') },
    { href: `/${locale}/pricing`, label: t('nav.pricing') },
    ...(session?.user ? [{ href: `/${locale}/dashboard`, label: t('nav.dashboard') }] : []),
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Blur backing */}
      <div className="absolute inset-0 bg-surface/70 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]" />

      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
          <motion.div
            className="w-7 h-7 rounded-lg bg-gold/90 flex items-center justify-center"
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="text-surface text-xs font-black tracking-tighter">F</span>
          </motion.div>
          <span className="font-semibold text-ink tracking-wide text-sm">FORMA</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/') && href !== `/${locale}`;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                  ${active ? 'text-ink' : 'text-ink-secondary hover:text-ink hover:bg-[rgba(255,255,255,0.05)]'}`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-[rgba(255,255,255,0.07)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <CreditsDisplay />
          <LanguageSwitcher />

          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="text-sm text-ink-secondary hover:text-ink transition-colors duration-200"
            >
              {t('common.signOut')}
            </button>
          ) : (
            <Link
              href={`/${locale}/auth`}
              className="btn-ghost text-sm py-2 px-4"
            >
              {t('common.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
