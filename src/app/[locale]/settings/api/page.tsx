'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';

interface APIKeyRecord {
  id: string;
  keyPrefix: string;
  name: string;
  monthlyLimit: number;
  usedThisMonth: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function APISettingsPage() {
  const t = useTranslations('apiSettings');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<APIKeyRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(100);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (!session?.user) return;
    fetch('/api/settings/apikeys').then((r) => r.json()).then((d) => setKeys(d.keys ?? []));
  }, [session?.user, status, router]);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch('/api/settings/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), monthlyLimit }),
      });
      const d = await r.json();
      if (d.key) {
        setCreatedKey(d.key);
        setNewKeyName('');
        fetch('/api/settings/apikeys').then((r) => r.json()).then((d) => setKeys(d.keys ?? []));
      }
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm(t('revokeConfirm'))) return;
    await fetch(`/api/settings/apikeys/${id}`, { method: 'DELETE' });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-surface py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-1">{t('title')}</h1>
        <p className="text-ink-muted text-sm mb-8">{t('subtitle')}</p>

        {/* Create new key */}
        <div className="glass-card p-5 mb-6">
          <div className="flex gap-3 mb-3">
            <input
              className="input-field text-sm flex-1"
              placeholder={t('keyNamePlaceholder')}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              maxLength={50}
            />
            <input
              type="number"
              className="input-field text-sm w-24"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(Number(e.target.value))}
              min={0}
              max={10000}
            />
          </div>
          <button
            disabled={creating || !newKeyName.trim()}
            onClick={createKey}
            className="btn-gold w-full text-sm"
          >
            {creating ? '…' : t('createKey')}
          </button>
        </div>

        {/* Created key display */}
        {createdKey && (
          <div className="glass-card p-4 mb-6 border border-green-500/30">
            <p className="text-xs text-green-400 mb-2">{t('created')}</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-black/30 rounded px-3 py-2 text-xs text-ink font-mono break-all">
                {createdKey}
              </code>
              <button onClick={() => copyKey(createdKey)} className="btn-ghost text-xs px-3">
                {copied ? t('copied') : t('copyKey')}
              </button>
            </div>
          </div>
        )}

        {/* Example curl */}
        <div className="glass-card p-4 mb-6">
          <p className="text-xs text-ink-muted mb-2">{t('exampleCurl')}</p>
          <pre className="text-xs text-ink-muted font-mono overflow-x-auto bg-black/20 rounded p-3 whitespace-pre-wrap">
{`curl -X POST https://your-domain.com/api/v1/generate \\
  -H "Authorization: Bearer fma_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"imageBase64":"...","style":"anime_basic"}'`}
          </pre>
        </div>

        {/* Existing keys */}
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="glass-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{k.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {t('prefix')}: <code>{k.keyPrefix}…</code>
                  {' · '}
                  {t('usageThisMonth', { used: k.usedThisMonth, limit: k.monthlyLimit || '∞' })}
                  {' · '}
                  {k.lastUsedAt ? t('lastUsed', { date: new Date(k.lastUsedAt).toLocaleDateString() }) : t('neverUsed')}
                </p>
              </div>
              <button
                onClick={() => revokeKey(k.id)}
                className="text-xs text-ink-muted hover:text-red-400 transition-colors shrink-0"
              >
                {t('revokeKey')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
