import type { Metadata, Viewport } from 'next';
import {
  Caveat,
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Inter,
  Playfair_Display,
} from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
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
    <html
      lang="id"
      className={`${inter.variable} ${cormorant.variable} ${playfair.variable} ${ibmPlexMono.variable} ${caveat.variable}`}
    >
      <body className="font-sans bg-wa-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
