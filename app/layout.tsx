import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CALAMITAS AI — Bir Dakika, Bir Hayat', template: '%s' },
  description: 'Uydu ve hava görüntülerini müdahale planına dönüştüren yapay zekâ destekli afet karar sistemi.',
  metadataBase: new URL('https://calamitas-ai.gptpluslm40.chatgpt.site'),
  icons: {
    icon: '/brand/calamitas-logo-compact.png',
    shortcut: '/brand/calamitas-logo-compact.png',
    apple: '/brand/calamitas-logo-compact.png',
  },
  openGraph: {
    title: 'CALAMITAS AI — Bir Dakika, Bir Hayat',
    description: 'Afet verisini saha kararına dönüştüren yapay zekâ destekli sistem.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'CALAMITAS AI — Bir Dakika, Bir Hayat' }],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('calamitas-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
