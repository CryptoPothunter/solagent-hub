'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import HeroBackground from '@/components/HeroBackground';
import AgentTopology from '@/components/AgentTopology';
import AnimatedCounter from '@/components/AnimatedCounter';
import WalletButton from '@/components/WalletButton';
import DevnetStatus from '@/components/DevnetStatus';
import { useAgentStore } from '@/lib/agent-store';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const NAV_ITEMS = [
  { href: '/explorer', labelKey: 'nav.explorer', icon: '⬡', descKey: 'home.nav.explorer.desc' },
  { href: '/register', labelKey: 'nav.register', icon: '◈', descKey: 'home.nav.register.desc' },
  { href: '/orchestrate', labelKey: 'nav.orchestrate', icon: '◎', descKey: 'home.nav.orchestrate.desc' },
  { href: '/tools', labelKey: 'nav.tools', icon: '⚙', descKey: 'home.nav.tools.desc' },
];


export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { agents, taskCount, messageCount, solSettled } = useAgentStore();
  const { t } = useI18n();
  const { connection } = useConnection();
  const [onChainAccounts, setOnChainAccounts] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);

  // Query real on-chain registry count
  useEffect(() => {
    const REGISTRY = new PublicKey('1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p');
    connection.getProgramAccounts(REGISTRY, { dataSlice: { offset: 0, length: 0 } })
      .then(accounts => setOnChainAccounts(accounts.length))
      .catch(() => {});
  }, [connection]);

  const stats = [
    { label: t('home.stats.agents'), value: agents.length, suffix: onChainAccounts !== null ? ` (${onChainAccounts} on-chain)` : '', duration: 1200 },
    { label: t('home.stats.messages'), value: messageCount, suffix: '', duration: 1800 },
    { label: t('home.stats.tasks'), value: taskCount, suffix: '', duration: 1500 },
    { label: t('home.stats.sol'), value: solSettled, suffix: 'SOL', duration: 2000 },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <HeroBackground />
      {/* Header */}
      <header className="border-b border-[#2a2d3e] bg-[#0a0b0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-black">SA</div>
            <span className="text-lg font-bold tracking-tight">SolAgent Hub</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 font-mono">{t('home.devnet')}</span>
          </div>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex gap-1">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>
            <LanguageToggle />
            <WalletButton />
          </div>
          {/* Hamburger button */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-[#181924] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`block w-5 h-0.5 bg-[#9ca3af] transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#9ca3af] mt-1 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#9ca3af] mt-1 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#2a2d3e] bg-[#0a0b0f]/95 backdrop-blur-xl">
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium">{t(item.labelKey)}</div>
                    <div className="text-xs text-[#6b7280]">{t(item.descKey)}</div>
                  </div>
                </Link>
              ))}
              <div className="mt-3 px-4 flex items-center gap-3">
                <LanguageToggle />
                <WalletButton />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-[#00f0ff] text-sm font-mono mb-4 tracking-wider">{t('home.poweredBy')}</div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              {t('home.title1')}<br />
              <span className="bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] bg-clip-text text-transparent">
                {t('home.title2')}
              </span>
            </h1>
            <p className="text-lg text-[#9ca3af] max-w-2xl mb-10 leading-relaxed">
              {t('home.subtitle')}
            </p>
            <a
              href="https://github.com/solagent-hub/solagent-hub/blob/main/SAOP-SPEC.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-[#2a2d3e] text-xs font-mono text-[#9ca3af] hover:border-[#00f0ff]/50 hover:text-[#00f0ff] transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
              {t('home.saop.badge')}
            </a>
            <div className="flex gap-4">
              <Link href="/explorer"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#00a8b3] text-black font-semibold hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all">
                {t('home.explore')}
              </Link>
              <Link href="/register"
                className="px-6 py-3 rounded-lg border border-[#2a2d3e] text-[#e4e4e7] font-semibold hover:border-[#00f0ff]/50 hover:bg-[#181924] transition-all">
                {t('home.register')}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="gradient-border p-5">
                <div className="relative z-10">
                  <div className="text-2xl font-bold text-white">
                    {mounted ? (
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={stat.duration} />
                    ) : (
                      <span className="font-mono">{typeof stat.value === 'number' && stat.value % 1 !== 0 ? stat.value.toFixed(1) : stat.value}{stat.suffix && <span className="text-sm text-[#9ca3af] ml-1">{stat.suffix}</span>}</span>
                    )}
                  </div>
                  <div className="text-xs text-[#6b7280] mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Devnet Status Bar */}
        <DevnetStatus />

        {/* Feature Cards */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {NAV_ITEMS.map((item, i) => (
              <Link key={item.href} href={item.href}
                className={`group gradient-border p-6 hover:scale-[1.02] transition-all duration-300 ${mounted ? 'fade-in' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 150}ms` }}>
                <div className="relative z-10">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-[#00f0ff] transition-colors">{t(item.labelKey)}</h3>
                  <p className="text-sm text-[#6b7280]">{t(item.descKey)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Architecture — Interactive Topology */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold mb-2 text-center">{t('home.arch.title')}</h2>
          <p className="text-sm text-[#6b7280] text-center mb-8">{t('home.arch.subtitle')}</p>
          <AgentTopology
            activeMessages={[
              { from: 'Oracle Stream', to: 'Alpha Scout', type: 'task_response' },
              { from: 'Alpha Scout', to: 'Swift Trader', type: 'task_request' },
            ]}
            isRunning={mounted}
          />
          {/* Tech Stack */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="gradient-border p-4">
              <div className="relative z-10">
                <div className="text-xs font-mono text-[#00f0ff] font-semibold mb-2">{t('home.arch.identity.title')}</div>
                <div className="text-[11px] text-[#9ca3af] leading-relaxed">{t('home.arch.identity.desc')}</div>
              </div>
            </div>
            <div className="gradient-border p-4">
              <div className="relative z-10">
                <div className="text-xs font-mono text-[#8b5cf6] font-semibold mb-2">{t('home.arch.delegation.title')}</div>
                <div className="text-[11px] text-[#9ca3af] leading-relaxed">{t('home.arch.delegation.desc')}</div>
              </div>
            </div>
            <div className="gradient-border p-4">
              <div className="relative z-10">
                <div className="text-xs font-mono text-[#22c55e] font-semibold mb-2">{t('home.arch.a2a.title')}</div>
                <div className="text-[11px] text-[#9ca3af] leading-relaxed">{t('home.arch.a2a.desc')}</div>
              </div>
            </div>
            <div className="gradient-border p-4 md:col-span-3">
              <div className="relative z-10">
                <div className="text-xs font-mono text-[#f59e0b] font-semibold mb-2">{t('home.arch.saop.title')}</div>
                <div className="text-[11px] text-[#9ca3af] leading-relaxed">{t('home.arch.saop.desc')}</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2d3e] py-6 text-center text-xs text-[#6b7280]">
        {t('home.footer')}
      </footer>
    </div>
  );
}
