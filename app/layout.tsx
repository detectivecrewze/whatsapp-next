import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WA Story Studio',
  description: 'Studio lokal untuk membuat video chat vertikal dengan AI dan Remotion',
  keywords: ['whatsapp', 'content creator', 'viral', 'tiktok', 'ai voice'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1117',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans bg-wa-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
