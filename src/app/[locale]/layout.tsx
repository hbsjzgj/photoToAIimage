import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SessionProvider } from '@/components/SessionProvider';
import { PostHogProvider } from '@/components/PostHogProvider';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Noto_Sans_JP, Inter } from 'next/font/google';
import '../globals.css';

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

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ja' | 'en' | 'zh')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${noto.variable} ${inter.variable} font-sans bg-surface text-ink`}>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            <SessionProvider>{children}</SessionProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
