import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'SolAgent Hub — Agent-to-Agent Orchestration on Solana',
  description:
    'Discover, register, and orchestrate autonomous AI agents on Solana. Built on Metaplex Agent Registry with A2A protocol.',
  openGraph: {
    type: 'website',
    title: 'SolAgent Hub — Agent-to-Agent Orchestration on Solana',
    description:
      'Discover, register, and orchestrate autonomous AI agents on Solana. Built on Metaplex Agent Registry with A2A protocol.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'SolAgent Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolAgent Hub — Agent-to-Agent Orchestration on Solana',
    description:
      'Discover, register, and orchestrate autonomous AI agents on Solana. Built on Metaplex Agent Registry with A2A protocol.',
    images: ['/og-image.svg'],
  },
  other: {
    'theme-color': '#0a0b0f',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
