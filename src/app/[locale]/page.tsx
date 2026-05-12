import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import StyleShowcase from '@/components/StyleShowcase';

interface Props { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations();

  const steps = [
    { num: '01', title: t('home.howItWorks.step1Title'), desc: t('home.howItWorks.step1Desc') },
    { num: '02', title: t('home.howItWorks.step2Title'), desc: t('home.howItWorks.step2Desc') },
    { num: '03', title: t('home.howItWorks.step3Title'), desc: t('home.howItWorks.step3Desc') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full
                          bg-gold/4 blur-[120px] opacity-60" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full
                          bg-white/2 blur-[100px] opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left — copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                              bg-gold/10 border border-gold/20 text-gold text-xs font-medium
                              animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
                AI スタイル変換
              </div>

              <div className="space-y-4 animate-fade-up" style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-light text-ink leading-[1.1] tracking-tight text-balance">
                  写真を、<br />
                  <span className="font-semibold text-gold">芸術</span>に。
                </h1>
                <p className="text-ink-secondary text-lg lg:text-xl leading-relaxed max-w-md font-light">
                  {t('home.hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-up"
                   style={{ animationDelay: '250ms', opacity: 0, animationFillMode: 'forwards' }}>
                <Link href={`/${locale}/generate`} className="btn-gold px-8 py-4 text-base">
                  {t('home.hero.ctaPrimary')}
                </Link>
                <Link href={`/${locale}/pricing`} className="btn-ghost px-8 py-4 text-base">
                  {t('home.hero.ctaSecondary')}
                </Link>
              </div>

              <p className="text-xs text-ink-muted animate-fade-in"
                 style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
                1日3回無料 · クレジットカード不要
              </p>
            </div>

            {/* Right — carousel */}
            <div className="animate-fade-up"
                 style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-gold text-xs font-medium tracking-widest uppercase mb-4">Process</p>
            <h2 className="text-3xl lg:text-4xl font-light text-ink">{t('home.howItWorks.title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.06)] rounded-3xl overflow-hidden">
            {steps.map((step, i) => (
              <div key={step.num}
                   className="bg-surface p-10 space-y-4 hover:bg-surface-50 transition-colors duration-400 group">
                <span className="text-5xl font-thin text-ink-muted/30 leading-none tracking-tight select-none">
                  {step.num}
                </span>
                <h3 className="text-lg font-medium text-ink group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-ink-secondary text-sm leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Style Showcase ── */}
      <StyleShowcase />

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-16 text-center space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
            <div className="relative space-y-4">
              <h2 className="text-3xl lg:text-4xl font-light text-ink">{t('home.cta.title')}</h2>
              <p className="text-ink-secondary font-light">{t('home.cta.subtitle')}</p>
            </div>
            <div className="relative">
              <Link href={`/${locale}/generate`} className="btn-gold px-10 py-4 text-base">
                {t('home.cta.button')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
