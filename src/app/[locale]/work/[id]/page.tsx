import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShareButtons } from '@/components/ShareButtons';

async function getWork(id: string) {
  return prisma.projectVariant.findFirst({
    where: { id, isPublic: true },
    include: {
      project: { select: { style: true, userId: true } },
    },
  });
}

async function getUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, avatarUrl: true },
  });
}

export async function generateMetadata({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const work = await getWork(id);
  if (!work) return { title: 'Not Found' };

  const t = await getTranslations({ locale, namespace: 'styles' });
  let styleName = work.project.style;
  try { styleName = t(work.project.style as Parameters<typeof t>[0]); } catch {}

  const title = work.title ?? `FORMA × ${styleName}`;
  const description = `FORMAで${styleName}に変換した作品です。あなたも試してみよう！`;

  return {
    title: `${title} | FORMA`,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: work.imageUrl, width: 1024, height: 1024 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [work.imageUrl],
    },
  };
}

export default async function WorkDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const work = await getWork(id);
  if (!work) notFound();

  const [user, tWork, tStyles] = await Promise.all([
    getUser(work.project.userId),
    getTranslations({ locale, namespace: 'work' }),
    getTranslations({ locale, namespace: 'styles' }),
  ]);

  let styleName = work.project.style;
  try { styleName = tStyles(work.project.style as Parameters<typeof tStyles>[0]); } catch {}

  const userHandle = user?.username ?? user?.name;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
            <Image
              src={work.imageUrl}
              alt={work.title ?? styleName}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-5">
            {work.title && (
              <h1 className="text-2xl font-bold text-ink">{work.title}</h1>
            )}
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]">
                {styleName}
              </span>
              <span>{tWork('likes', { count: work.likeCount })}</span>
            </div>

            {userHandle && (
              <Link
                href={user?.username ? `/${locale}/profile/${user.username}` : '#'}
                className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink transition-colors w-fit"
              >
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                       style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-surface)' }}>
                    {userHandle[0].toUpperCase()}
                  </div>
                )}
                <span>{tWork('by')} @{userHandle}</span>
              </Link>
            )}

            <div className="border-t border-[rgba(255,255,255,0.07)] pt-5">
              <p className="text-xs text-ink-muted mb-3">{tWork('share')}</p>
              <ShareButtons workId={work.id} styleName={styleName} />
            </div>

            <Link
              href={`/${locale}/generate?style=${work.project.style}`}
              className="btn-gold text-center py-3 rounded-xl text-sm font-semibold mt-2"
            >
              {tWork('tryStyle')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
