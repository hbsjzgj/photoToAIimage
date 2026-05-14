'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ALL_STYLES } from '@/types';

interface ProjectVariant { id: string; imageUrl: string }
interface Project {
  id: string; style: string; generationMode: string;
  hasWatermark: boolean; expiresAt: string; createdAt: string;
  variants: ProjectVariant[];
}
interface Transaction { id: string; type: string; amount: number; description: string; createdAt: string }
interface DashboardData {
  credits: number; freeRemaining: number;
  projects: Project[]; transactions: Transaction[];
}

function ProjectCard({ project, locale, tStyles }: {
  project: Project;
  locale: string;
  tStyles: ReturnType<typeof useTranslations>;
}) {
  const [hovered, setHovered] = useState(false);
  const [activeVariant, setActiveVariant] = useState(0);
  const isExpired = new Date(project.expiresAt) < new Date();
  const imageUrl = project.variants[activeVariant]?.imageUrl;
  const hasMultiple = project.variants.length > 1;

  const styleLabel = (() => {
    try { return tStyles(project.style); } catch { return project.style.replace(/_/g, ' '); }
  })();

  function handleDownload() {
    if (!imageUrl || isExpired) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${project.style}-${project.id}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <motion.div
      className="group rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.07)]
                 bg-[rgba(255,255,255,0.02)] flex flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[rgba(255,255,255,0.03)]">
        {imageUrl && !isExpired ? (
          <img
            src={imageUrl}
            alt={styleLabel}
            className="w-full h-full object-cover object-top
                       group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3
                         bg-[rgba(255,255,255,0.02)]">
            <div className="w-12 h-12 rounded-xl border border-dashed border-[rgba(255,255,255,0.12)]
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-ink-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            {isExpired && (
              <span className="text-[10px] text-ink-muted/50 px-2 py-0.5 rounded-full
                               bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
                {locale === 'zh' ? '已过期' : locale === 'ja' ? '期限切れ' : 'Expired'}
              </span>
            )}
          </div>
        )}

        {/* Persistent gradient at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* FREE/PRO badge */}
        {!isExpired && (
          <span className={`absolute top-2.5 left-2.5 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full
            ${project.hasWatermark
              ? 'bg-emerald-500/20 border border-emerald-500/25 text-emerald-400'
              : 'bg-gold/15 border border-gold/20 text-gold'}`}>
            {project.hasWatermark ? 'FREE' : 'PRO'}
          </span>
        )}

        {/* Hover action strip — bottom only, non-obstructive */}
        <AnimatePresence>
          {hovered && !isExpired && imageUrl && (
            <motion.div
              className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 pb-2 pt-8
                         bg-gradient-to-t from-black/75 to-transparent"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                           bg-[rgba(255,255,255,0.15)] backdrop-blur-sm text-white text-[10px] font-medium
                           hover:bg-[rgba(255,255,255,0.25)] transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0L5 7m3 3l3-3M2 13h12"/>
                </svg>
                {locale === 'zh' ? '下载' : locale === 'ja' ? '保存' : 'Save'}
              </button>
              <Link
                href={`/${locale}/generate?style=${project.style}`}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg
                           bg-gold text-surface text-[10px] font-medium
                           hover:bg-gold/80 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5.5A4.5 4.5 0 118 10H3m0 0l2-2m-2 2l2 2"/>
                </svg>
                {locale === 'zh' ? '再生成' : locale === 'ja' ? '再生成' : 'Redo'}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Variant thumbnails */}
      {hasMultiple && !isExpired && (
        <div className="flex gap-1 px-2 pt-2">
          {project.variants.slice(0, 4).map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveVariant(i)}
              className={`flex-1 aspect-square rounded overflow-hidden border transition-all duration-150
                ${activeVariant === i
                  ? 'border-gold/60 shadow-[0_0_6px_rgba(200,169,107,0.3)]'
                  : 'border-[rgba(255,255,255,0.08)] opacity-50 hover:opacity-80'}`}
            >
              <img src={v.imageUrl} alt="" className="w-full h-full object-cover object-top" />
            </button>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink truncate">{styleLabel}</p>
          <p className="text-[10px] text-ink-muted">{new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        {isExpired && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-ink-muted flex-shrink-0">
            已过期
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('dashboard');
  const tStyles = useTranslations('styles');

  const [data, setData] = useState<DashboardData | null>(null);
  const [banner, setBanner] = useState<'success' | 'canceled' | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'credits'>('gallery');
  const [styleFilter, setStyleFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth`);
  }, [status, router, locale]);

  useEffect(() => {
    const s = searchParams.get('success');
    const c = searchParams.get('canceled');
    if (s === 'true') setBanner('success');
    else if (c === 'true') setBanner('canceled');
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/dashboard').then((r) => r.json()).then(setData);
  }, [status]);

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    if (styleFilter === 'all') return data.projects;
    return data.projects.filter((p) => p.style === styleFilter);
  }, [data, styleFilter]);

  const usedStyles = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.projects.map((p) => p.style));
    return ALL_STYLES.filter((s) => set.has(s));
  }, [data]);

  if (status === 'loading' || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'gallery' as const, zh: '生成结果', en: 'My Images', ja: '生成履歴' },
    { id: 'credits' as const, zh: '积分记录', en: 'Credits', ja: 'クレジット' },
  ];
  const tabLabel = (tab: typeof tabs[0]) =>
    locale === 'zh' ? tab.zh : locale === 'ja' ? tab.ja : tab.en;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Page title */}
          <div>
            <p className="text-gold text-xs font-medium tracking-widest uppercase mb-2">Account</p>
            <h1 className="text-3xl font-light text-ink">{t('title')}</h1>
          </div>

          {/* Banners */}
          <AnimatePresence>
            {banner === 'success' && (
              <motion.div
                className="glass-card p-5 border-emerald-500/20 bg-emerald-500/5 flex items-start justify-between gap-4"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-medium text-sm">{t('banner.successTitle')}</p>
                    <p className="text-ink-muted text-xs mt-0.5">{t('banner.successSubtitle')}</p>
                  </div>
                </div>
                <button onClick={() => setBanner(null)} className="text-ink-muted hover:text-ink transition-colors text-lg leading-none">×</button>
              </motion.div>
            )}
            {banner === 'canceled' && (
              <motion.div
                className="glass-card p-5 border-amber-500/20 bg-amber-500/5 flex items-start justify-between gap-4"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-amber-400 font-medium text-sm">{t('banner.canceledTitle')}</p>
                    <p className="text-ink-muted text-xs mt-0.5">{t('banner.canceledSubtitle')}</p>
                  </div>
                </div>
                <button onClick={() => setBanner(null)} className="text-ink-muted hover:text-ink transition-colors text-lg leading-none">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                value: data.credits,
                label: t('credits.title'),
                action: (
                  <Link href={`/${locale}/pricing`} className="text-gold text-xs hover:text-gold-light transition-colors mt-1 inline-block">
                    {t('credits.buy')}
                  </Link>
                )
              },
              { value: data.freeRemaining, label: t('stats.freeRemaining') },
              { value: data.projects.length, label: t('stats.totalGenerated') }
            ].map(({ value, label, action }, i) => (
              <motion.div
                key={i}
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-4xl font-light text-gold">{value}</div>
                <div className="text-xs text-ink-muted mt-1.5">{label}</div>
                {action}
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.04)] rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-[rgba(255,255,255,0.08)] text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'}`}
              >
                {tabLabel(tab)}
                {tab.id === 'gallery' && data.projects.length > 0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gold/15 text-gold">
                    {data.projects.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Gallery tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Style filter */}
              {usedStyles.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStyleFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${styleFilter === 'all'
                        ? 'bg-gold text-surface'
                        : 'bg-[rgba(255,255,255,0.05)] text-ink-muted border border-[rgba(255,255,255,0.07)] hover:text-ink'}`}
                  >
                    {locale === 'zh' ? '全部' : locale === 'ja' ? '全て' : 'All'}
                  </button>
                  {usedStyles.map((s) => {
                    let label: string;
                    try { label = tStyles(s); } catch { label = s.replace(/_/g, ' '); }
                    return (
                      <button
                        key={s}
                        onClick={() => setStyleFilter(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                          ${styleFilter === s
                            ? 'bg-gold text-surface'
                            : 'bg-[rgba(255,255,255,0.05)] text-ink-muted border border-[rgba(255,255,255,0.07)] hover:text-ink'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Project grid */}
              {filteredProjects.length === 0 ? (
                data.projects.length === 0 ? (
                  /* First-time user guidance card */
                  <motion.div
                    className="glass-card p-10 relative overflow-hidden"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/4 to-transparent pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row items-center gap-8">
                      {/* Placeholder portraits */}
                      <div className="flex -space-x-3 flex-shrink-0">
                        {['from-rose-600/40', 'from-purple-600/40', 'from-amber-500/40'].map((g, i) => (
                          <div key={i}
                            className={`w-16 h-20 rounded-xl border-2 border-surface bg-gradient-to-b ${g} to-surface/80
                                        flex items-end justify-center pb-2`}
                            style={{ zIndex: 3 - i, transform: `rotate(${(i - 1) * 4}deg)` }}
                          >
                            <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)]" />
                          </div>
                        ))}
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <h3 className="text-xl font-light text-ink mb-2">
                          {locale === 'zh' ? '生成你的第一套 AI 头像' : locale === 'ja' ? '最初のAIアバターを生成しよう' : 'Create your first AI avatar set'}
                        </h3>
                        <p className="text-ink-muted text-sm font-light mb-6 max-w-sm">
                          {locale === 'zh'
                            ? '上传一张照片，选择 14 种专属风格之一，AI 帮你生成可商用的形象素材。'
                            : locale === 'ja'
                            ? '写真1枚アップロードして、14種類のスタイルからAIアバターを生成しましょう。'
                            : 'Upload a photo, pick from 14 styles, and get commercial-ready portrait assets in seconds.'}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                          <Link href={`/${locale}/generate`}
                            className="btn-gold px-6 py-2.5 text-sm">
                            {locale === 'zh' ? '开始生成 →' : locale === 'ja' ? '今すぐ生成 →' : 'Start generating →'}
                          </Link>
                          <Link href={`/${locale}#styles`}
                            className="btn-ghost px-5 py-2.5 text-sm">
                            {locale === 'zh' ? '查看风格案例' : locale === 'ja' ? 'スタイルを見る' : 'Browse styles'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Style-filtered empty state */
                  <div className="glass-card py-14 text-center">
                    <p className="text-ink-muted text-sm mb-4">
                      {locale === 'zh' ? '该风格暂无记录' : locale === 'ja' ? 'このスタイルの履歴がありません' : 'No images for this style'}
                    </p>
                    <button
                      onClick={() => setStyleFilter('all')}
                      className="text-xs text-gold hover:text-gold-light transition-colors"
                    >
                      {locale === 'zh' ? '查看全部' : locale === 'ja' ? '全て表示' : 'Show all'}
                    </button>
                  </div>
                )
              ) : (
                <motion.div
                  key={styleFilter}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {filteredProjects.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    >
                      <ProjectCard project={p} locale={locale} tStyles={tStyles} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Credits tab */}
          {activeTab === 'credits' && (
            <div className="space-y-4">
              {data.transactions.length === 0 ? (
                <div className="glass-card py-16 text-center space-y-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/15
                                  flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4 text-gold/50" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 5.5v3M8 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-ink-muted text-sm">
                    {locale === 'zh' ? '暂无积分记录' : locale === 'ja' ? '取引履歴なし' : 'No credit history yet'}
                  </p>
                  <Link href={`/${locale}/pricing`}
                    className="text-xs text-gold hover:text-gold-light transition-colors inline-block">
                    {locale === 'zh' ? '购买积分 →' : locale === 'ja' ? '購入する →' : 'Buy credits →'}
                  </Link>
                </div>
              ) : (
                <div className="glass-card divide-y divide-[rgba(255,255,255,0.05)]">
                  {data.transactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      className="flex justify-between items-center px-6 py-4"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div>
                        <p className="text-sm text-ink-secondary">{tx.description}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-sm font-medium tabular-nums ${tx.amount > 0 ? 'text-emerald-400' : 'text-ink-muted'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
