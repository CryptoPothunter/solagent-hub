'use client';

import { useMemo } from 'react';
import { AgentStoreProvider } from '@/lib/agent-store';
import { I18nProvider } from '@/lib/i18n';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';

const SOLANA_ENDPOINT = 'https://api.devnet.solana.com';

export default function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <I18nProvider>
          <AgentStoreProvider>{children}</AgentStoreProvider>
        </I18nProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
