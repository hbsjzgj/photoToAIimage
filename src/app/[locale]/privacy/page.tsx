import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-light text-ink mb-2">{t('title')}</h1>
          <p className="text-ink-muted text-sm mb-12">{t('lastUpdated')}</p>

          <div className="space-y-8 text-ink-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">1. 収集する情報</h2>
              <p>本サービスでは以下の情報を収集します：メールアドレスおよびパスワード（ハッシュ化）、アップロードされた写真（生成処理後に削除）、利用履歴・クレジット残高、IPアドレス（無料利用制限のため）。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">2. 情報の利用目的</h2>
              <p>収集した情報は、サービス提供・改善、不正利用の防止、カスタマーサポートのみに使用します。第三者への販売・提供は行いません。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">3. 写真データの取り扱い</h2>
              <p>アップロードされた写真はAI処理にのみ使用され、処理完了後にサーバーから削除されます。生成された画像はユーザーのダッシュボードに最大30日間保存されます。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">4. Cookieとセッション</h2>
              <p>ログイン状態の維持のためにセッションCookieを使用します。分析・広告目的のCookieは使用しません。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">5. 決済情報</h2>
              <p>決済はStripeを通じて処理されます。カード番号等の決済情報は本サービスのサーバーには保存されません。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">6. 情報の開示</h2>
              <p>法的義務がある場合を除き、お客様の個人情報を第三者に開示することはありません。</p>
            </section>
            <section>
              <h2 className="text-lg font-medium text-ink mb-3">7. お問い合わせ</h2>
              <p>プライバシーに関するお問い合わせは、サービス内のContactフォームよりご連絡ください。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
