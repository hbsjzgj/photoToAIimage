'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WorkCard, WorkItem } from '@/components/WorkCard';

interface ProfileData {
  user: {
    id: string; username: string; name: string; bio?: string; avatarUrl?: string;
    followerCount: number; followingCount: number;
  };
  works: (Omit<WorkItem, 'styleName' | 'liked'>)[];
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const t = useTranslations('profile');
  const tStyles = useTranslations('styles');
  const locale = useLocale();
  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    fetch(`/api/profile/${params.username}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: ProfileData) => {
        setData(d);
        setFollowing(d.isFollowing);
        setFollowerCount(d.user.followerCount);
      })
      .catch((s) => { if (s === 404) setNotFound(true); });
  }, [params.username]);

  async function handleFollow() {
    if (!session || !data) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? c - 1 : c + 1));
    try {
      await fetch(`/api/profile/${data.user.username}/follow`, { method: wasFollowing ? 'DELETE' : 'POST' });
    } catch {
      setFollowing(wasFollowing);
      setFollowerCount((c) => (wasFollowing ? c + 1 : c - 1));
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-ink-muted">User not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const styleNames = (style: string) => {
    try { return tStyles(style as Parameters<typeof tStyles>[0]); } catch { return style; }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 max-w-6xl mx-auto w-full">
        {!data ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="flex items-start gap-5 mb-10 flex-wrap">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[rgba(255,255,255,0.1)] shrink-0 flex items-center justify-center"
                   style={{ backgroundColor: 'var(--color-gold)' }}>
                {data.user.avatarUrl ? (
                  <Image src={data.user.avatarUrl} alt="" width={80} height={80} className="object-cover" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-surface)' }}>
                    {(data.user.username ?? data.user.name ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-ink">@{data.user.username ?? data.user.name}</h1>
                {data.user.bio && <p className="text-sm text-ink-muted mt-1">{data.user.bio}</p>}
                <div className="flex gap-4 mt-3 text-sm text-ink-secondary">
                  <span><strong className="text-ink">{data.works.length}</strong> {t('works')}</span>
                  <span><strong className="text-ink">{followerCount}</strong> {t('followers')}</span>
                  <span><strong className="text-ink">{data.user.followingCount}</strong> {t('following')}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {data.isOwnProfile ? (
                    <Link href={`/${locale}/settings/profile`} className="btn-ghost text-xs px-3 py-1.5 rounded-lg">
                      {t('editProfile')}
                    </Link>
                  ) : session && (
                    <button
                      onClick={handleFollow}
                      className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-colors ${
                        following
                          ? 'border border-[rgba(255,255,255,0.15)] text-ink-secondary hover:text-ink'
                          : 'btn-gold'
                      }`}
                    >
                      {following ? t('unfollow') : t('follow')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Works grid */}
            {data.works.length === 0 ? (
              <p className="text-center text-ink-muted py-16">{t('noWorks')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.works.map((w) => (
                  <WorkCard key={w.id} {...w} styleName={styleNames(w.style)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
