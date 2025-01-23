import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Navbar, ThemeProvider } from '@/components/common';
import { cn } from '@/lib/utils';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app'
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
