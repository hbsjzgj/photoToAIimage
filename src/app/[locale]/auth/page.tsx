'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { analytics } from '@/lib/analytics';

export default function AuthPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl');
  const callbackUrl = rawCallback && rawCallback.startsWith('/') && !rawCallback.startsWith('//')
    ? rawCallback
    : `/${locale}/generate`;

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (result?.error) { setError(t('signin.error')); return; }
    analytics.loginCompleted();
    router.push(callbackUrl);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(t(`errors.${data.error}`) || data.error); return; }
    analytics.signupCompleted();
    setSuccess(t('signup.success'));
    setTab('signin');
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-16 py-12 px-6">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="relative w-12 h-12 rounded-2xl bg-gold/90 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <span className="text-surface font-black text-lg select-none">F</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/forma-icon.png"
                alt="FORMA"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-xl font-medium text-ink">FORMA</h1>
            <p className="text-ink-muted text-sm mt-1">
              {tab === 'signin' ? t('signin.subtitle') : t('signup.subtitle')}
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            {/* Tabs */}
            <div className="flex rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-1">
              {(['signin', 'signup'] as const).map((t_) => (
                <button
                  key={t_}
                  onClick={() => { setTab(t_); setError(''); setSuccess(''); }}
                  className={`relative flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-300
                              ${tab === t_ ? 'text-ink' : 'text-ink-muted hover:text-ink-secondary'}`}
                >
                  {tab === t_ && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.10)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    {t_ === 'signin' ? t('signin.title') : t('signup.title')}
                  </span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  {success}
                </motion.div>
              )}
              {error && (
                <motion.div
                  className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {tab === 'signin' ? (
                <motion.form
                  key="signin"
                  onSubmit={handleSignIn}
                  className="space-y-4"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Field label={t('signin.email')} type="email" value={form.email} onChange={(v) => update('email', v)} />
                  <Field label={t('signin.password')} type="password" value={form.password} onChange={(v) => update('password', v)} />
                  <SubmitBtn loading={loading} label={t('signin.submit')} />
                  <p className="text-center text-xs text-ink-muted">
                    {t('signin.noAccount')}{' '}
                    <button type="button" onClick={() => setTab('signup')} className="text-gold hover:text-gold-light transition-colors">
                      {t('signin.signupLink')}
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  onSubmit={handleSignUp}
                  className="space-y-4"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Field label={t('signup.name')} type="text" value={form.name} onChange={(v) => update('name', v)} />
                  <Field label={t('signup.email')} type="email" value={form.email} onChange={(v) => update('email', v)} />
                  <Field label={t('signup.password')} type="password" value={form.password} onChange={(v) => update('password', v)} minLength={8} />
                  <SubmitBtn loading={loading} label={t('signup.submit')} />
                  <p className="text-center text-xs text-ink-muted">
                    {t('signup.hasAccount')}{' '}
                    <button type="button" onClick={() => setTab('signin')} className="text-gold hover:text-gold-light transition-colors">
                      {t('signup.signinLink')}
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, type, value, onChange, minLength }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-ink-muted font-medium tracking-wide">{label}</label>
      <input
        type={type}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="btn-gold w-full py-3.5 mt-2"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.div
            className="w-4 h-4 rounded-full border-2 border-surface/30 border-t-surface"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
          処理中…
        </span>
      ) : label}
    </motion.button>
  );
}
