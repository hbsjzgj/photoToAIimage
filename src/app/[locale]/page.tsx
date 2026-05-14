import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import StyleCaseGrid from '@/components/StyleCaseGrid';
import { authOptions } from '@/lib/auth';

interface Props { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/${locale}/generate`);

  const t = await getTranslations();

  /* ── "How it works" steps ── */
  const steps = [
    {
      num: '01',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
      title: t('home.howItWorks.step1Title'),
      desc: t('home.howItWorks.step1Desc'),
    },
    {
      num: '02',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
      title: t('home.howItWorks.step2Title'),
      desc: t('home.howItWorks.step2Desc'),
    },
    {
      num: '03',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763" />
        </svg>
      ),
      title: locale === 'zh' ? '精修与调整' : locale === 'ja' ? 'カスタマイズ' : 'Refine',
      desc: locale === 'zh' ? '用自然语言告诉 AI 如何调整' : locale === 'ja' ? '自然言語でAIに調整を指示' : 'Tell AI how to refine in plain language',
    },
    {
      num: '04',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
      title: t('home.howItWorks.step3Title'),
      desc: t('home.howItWorks.step3Desc'),
    },
  ];

  /* ── Capabilities bar ── */
  const caps = locale === 'zh'
    ? [
        { label: '14 种独家风格', sub: '动漫 / 商务 / 杂志 / 情侣' },
        { label: '一键同款生成', sub: '选案例，上传照片，直接出图' },
        { label: '自然语言精修', sub: '用中文告诉 AI 怎么改' },
        { label: '可商用版权', sub: '生成结果归您所有' },
      ]
    : locale === 'ja'
    ? [
        { label: '14 種類のスタイル', sub: 'アニメ / ビジネス / ファッション' },
        { label: 'ワンクリック生成', sub: 'スタイルを選んで写真をアップ' },
        { label: '日本語で調整', sub: 'AIに自然言語で指示' },
        { label: '商用利用可能', sub: '生成画像はあなたのもの' },
      ]
    : [
        { label: '14 AI Styles', sub: 'Anime · Business · Fashion · Couple' },
        { label: 'One-click generation', sub: 'Pick a style, upload, done' },
        { label: 'Natural language refine', sub: 'Just describe what to change' },
        { label: 'Commercial rights', sub: 'All generated images are yours' },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background glows */}
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
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-gold/10 border border-gold/20 text-gold text-xs font-medium animate-fade-in"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
                {t('home.hero.badge')}
              </div>

              <div
                className="space-y-5 animate-fade-up"
                style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}
              >
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-light text-ink leading-[1.1] tracking-tight text-balance">
                  {locale === 'zh' ? (
                    <>
                      用一张照片，<br />
                      <span className="font-semibold text-gold">生成你的 AI 形象</span>套装
                    </>
                  ) : locale === 'ja' ? (
                    <>
                      1枚の写真から、<br />
                      <span className="font-semibold text-gold">AIアバター</span>を生成
                    </>
                  ) : (
                    <>
                      {t('home.hero.titlePart1')}<br />
                      <span className="font-semibold text-gold">{t('home.hero.titleHighlight')}</span>
                      {t('home.hero.titleSuffix')}
                    </>
                  )}
                </h1>
                <p className="text-ink-secondary text-lg leading-relaxed max-w-md font-light">
                  {locale === 'zh'
                    ? '职场头像、社交头像、动漫风、杂志封面、情侣头像，一次生成多款可商用形象素材。'
                    : locale === 'ja'
                    ? 'ビジネス写真、SNSアバター、アニメ風、雑誌風カバーなど、多様なスタイルに一括変換。'
                    : t('home.hero.subtitle')}
                </p>
              </div>

              {/* Use-case badges */}
              <div
                className="flex flex-wrap gap-2 animate-fade-up"
                style={{ animationDelay: '180ms', opacity: 0, animationFillMode: 'forwards' }}
              >
                {(locale === 'zh'
                  ? ['职场头像', '社交头像', '动漫风', '杂志封面', '情侣头像', '证件照']
                  : locale === 'ja'
                  ? ['ビジネス', 'SNS', 'アニメ', '雑誌風', 'カップル', '証明写真']
                  : ['Business', 'Social', 'Anime', 'Fashion', 'Couple', 'ID Photo']
                ).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs text-ink-muted
                               bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div
                className="flex flex-col sm:flex-row gap-3 animate-fade-up"
                style={{ animationDelay: '250ms', opacity: 0, animationFillMode: 'forwards' }}
              >
                <Link href={`/${locale}/generate`} className="btn-gold px-8 py-4 text-base">
                  {t('home.hero.ctaPrimary')}
                </Link>
                <a
                  href="#styles"
                  className="btn-ghost px-8 py-4 text-base"
                >
                  {locale === 'zh' ? '查看风格案例' : locale === 'ja' ? 'スタイルを見る' : 'Browse Styles'}
                </a>
              </div>

              <p
                className="text-xs text-ink-muted animate-fade-in"
                style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}
              >
                {t('home.hero.freeTrial')}
              </p>
            </div>

            {/* Right — carousel */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}
            >
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ── Capabilities bar ── */}
      <section className="py-12 px-6 border-y border-[rgba(255,255,255,0.06)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {caps.map(({ label, sub }) => (
            <div key={label} className="text-center space-y-1">
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-ink-muted">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-gold text-xs font-medium tracking-widest uppercase mb-4">Process</p>
            <h2 className="text-3xl lg:text-4xl font-light text-ink">{t('home.howItWorks.title')}</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(255,255,255,0.06)] rounded-3xl overflow-hidden">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-surface p-8 space-y-4 group hover:bg-surface-50 transition-colors duration-400"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-thin text-ink-muted/25 leading-none select-none">
                    {step.num}
                  </span>
                  <div className="text-gold/70 group-hover:text-gold transition-colors duration-300">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-base font-medium text-ink group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-ink-secondary text-sm leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Style case gallery ── */}
      <div id="styles">
        <StyleCaseGrid />
      </div>

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
