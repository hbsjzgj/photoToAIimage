import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function TermsPage() {
  const t = await getTranslations('terms');

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-light text-ink mb-2">{t('title')}</h1>
          <p className="text-ink-muted text-sm mb-12">{t('lastUpdated')}</p>

          <div className="space-y-8 text-ink-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">1. サービスの利用</h2>
              <p>FORMA（以下「本サービス」）は、AIを用いて写真をアートスタイルに変換するサービスです。本サービスを利用することで、以下の規約に同意したものとみなします。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">2. 利用資格</h2>
              <p>本サービスは18歳以上の方が利用できます。未成年者が利用する場合は、保護者の同意が必要です。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">3. 禁止事項</h2>
              <p>以下の行為を禁止します：他人の権利を侵害するコンテンツのアップロード、不正アクセス、スパム行為、本サービスの逆コンパイルまたは改変。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">4. 知的財産権</h2>
              <p>生成された画像の著作権はユーザーに帰属します。ただし、本サービスのシステム・デザイン・ブランドに関する知的財産権はFORMAに帰属します。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">5. クレジットと支払い</h2>
              <p>購入されたクレジットは有効期限なしで利用できます。返金は原則として対応しておりませんが、システム障害等による未消費クレジットについては個別に対応いたします。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">6. 免責事項</h2>
              <p>本サービスは現状有姿で提供されます。生成結果の品質について保証はいたしません。AIの特性上、期待通りの結果が得られない場合があります。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">7. 規約の変更</h2>
              <p>本規約は予告なく変更される場合があります。変更後の規約はサービス上に掲示した時点で効力を生じます。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
