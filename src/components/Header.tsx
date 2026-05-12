'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import CreditsDisplay from './CreditsDisplay';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navLinks = [
    { href: `/${locale}`, label: t('nav.home') },
    { href: `/${locale}/generate`, label: t('nav.generate') },
    { href: `/${locale}/pricing`, label: t('nav.pricing') },
    ...(session?.user ? [{ href: `/${locale}/dashboard`, label: t('nav.dashboard') }] : []),
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50">
        {/* Blur backing */}
        <div className="absolute inset-0 backdrop-blur-xl border-b border-[var(--border-subtle)]"
             style={{ backgroundColor: 'var(--header-backdrop)' }} />

        <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <motion.div
              className="relative w-7 h-7 rounded-lg bg-gold/90 flex items-center justify-center overflow-hidden flex-shrink-0"
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <span className="text-surface text-xs font-black tracking-tighter select-none">F</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/forma-icon.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </motion.div>
            <span className="hidden sm:block font-semibold text-ink tracking-wide text-sm">FORMA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (pathname.startsWith(href + '/') && href !== `/${locale}`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    ${active ? 'text-ink' : 'text-ink-secondary hover:text-ink hover:bg-[var(--nav-hover)]'}`}
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

          {/* Right — desktop */}
          <div className="flex items-center gap-3">
            <CreditsDisplay />
            <div className="hidden md:block"><LanguageSwitcher /></div>

            <div className="hidden md:block">
              {session?.user ? (
                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="text-sm text-ink-secondary hover:text-ink transition-colors duration-200"
                >
                  {t('common.signOut')}
                </button>
              ) : (
                <Link href={`/${locale}/auth`} className="btn-ghost text-sm py-2 px-4">
                  {t('common.signIn')}
                </Link>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 -mr-1 text-ink-secondary hover:text-ink transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              onClick={() => setMobileOpen(false)}
            />

            {/* Nav panel */}
            <motion.nav
              className="absolute top-16 inset-x-0 bg-surface border-b border-[rgba(255,255,255,0.07)] px-6 py-5 space-y-1"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-ink-secondary hover:text-ink hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium"
                >
                  {label}
                </Link>
              ))}

              <div className="pt-4 mt-3 border-t border-[rgba(255,255,255,0.07)] flex items-center justify-between">
                <LanguageSwitcher />
                {session?.user ? (
                  <button
                    onClick={() => { signOut({ callbackUrl: `/${locale}` }); setMobileOpen(false); }}
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    {t('common.signOut')}
                  </button>
                ) : (
                  <Link
                    href={`/${locale}/auth`}
                    onClick={() => setMobileOpen(false)}
                    className="btn-ghost text-sm py-2 px-4"
                  >
                    {t('common.signIn')}
                  </Link>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
