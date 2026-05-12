import type { Metadata } from 'next';
import { Noto_Sans_JP, Inter } from 'next/font/google';
import './globals.css';

const noto = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FORMA — AI アバター生成',
  description: '写真を、芸術に。AIがあなたの肖像を高品位なアートスタイルに変換します。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body className={`${noto.variable} ${inter.variable} font-sans bg-surface text-ink`}>
        {children}
      </body>
    </html>
  );
}
