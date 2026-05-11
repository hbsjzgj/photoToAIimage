import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} {t('common.appName')}. {t('footer.rights')}
        </p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-brand-600 transition-colors">{t('footer.terms')}</a>
          <a href="#" className="hover:text-brand-600 transition-colors">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-brand-600 transition-colors">{t('footer.contact')}</a>
        </div>
      </div>
    </footer>
  );
}
