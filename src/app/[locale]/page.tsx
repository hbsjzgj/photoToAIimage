import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ALL_STYLES, FREE_STYLES } from '@/types';

const STYLE_EMOJI: Record<string, string> = {
  anime_basic: '🌸', soft_cartoon: '🎨', cute_pet: '🐱', simple_icon: '⭕',
  '3d_cartoon': '🎭', anime_pro: '✨', soft_storybook: '📖', cyberpunk: '🤖',
  comic_hero: '💥', fashion_avatar: '👗', business_profile: '💼',
  pet_portrait_pro: '🐾', couple_avatar: '💑', kawaii_icon: '🌈'
};

interface Props { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-purple-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-semibold">
            <span>✨</span> AI-Powered Avatar Generator
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('home.hero.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href={`/${locale}/generate`} className="btn-primary px-8 py-4 text-lg">
              {t('home.hero.ctaPrimary')}
            </Link>
            <Link href={`/${locale}/pricing`} className="btn-secondary px-8 py-4 text-lg">
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>
          <p className="text-sm text-gray-400">3 free / day · No credit card required</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{t('home.howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t('home.howItWorks.step1Title'), desc: t('home.howItWorks.step1Desc'), emoji: '📷' },
              { num: '02', title: t('home.howItWorks.step2Title'), desc: t('home.howItWorks.step2Desc'), emoji: '🎨' },
              { num: '03', title: t('home.howItWorks.step3Title'), desc: t('home.howItWorks.step3Desc'), emoji: '⬇️' }
            ].map((step) => (
              <div key={step.num} className="text-center space-y-3">
                <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                  {step.emoji}
                </div>
                <div className="text-sm font-bold text-brand-500">{step.num}</div>
                <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Gallery */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{t('home.styles.title')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {ALL_STYLES.map((style) => {
              const isFree = FREE_STYLES.includes(style);
              return (
                <div key={style} className="relative bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <div className="text-3xl mb-1">{STYLE_EMOJI[style]}</div>
                  <p className="text-xs text-gray-600 leading-tight">{t(`styles.${style}`)}</p>
                  <span className={`absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded font-bold ${
                    isFree ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {isFree ? t('home.styles.freeTag') : t('home.styles.paidTag')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-600 to-purple-700 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">{t('home.cta.title')}</h2>
          <p className="text-brand-100">{t('home.cta.subtitle')}</p>
          <Link href={`/${locale}/generate`} className="inline-flex btn-primary bg-white text-brand-700 hover:bg-brand-50 px-8 py-4 text-lg">
            {t('home.cta.button')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
