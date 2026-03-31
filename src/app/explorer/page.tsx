'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAgentStore } from '@/lib/agent-store';
import WalletButton from '@/components/WalletButton';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import type { OnChainAgent } from '@/lib/types';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const AGENT_REGISTRY_PROGRAM = new PublicKey('1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p');

function AgentCard({ agent }: { agent: OnChainAgent }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const m = agent.metadata;
  const statusColor = m.active ? 'bg-green-500' : 'bg-red-400';
  const statusText = m.active ? t('common.active') : t('common.inactive');

  return (
    <div className="gradient-border group hover:scale-[1.01] transition-all duration-200">
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#8b5cf6]/20 border border-[#2a2d3e] flex items-center justify-center text-lg">
              {(() => {
                const icons: Record<string, string> = {
                  'Alpha Scout': '🔍',
                  'Swift Trader': '⚡',
                  'Sentinel Guard': '🛡️',
                  'Oracle Stream': '📡',
                  'Mint Master': '🎨',
                  'Yield Harvester': '🌾',
                  'Gov Delegate': '🏛️',
                  'Bridge Runner': '🌉',
                  'Liquidity Prime': '💧',
                  'Airdrop Scanner': '🪂',
                  'Social Intel': '📣',
                  'Compli Bot': '🔒',
                };
                return icons[m.name] || '🤖';
              })()}
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-[#00f0ff] transition-colors">{m.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                <span className="text-[10px] text-[#6b7280] font-mono">{statusText}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-white">{agent.walletBalance} SOL</div>
            <div className="text-[10px] text-[#6b7280]">{t('explorer.assetSigner')}</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#9ca3af] leading-relaxed mb-3 line-clamp-2">{m.description}</p>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {m.services.map((s, i) => (
            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
              s.name === 'A2A' ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20' :
              s.name === 'MCP' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20' :
              'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
            }`}>
              {s.name}{s.version ? ` v${s.version}` : ''}
            </span>
          ))}
        </div>

        {/* Trust */}
        <div className="flex gap-1.5 mb-3">
          {m.supportedTrust.map((trust, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#181924] text-[#6b7280] border border-[#2a2d3e]">
              {trust}
            </span>
          ))}
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-[#00f0ff] hover:text-white transition-colors font-mono"
        >
          {expanded ? '▼ ' + t('explorer.hideDetails') : '▶ ' + t('explorer.onchainDetails')}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[#2a2d3e] space-y-1.5 text-[10px] font-mono text-[#6b7280]">
            <div className="flex justify-between">
              <span>Asset</span>
              <span className="text-[#9ca3af]">{agent.assetPublicKey}</span>
            </div>
            <div className="flex justify-between">
              <span>Identity PDA</span>
              <span className="text-[#9ca3af]">{agent.identityPda}</span>
            </div>
            <div className="flex justify-between">
              <span>Wallet PDA</span>
              <span className="text-[#9ca3af]">{agent.walletPda}</span>
            </div>
            <div className="flex justify-between">
              <span>Registry</span>
              <span className="text-[#00f0ff]">solana:101:metaplex</span>
            </div>
            {agent.delegatedTo && (
              <div className="flex justify-between">
                <span>Executive</span>
                <span className="text-[#8b5cf6]">{agent.delegatedTo}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>ERC-8004</span>
              <span className="text-[#9ca3af] truncate max-w-[200px]">{agent.registrationUri}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const { t } = useI18n();
  const { agents } = useAgentStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'a2a' | 'mcp'>('all');
  const [search, setSearch] = useState('');
  const { connection } = useConnection();
  const [onChainCount, setOnChainCount] = useState<number | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [querying, setQuerying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function queryRegistry() {
      setQuerying(true);
      try {
        // Query all accounts owned by the Agent Registry program
        // This discovers real registered agents on Devnet
        const accounts = await connection.getProgramAccounts(AGENT_REGISTRY_PROGRAM, {
          dataSlice: { offset: 0, length: 0 }, // We only need count, not data
        });
        if (!cancelled) {
          setOnChainCount(accounts.length);
          setQueryError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setOnChainCount(null);
          setQueryError('Could not query Agent Registry');
        }
      } finally {
        if (!cancelled) setQuerying(false);
      }
    }
    queryRegistry();
    return () => { cancelled = true; };
  }, [connection]);

  const filtered = agents.filter(a => {
    if (filter === 'active' && !a.metadata.active) return false;
    if (filter === 'a2a' && !a.metadata.services.some(s => s.name === 'A2A')) return false;
    if (filter === 'mcp' && !a.metadata.services.some(s => s.name === 'MCP')) return false;
    if (search && !a.metadata.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.metadata.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2d3e] bg-[#0a0b0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-black">SA</div>
            <span className="text-lg font-bold">SolAgent Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1">
              <Link href="/explorer" className="px-4 py-2 rounded-lg text-sm text-[#00f0ff] bg-[#00f0ff]/10">{t('nav.explorer')}</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.register')}</Link>
              <Link href="/orchestrate" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.orchestrate')}</Link>
              <Link href="/tools" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.tools')}</Link>
            </nav>
            <LanguageToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('explorer.title')}</h1>
          <p className="text-sm text-[#6b7280]">{t('explorer.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text" placeholder={t('explorer.search')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#181924] border border-[#2a2d3e] text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00f0ff]/50"
          />
          <div className="flex gap-2">
            {(['all', 'active', 'a2a', 'mcp'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                  filter === f ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30' :
                  'bg-[#181924] text-[#6b7280] border border-[#2a2d3e] hover:border-[#6b7280]'
                }`}>
                {f === 'all' ? t('explorer.filter.all') : f === 'active' ? t('explorer.filter.active') : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* On-Chain Registry Status */}
        <div className="mb-6 rounded-xl bg-[#0d0e14] border border-[#2a2d3e] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${querying ? 'bg-[#f59e0b] animate-pulse' : onChainCount !== null ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
              <span className="text-xs font-mono text-[#9ca3af]">
                {querying ? 'Querying Metaplex Agent Registry on Devnet...' :
                 onChainCount !== null ? `Devnet Registry: ${onChainCount} on-chain account${onChainCount !== 1 ? 's' : ''} found` :
                 queryError || 'Registry query failed'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#6b7280]">Program: 1DREG...2B2p</span>
              <a
                href="https://explorer.solana.com/address/1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-[#8b5cf6] hover:underline"
              >
                View on Explorer
              </a>
            </div>
          </div>
          {onChainCount !== null && onChainCount > 0 && (
            <p className="mt-2 text-[11px] text-[#6b7280]">
              Showing {agents.length} demo agents below. On-chain registered agents will be integrated with DAS API indexer.
            </p>
          )}
          {onChainCount === 0 && (
            <p className="mt-2 text-[11px] text-[#6b7280]">
              No agents currently registered on Devnet via this program. Showing {agents.length} demo agents for reference.
            </p>
          )}
        </div>

        {/* Agent Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <AgentCard key={agent.assetPublicKey} agent={agent} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#6b7280]">{t('explorer.noResults')}</div>
        )}

        {/* Registry Info */}
        <div className="mt-12 gradient-border p-6">
          <div className="relative z-10">
            <h3 className="text-sm font-semibold mb-3 text-[#00f0ff]">{t('explorer.howTitle')}</h3>
            <div className="grid md:grid-cols-3 gap-6 text-xs text-[#9ca3af]">
              <div>
                <div className="font-mono text-[#e4e4e7] mb-1">{t('explorer.how1.title')}</div>
                <p>{t('explorer.how1.desc')}</p>
              </div>
              <div>
                <div className="font-mono text-[#e4e4e7] mb-1">{t('explorer.how2.title')}</div>
                <p>{t('explorer.how2.desc')}</p>
              </div>
              <div>
                <div className="font-mono text-[#e4e4e7] mb-1">{t('explorer.how3.title')}</div>
                <p>{t('explorer.how3.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
