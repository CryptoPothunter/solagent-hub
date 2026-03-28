'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

interface DevnetData {
  slot: number | null;
  version: string | null;
}

export default function DevnetStatus() {
  const { t } = useI18n();
  const [data, setData] = useState<DevnetData>({ slot: null, version: null });
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const PROGRAM_ID = '1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p';
  const RPC_URL = 'https://api.devnet.solana.com';

  const fetchStatus = useCallback(async () => {
    try {
      const [slotRes, versionRes] = await Promise.all([
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
        }),
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getVersion' }),
        }),
      ]);

      const slotJson = await slotRes.json();
      const versionJson = await versionRes.json();

      setData({
        slot: slotJson.result ?? null,
        version: versionJson.result?.['solana-core'] ?? null,
      });
      setConnected(true);
      setError(false);
    } catch {
      setConnected(false);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-10">
      <div className="rounded-lg border border-[#2a2d3e] bg-[#0a0b0f] px-4 py-2.5 flex items-center gap-4 overflow-x-auto font-mono text-xs">
        {/* Status indicator */}
        {connected ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-green-400 font-semibold">{t('devnet.connected')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
            </span>
            <span className="text-yellow-400 font-semibold">
              {loading ? t('devnet.connecting') : t('devnet.unavailable')}
            </span>
          </div>
        )}

        {/* Error retry */}
        {error && !loading && (
          <button
            onClick={fetchStatus}
            className="shrink-0 px-2.5 py-1 rounded border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors text-[10px] font-semibold uppercase tracking-wider"
          >
            {t('devnet.retry')}
          </button>
        )}

        {/* Divider */}
        {connected && <div className="w-px h-4 bg-[#2a2d3e] shrink-0" />}

        {/* Slot */}
        {connected && data.slot !== null && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[#6b7280]">Slot</span>
            <span className="text-[#00f0ff]">{data.slot.toLocaleString()}</span>
          </div>
        )}

        {/* Version */}
        {connected && data.version && (
          <>
            <div className="w-px h-4 bg-[#2a2d3e] shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[#6b7280]">Solana</span>
              <span className="text-[#00f0ff]">v{data.version}</span>
            </div>
          </>
        )}

        {/* Program ID */}
        {connected && (
          <>
            <div className="w-px h-4 bg-[#2a2d3e] shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[#6b7280]">Registry</span>
              <span className="text-[#00f0ff] truncate max-w-[140px] sm:max-w-none" title={PROGRAM_ID}>
                {PROGRAM_ID}
              </span>
            </div>
          </>
        )}

        {/* LIVE badge */}
        {connected && (
          <>
            <div className="flex-1" />
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              LIVE
            </span>
          </>
        )}
      </div>
    </div>
  );
}
