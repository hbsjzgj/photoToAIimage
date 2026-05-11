'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AuthPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); setError(''); }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false
    });
    setLoading(false);
    if (result?.error) { setError(t('signin.error')); return; }
    router.push(`/${locale}/generate`);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(t(`errors.${data.error}`) || data.error); return; }
    setSuccess(t('signup.success'));
    setTab('signin');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="card w-full max-w-md space-y-6">
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-gray-100">
            {(['signin', 'signup'] as const).map((t_) => (
              <button
                key={t_}
                onClick={() => { setTab(t_); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t_ ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t_ === 'signin' ? t('signin.title') : t('signup.title')}
              </button>
            ))}
          </div>

          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signin.email')}</label>
                <input type="email" required className="input-field"
                  value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signin.password')}</label>
                <input type="password" required className="input-field"
                  value={form.password} onChange={(e) => update('password', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? '...' : t('signin.submit')}
              </button>
              <p className="text-center text-sm text-gray-500">
                {t('signin.noAccount')}{' '}
                <button type="button" onClick={() => setTab('signup')} className="text-brand-600 font-semibold hover:underline">
                  {t('signin.signupLink')}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.name')}</label>
                <input type="text" required className="input-field"
                  value={form.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.email')}</label>
                <input type="email" required className="input-field"
                  value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.password')}</label>
                <input type="password" required minLength={8} className="input-field"
                  value={form.password} onChange={(e) => update('password', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? '...' : t('signup.submit')}
              </button>
              <p className="text-center text-sm text-gray-500">
                {t('signup.hasAccount')}{' '}
                <button type="button" onClick={() => setTab('signin')} className="text-brand-600 font-semibold hover:underline">
                  {t('signup.signinLink')}
                </button>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
