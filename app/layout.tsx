import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhatsApp Dark Mode Generator',
  description: 'Buat konten video viral WhatsApp dengan AI Voice Over',
  keywords: ['whatsapp', 'content creator', 'viral', 'tiktok', 'ai voice'],
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
