'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Preset {
  id: string;
  name: string;
  styleId: string;
  outputSize: string;
  count: number;
  useCount: number;
  createdAt: string;
}

export default function PresetsPage() {
  const t = useTranslations('presets');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (!session?.user) return;
    fetch('/api/presets')
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []));
  }, [session?.user, status, router]);

  const deletePreset = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await fetch(`/api/presets/${id}`, { method: 'DELETE' });
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <main className="min-h-screen bg-surface py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-1">{t('title')}</h1>
        <p className="text-ink-muted text-sm mb-8">{t('subtitle')}</p>

        {presets.length === 0 ? (
          <div className="glass-card p-8 text-center text-ink-muted text-sm">{t('empty')}</div>
        ) : (
          <div className="space-y-3">
            {presets.map((p) => (
              <div key={p.id} className="glass-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{p.name}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {t('style')}: {p.styleId} · {t('size')}: {p.outputSize} · {t('count')}: {p.count}
                  </p>
                </div>
                <button
                  onClick={() => deletePreset(p.id)}
                  className="text-xs text-ink-muted hover:text-red-400 transition-colors shrink-0"
                >
                  {t('delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
