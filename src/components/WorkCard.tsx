'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';

export interface WorkItem {
  id: string;
  imageUrl: string;
  title?: string | null;
  style: string;
  likeCount: number;
  liked?: boolean;
  user?: { username?: string | null; name?: string | null; avatarUrl?: string | null } | null;
  styleName: string;
}

export function WorkCard({ id, imageUrl, title, style, likeCount: initialLikeCount, liked: initialLiked = false, user, styleName }: WorkItem) {
  const { data: session } = useSession();
  const locale = useLocale();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [liking, setLiking] = useState(false);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (!session || liking) return;
    setLiking(true);
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      const res = await fetch(`/api/works/${id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    } finally {
      setLiking(false);
    }
  }

  const userHandle = user?.username ?? user?.name;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] flex flex-col">
      <Link href={`/${locale}/work/${id}`} className="block relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={title ?? styleName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-muted truncate">{title ?? styleName}</span>
          <button
            onClick={handleLike}
            disabled={!session || liking}
            title={session ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
            className={`flex items-center gap-1 text-xs shrink-0 transition-colors ${liked ? 'text-red-400' : 'text-ink-muted hover:text-red-400'} disabled:opacity-40`}
          >
            <span className="text-sm">{liked ? '♥' : '♡'}</span>
            <span>{likeCount}</span>
          </button>
        </div>
        {userHandle && (
          <Link
            href={user?.username ? `/${locale}/profile/${user.username}` : '#'}
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors w-fit"
          >
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={14} height={14} className="rounded-full object-cover" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-gold)]/30 flex items-center justify-center text-[8px]"
                   style={{ color: 'var(--color-gold)' }}>
                {userHandle[0].toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[100px]">@{userHandle}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
