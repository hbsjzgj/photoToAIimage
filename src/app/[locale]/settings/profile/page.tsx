'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProfileSettingsPage() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth/signin`);
    if (status === 'authenticated') {
      fetch('/api/settings/profile')
        .then((r) => r.json())
        .then((d) => { setUsername(d.username ?? ''); setBio(d.bio ?? ''); });
    }
  }, [status, locale, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), bio: bio.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'usernameTaken' ? t('usernameTaken') : t('invalidUsername'));
      } else {
        setSuccess(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-ink mb-8">{t('editProfile')}</h1>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm text-ink-secondary mb-1.5">{t('usernameLabel')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('usernamePlaceholder')}
              className="input-field w-full"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary mb-1.5">{t('bioLabel')}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bioPlaceholder')}
              className="input-field w-full resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-ink-muted mt-1 text-right">{bio.length}/200</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{t('saveSuccess')}</p>}
          <button type="submit" disabled={saving} className="btn-gold py-2.5 rounded-xl font-medium">
            {saving ? '...' : t('saveProfile')}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
