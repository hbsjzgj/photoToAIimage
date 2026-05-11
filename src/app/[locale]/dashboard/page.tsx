import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCredits } from '@/lib/credits';
import { getFreeUsage, remainingFree } from '@/lib/usage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Props { params: Promise<{ locale: string }> }

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect(`/${locale}/auth`);

  const userId = (session.user as { id: string }).id;
  const t = await getTranslations('dashboard');
  const tc = await getTranslations('pricing.credits');

  const [credits, freeUsed, projects] = await Promise.all([
    getCredits(userId),
    getFreeUsage(userId),
    prisma.project.findMany({
      where: { userId },
      include: { variants: { take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ]);

  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('title')}</h1>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-4xl font-black text-brand-600">{credits}</div>
              <div className="text-sm text-gray-500 mt-1">{t('credits.title')}</div>
              <Link href={`/${locale}/pricing`} className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                {t('credits.buy')}
              </Link>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-black text-green-600">{remainingFree(freeUsed)}</div>
              <div className="text-sm text-gray-500 mt-1">今日の残り無料生成</div>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-black text-gray-700">{projects.length}</div>
              <div className="text-sm text-gray-500 mt-1">{t('stats.totalGenerated')}</div>
            </div>
          </div>

          {/* Recent generations */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('history.title')}</h2>
            {projects.length === 0 ? (
              <p className="text-gray-400 text-center py-8">{t('history.empty')}</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {projects.map((p) => {
                  const isExpired = new Date(p.expiresAt) < new Date();
                  const imageUrl = p.variants[0]?.imageUrl;
                  return (
                    <div key={p.id} className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                      <div className="aspect-square bg-gray-100 relative">
                        {imageUrl && !isExpired ? (
                          <img src={imageUrl} alt={p.style} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                            {isExpired ? '⏰' : '🖼️'}
                          </div>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">{p.style}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isExpired ? 'bg-gray-100 text-gray-400' :
                          p.generationMode === 'paid' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isExpired ? t('history.expired') : p.generationMode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction history */}
          {transactions.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t('credits.history')}</h2>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-700">{tx.description}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
