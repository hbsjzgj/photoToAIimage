# AI Avatar Generator

写真をAIカートゥンアバターに変換するWebアプリ。

## Tech Stack

- **Next.js 14** (App Router)
- **next-intl** – 日本語/英語/中国語
- **Prisma + SQLite** – ローカルDB
- **NextAuth.js** – 認証
- **Stripe** – 決済
- **Replicate** – AI画像生成
- **Tailwind CSS** – スタイリング

---

## ① セットアップ手順（コピペ実行）

### 1. 依存パッケージをインストール

```bash
cd /Users/hbsjzgj/workplace/photoToAIimage
npm install
```

### 2. 環境変数ファイルを作成

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて以下の値を設定（後述）。

### 3. データベースを初期化

```bash
npx prisma db push
npx prisma generate
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く。  
自動的に `/ja` にリダイレクトされます。

---

## ② 環境変数の設定方法

`.env.local` ファイルを編集します。

### NEXTAUTH_SECRET の生成

ターミナルで実行:

```bash
openssl rand -base64 32
```

出力された文字列を `NEXTAUTH_SECRET` に設定。

### Stripe の設定

1. https://dashboard.stripe.com にアクセス
2. 左メニュー「開発者」→「APIキー」からキーをコピー
3. `STRIPE_SECRET_KEY` と `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` に設定
4. 商品を3つ作成（スターター/クリエイター/プロ）
5. 各商品の「価格ID」（`price_...`）を各 `STRIPE_PRICE_*` に設定

**Stripe Webhook（本番環境）:**
```bash
# Stripe CLIをインストール後:
stripe listen --forward-to localhost:3000/api/webhook
# 表示される whsec_... を STRIPE_WEBHOOK_SECRET に設定
```

### Replicate の設定

1. https://replicate.com/account/api-tokens でAPIトークンを作成
2. `REPLICATE_API_TOKEN` に設定

**⚠️ AI生成をテストせずにUIだけ確認したい場合:**
```
NEXT_PUBLIC_DEMO_MODE="true"
```
を設定するとモック画像が返ります（Replicate不要）。

---

## ③ 言語の切り替え方法

- URL で切り替え: `/ja` / `/en` / `/zh`
- ヘッダー右上の言語スイッチャーでも切り替え可能
- デフォルトは日本語（`/ja`）

---

## ④ ページ一覧

| URL | 説明 |
|-----|------|
| `/ja` | ホーム（日本語） |
| `/ja/generate` | 画像生成ページ |
| `/ja/pricing` | 料金ページ |
| `/ja/dashboard` | ダッシュボード（要ログイン） |
| `/ja/auth` | ログイン/新規登録 |
| `/api/generate` | 生成API |
| `/api/checkout` | Stripe決済API |
| `/api/webhook` | Stripe Webhook |
| `/api/credits` | クレジット残高API |

---

## ⑤ 無料/有料ルール

### 無料プラン
- 1日3回まで
- 基本スタイル4種のみ
- 768x768出力
- 透かし入り
- 24時間保存

### 有料（クレジット制）
- 全14スタイル
- 1024x1024 / 1536x1536
- 透かしなし
- 30日間保存
- クレジットパック購入で使用可能

---

## ⑥ 本番デプロイ（Vercel推奨）

```bash
npm install -g vercel
vercel --prod
```

Vercelダッシュボードで環境変数を設定し、  
`DATABASE_URL` は PostgreSQL（Neon/Supabase推奨）に変更。

```
DATABASE_URL="postgresql://user:pass@host/db"
```

`prisma/schema.prisma` の provider を変更:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## ⑦ よくある問題

**Q: `npm run dev` でエラーが出る**  
A: `npx prisma generate` を実行してから再試行。

**Q: 画像生成が失敗する**  
A: `REPLICATE_API_TOKEN` が正しいか確認。またはデモモード（`NEXT_PUBLIC_DEMO_MODE=true`）で動作確認。

**Q: Stripeの決済後にクレジットが増えない**  
A: `STRIPE_WEBHOOK_SECRET` が設定されているか確認。ローカルでは `stripe listen` が必要。
