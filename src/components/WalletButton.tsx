'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

const FAKE_ADDRESS = '7xK3dR8Nv2qLm5Wp4TgYs6JbCe1FhUo9mPq';
const FAKE_BALANCE = '2.847';
const TRUNCATED = '7xK3...9mPq';

interface WalletInfo {
  name: string;
  color: string;
  icon: string;
}

const WALLETS: WalletInfo[] = [
  { name: 'Phantom', color: '#ab9ff2', icon: '👻' },
  { name: 'Solflare', color: '#fc8c03', icon: '🔥' },
  { name: 'Backpack', color: '#e33e3f', icon: '🎒' },
];

interface WalletButtonProps {
  onConnect?: (address: string) => void;
}

export default function WalletButton({ onConnect }: WalletButtonProps) {
  const { t } = useI18n();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelectWallet = useCallback(async (wallet: WalletInfo) => {
    setConnecting(true);
    setConnectingWallet(wallet.name);
    await new Promise((r) => setTimeout(r, 1500));
    setConnecting(false);
    setConnectingWallet(null);
    setShowModal(false);
    setConnected(true);
    onConnect?.(FAKE_ADDRESS);
  }, [onConnect]);

  const handleDisconnect = useCallback(() => {
    setConnected(false);
    setShowDropdown(false);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(FAKE_ADDRESS).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  // --- Connected state button ---
  if (connected) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181924] border border-[#2a2d3e] hover:border-[#00f0ff]/40 transition-all text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          <span className="font-mono text-[#e4e4e7] text-xs">{TRUNCATED}</span>
          <span className="text-[#6b7280] text-[10px] font-mono">{FAKE_BALANCE} SOL</span>
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
              <span className="text-sm">{copied ? '✓' : '📋'}</span>
              {copied ? t('wallet.copied') : t('wallet.copy')}
            </button>
            <a
              href={`https://explorer.solana.com/address/${FAKE_ADDRESS}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 text-xs text-[#e4e4e7] hover:bg-[#1e2030] transition-colors"
            >
              <span className="text-sm">🔗</span>
              {t('wallet.viewExplorer')}
            </a>
            <div className="border-t border-[#2a2d3e]" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs text-[#ef4444] hover:bg-[#1e2030] transition-colors"
            >
              <span className="text-sm">⏏</span>
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
                ✕
              </button>
            </div>
            <p className="px-6 text-xs text-[#6b7280] -mt-2 mb-4">
              {t('wallet.selectDesc')}
            </p>

            {/* Wallet options */}
            <div className="px-4 pb-6 space-y-2">
              {WALLETS.map((wallet) => {
                const isConnecting = connecting && connectingWallet === wallet.name;
                return (
                  <button
                    key={wallet.name}
                    onClick={() => !connecting && handleSelectWallet(wallet)}
                    disabled={connecting && connectingWallet !== wallet.name}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[#2a2d3e] bg-[#0a0b0f] hover:border-[color:var(--wc)] hover:shadow-[0_0_16px_var(--wg)] transition-all disabled:opacity-40"
                    style={
                      {
                        '--wc': wallet.color + '60',
                        '--wg': wallet.color + '15',
                      } as React.CSSProperties
                    }
                  >
                    <span className="text-xl">{wallet.icon}</span>
                    <span className="flex-1 text-left text-sm font-medium text-[#e4e4e7]">{wallet.name}</span>
                    {isConnecting ? (
                      <span className="text-xs text-[#00f0ff] font-mono animate-pulse">{t('wallet.connecting')}</span>
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: wallet.color }}
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
