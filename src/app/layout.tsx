import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FORMA — AI アバター生成',
  description: '写真を、芸術に。AIがあなたの肖像を高品位なアートスタイルに変換します。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
