import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gold/90 flex items-center justify-center">
                <span className="text-surface text-[10px] font-black">F</span>
              </div>
              <span className="font-semibold text-ink text-sm tracking-wide">FORMA</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-ink-muted">
            <Link href={`/${locale}/terms`} className="hover:text-gold transition-colors duration-200">{t('footer.terms')}</Link>
            <Link href={`/${locale}/privacy`} className="hover:text-gold transition-colors duration-200">{t('footer.privacy')}</Link>
            <a href="#" className="hover:text-gold transition-colors duration-200">{t('footer.contact')}</a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-faint)] flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} FORMA. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse-gold" />
            <span className="text-xs text-ink-muted">AI Powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
