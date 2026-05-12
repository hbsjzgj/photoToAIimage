import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FORMA | AI Avatar Studio',
  description: 'Create premium AI avatars from your photos in seconds.',
  icons: {
    icon: '/brand/forma-icon.png',
    apple: '/brand/forma-icon.png',
  },
  openGraph: {
    title: 'FORMA | AI Avatar Studio',
    description: 'Create premium AI avatars from your photos in seconds.',
    siteName: 'FORMA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FORMA | AI Avatar Studio',
    description: 'Create premium AI avatars from your photos in seconds.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
