'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletButtonProps {
  onConnect?: (address: string) => void;
}

export default function WalletButton({ onConnect }: WalletButtonProps) {
  const { t } = useI18n();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [balance, setBalance] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingName, setConnectingName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const address = wallet.publicKey?.toBase58() ?? null;
  const truncated = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : '';

  // Fetch balance when connected
  useEffect(() => {
    if (!wallet.publicKey || !connection) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    connection.getBalance(wallet.publicKey).then((lamports) => {
      if (!cancelled) {
        setBalance((lamports / LAMPORTS_PER_SOL).toFixed(3));
      }
    }).catch(() => {
      if (!cancelled) setBalance(null);
    });
    return () => { cancelled = true; };
  }, [wallet.publicKey, connection]);

  // Notify parent on connect
  useEffect(() => {
    if (wallet.connected && address) {
      setShowModal(false);
      setConnectingName(null);
      onConnect?.(address);
    }
  }, [wallet.connected, address, onConnect]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showDropdown]);

  // Close modal on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDropdown(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelectWallet = useCallback(
    async (adapter: typeof wallet.wallets[number]) => {
      try {
        setConnectingName(adapter.adapter.name);
        wallet.select(adapter.adapter.name);
        // connect() is handled by autoConnect or we call it explicitly
        if (adapter.readyState === 'Installed') {
          await wallet.connect();
        }
      } catch {
        // User rejected or wallet not found — just reset
        setConnectingName(null);
      }
    },
    [wallet]
  );

  const handleDisconnect = useCallback(async () => {
    try {
      await wallet.disconnect();
    } catch {
      // ignore
    }
    setShowDropdown(false);
  }, [wallet]);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [address]);

  // Map wallet readyState to a user-friendly color/icon
  function walletMeta(w: typeof wallet.wallets[number]) {
    const colors: Record<string, string> = {
      Phantom: '#ab9ff2',
      Solflare: '#fc8c03',
      Coinbase: '#0052ff',
    };
    const icons: Record<string, string> = {
      Phantom: '\u{1F47B}',   // ghost
      Solflare: '\u{1F525}',  // fire
      Coinbase: '\u{1F4B0}',  // money bag
    };
    const name = w.adapter.name;
    return {
      color: colors[name] ?? '#8b5cf6',
      icon: icons[name] ?? '\u{1F4B0}',
    };
  }

  // Available wallets to show in the modal
  const availableWallets = wallet.wallets;

  // --- Connected state button ---
  if (wallet.connected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181924] border border-[#2a2d3e] hover:border-[#00f0ff]/40 transition-all text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          <span className="font-mono text-[#e4e4e7] text-xs">{truncated}</span>
          <span className="text-[#6b7280] text-[10px] font-mono">
            {balance !== null ? `${balance} SOL` : '... SOL'}
          </span>
          <svg
            className={`w-3 h-3 text-[#6b7280] transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#181924] border border-[#2a2d3e] shadow-xl shadow-black/40 z-[100] overflow-hidden">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs text-[#e4e4e7] hover:bg-[#1e2030] transition-colors"
            >
              <span className="text-sm">{copied ? '\u2713' : '\u{1F4CB}'}</span>
              {copied ? t('wallet.copied') : t('wallet.copy')}
            </button>
            <a
              href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 text-xs text-[#e4e4e7] hover:bg-[#1e2030] transition-colors"
            >
              <span className="text-sm">{'\u{1F517}'}</span>
              {t('wallet.viewExplorer')}
            </a>
            <div className="border-t border-[#2a2d3e]" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs text-[#ef4444] hover:bg-[#1e2030] transition-colors"
            >
              <span className="text-sm">{'\u23CF'}</span>
              {t('wallet.disconnect')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Disconnected state button ---
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="gradient-border px-4 py-2 text-sm font-semibold text-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all"
      >
        <span className="relative z-10">{t('wallet.connect')}</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-[#181924] border border-[#2a2d3e] shadow-2xl shadow-black/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h3 className="text-base font-semibold text-[#e4e4e7]">{t('wallet.selectTitle')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#6b7280] hover:text-white transition-colors text-lg leading-none"
              >
                {'\u2715'}
              </button>
            </div>
            <p className="px-6 text-xs text-[#6b7280] -mt-2 mb-4">
              {t('wallet.selectDesc')}
            </p>

            {/* Wallet options */}
            <div className="px-4 pb-6 space-y-2">
              {availableWallets.length === 0 && (
                <p className="text-xs text-[#6b7280] text-center py-4">
                  No wallet extensions detected. Please install Phantom, Solflare, or Coinbase Wallet.
                </p>
              )}
              {availableWallets.map((w) => {
                const meta = walletMeta(w);
                const isConnecting =
                  (wallet.connecting || connectingName === w.adapter.name) &&
                  connectingName === w.adapter.name;
                const notInstalled = w.readyState !== 'Installed';
                return (
                  <button
                    key={w.adapter.name}
                    onClick={() =>
                      !wallet.connecting && handleSelectWallet(w)
                    }
                    disabled={wallet.connecting && connectingName !== w.adapter.name}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[#2a2d3e] bg-[#0a0b0f] hover:border-[color:var(--wc)] hover:shadow-[0_0_16px_var(--wg)] transition-all disabled:opacity-40"
                    style={
                      {
                        '--wc': meta.color + '60',
                        '--wg': meta.color + '15',
                      } as React.CSSProperties
                    }
                  >
                    {w.adapter.icon ? (
                      <img
                        src={w.adapter.icon}
                        alt={w.adapter.name}
                        className="w-6 h-6 rounded"
                      />
                    ) : (
                      <span className="text-xl">{meta.icon}</span>
                    )}
                    <span className="flex-1 text-left text-sm font-medium text-[#e4e4e7]">
                      {w.adapter.name}
                      {notInstalled && (
                        <span className="ml-2 text-[10px] text-[#6b7280] font-normal">
                          (not installed)
                        </span>
                      )}
                    </span>
                    {isConnecting ? (
                      <span className="text-xs text-[#00f0ff] font-mono animate-pulse">
                        {t('wallet.connecting')}
                      </span>
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
