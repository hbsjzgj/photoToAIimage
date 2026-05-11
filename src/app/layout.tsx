import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const noto = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'AI Avatar Generator',
  description: 'Transform your photos into stunning AI cartoon avatars'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${noto.variable} font-sans`}>{children}</body>
    </html>
  );
}
