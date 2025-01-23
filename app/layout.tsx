import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Navbar, ThemeProvider } from '@/components/common';
import content from '@/content';
import { cn } from '@/lib/utils';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(content.url),
  title: {
    default: content.fullname,
    template: `%s | ${content.name}`
  },
  description: content.description,
  openGraph: {
    title: `${content.name}`,
    description: content.description,
    url: content.url,
    siteName: `${content.name}`,
    locale: 'en_US',
    type: 'website'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 }
  },
  twitter: { title: `${content.name}`, card: 'summary_large_image' },
  verification: {
    google: '',
    yandex: ''
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'flex min-h-screen flex-col items-center gap-10 bg-background text-primary antialiased transition',
          geistMono.variable,
          geistSans.variable,
          geistSans.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Navbar />
        </ThemeProvider>
      </body>
    </html>
  );
}
