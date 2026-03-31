'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import WalletButton from '@/components/WalletButton';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { DEMO_AGENTS, DEMO_TASKS } from '@/lib/demo-data';
import type { A2AMessage, TaskRequest } from '@/lib/types';
import AgentTopology from '@/components/AgentTopology';
import ReasoningPanel from '@/components/ReasoningPanel';
import AgentTerminal from '@/components/AgentTerminal';
import { useAgentStore } from '@/lib/agent-store';
import { registerA2AWorker, sendA2ATask, getA2ATaskStatus, fetchAgentCard } from '@/lib/a2a-client';
import { getJupiterPrices, getJupiterQuote, formatQuoteSummary } from '@/lib/jupiter';
import { computeFlowDigest, buildVerificationTransaction, verifyOnChainDigest, type VerificationDigest } from '@/lib/verification';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';

// Orchestration scenario — messages + reasoning paired
interface ScenarioStep {
  delay: number;
  message: A2AMessage;
  log: string;
  reasoning?: { agentName: string; agentColor: string; thoughts: string[] };
}

function randomScenarioParams() {
  const price = +(170 + Math.random() * 40).toFixed(2);
  const rsi = +(22 + Math.random() * 12).toFixed(1);
  const change = +(2 + Math.random() * 5).toFixed(1);
  const confidence = +(0.78 + Math.random() * 0.15).toFixed(2);
  const exposure = Math.floor(20 + Math.random() * 15);
  const positionSize = +(1 + Math.random() * 2).toFixed(1);
  const slippage = +(0.05 + Math.random() * 0.2).toFixed(2);
  const filledPrice = +(price + (Math.random() - 0.5) * 2).toFixed(2);
  const settlementAmount = +(0.003 + Math.random() * 0.007).toFixed(4);
  return { price, rsi, change, confidence, exposure, positionSize, slippage, filledPrice, settlementAmount };
}

function buildScenarioScript(realPrice?: number, token?: string, action?: string, size?: number): ScenarioStep[] {
  const p = randomScenarioParams();
  if (realPrice !== undefined) {
    p.price = +realPrice.toFixed(2);
    p.filledPrice = +(realPrice + (Math.random() - 0.5) * 2).toFixed(2);
  }
  const tkn = token || 'SOL';
  const act = action || 'BUY';
  const sz = size || p.positionSize;
  if (size !== undefined) p.positionSize = +sz.toFixed(1);
  const confPct = Math.round(p.confidence * 100);
  const newExposure = +(p.exposure + p.positionSize * 2.1).toFixed(1);
  return [
    {
      delay: 0,
      message: { id: 's1', from: 'Oracle Stream', to: 'Alpha Scout', type: 'task_response', payload: { feed: `${tkn}/USDC`, price: p.price, rsi: p.rsi, macd: 'bullish_cross' }, timestamp: '' },
      log: `Oracle Stream → Alpha Scout: Price feed update (${tkn} $${p.price}, RSI ${p.rsi})`,
      reasoning: { agentName: 'Oracle Stream', agentColor: '#8b5cf6', thoughts: [
        'Pulling latest price data from Jupiter aggregator...',
        `${tkn}/USDC = $${p.price}, 24h change +${p.change}%`,
        `Computing RSI(14): ${p.rsi} — oversold territory`,
        'MACD histogram flipped positive — bullish crossover confirmed',
        'Broadcasting feed update to subscribed agents via A2A',
      ]},
    },
    {
      delay: 2000,
      message: { id: 's2', from: 'Alpha Scout', to: 'Alpha Scout', type: 'discovery', payload: { analysis: 'RSI oversold + MACD bullish crossover detected' }, timestamp: '' },
      log: 'Alpha Scout: Analyzing signals... RSI oversold + MACD crossover',
      reasoning: { agentName: 'Alpha Scout', agentColor: '#00f0ff', thoughts: [
        'Received price feed from Oracle Stream via A2A protocol',
        `RSI ${p.rsi} < 30 threshold → oversold signal active`,
        'MACD bullish crossover confirmed → momentum shifting up',
        `Combined signal confidence: ${confPct}% — exceeds 80% threshold`,
        `Decision: Generate ${act} signal for ${p.positionSize} ${tkn}. Routing to risk check first.`,
      ]},
    },
    {
      delay: 3500,
      message: { id: 's3', from: 'Alpha Scout', to: 'Sentinel Guard', type: 'task_request', payload: { action: 'risk_check', token: tkn, proposedAction: `${act} ${p.positionSize} ${tkn}` }, timestamp: '' },
      log: `Alpha Scout → Sentinel Guard: Risk check request (${act} ${p.positionSize} ${tkn})`,
    },
    {
      delay: 5000,
      message: { id: 's4', from: 'Sentinel Guard', to: 'Alpha Scout', type: 'task_response', payload: { approved: true, portfolioExposure: `${p.exposure}%`, maxAllowed: '40%', note: 'Within limits' }, timestamp: '' },
      log: `Sentinel Guard → Alpha Scout: Risk approved (exposure ${p.exposure}% < 40% limit)`,
      reasoning: { agentName: 'Sentinel Guard', agentColor: '#ef4444', thoughts: [
        'Incoming risk check from Alpha Scout via A2A task_request',
        `Checking portfolio exposure: ${tkn} current weight = ${p.exposure}%`,
        `After proposed trade: ${tkn} weight → ~${newExposure}% (< 40% hard limit)`,
        'No anomalous on-chain activity detected in last 24h',
        'APPROVED — risk level remains MEDIUM. Forwarding clearance.',
      ]},
    },
    {
      delay: 7000,
      message: { id: 's5', from: 'Alpha Scout', to: 'Swift Trader', type: 'task_request', payload: { action: 'execute_swap', pair: `${tkn}/USDC`, side: act.toLowerCase(), amount: p.positionSize, confidence: p.confidence, maxSlippage: 0.5 }, timestamp: '' },
      log: `Alpha Scout → Swift Trader: Execute ${act} ${p.positionSize} ${tkn} (confidence ${confPct}%)`,
    },
    {
      delay: 8500,
      message: { id: 's6', from: 'Swift Trader', to: 'Swift Trader', type: 'discovery', payload: { routing: 'Jupiter aggregator', route: `USDC→${tkn} via Raydium` }, timestamp: '' },
      log: 'Swift Trader: Routing via Jupiter aggregator...',
      reasoning: { agentName: 'Swift Trader', agentColor: '#22c55e', thoughts: [
        'Received execute_swap from Alpha Scout — risk pre-approved',
        `Querying Jupiter for best route: USDC → ${tkn}`,
        `Best route: Raydium pool, estimated price $${p.filledPrice}, slippage ${p.slippage}%`,
        'Signing transaction via Executive delegation → Asset Signer PDA',
        'Transaction submitted: 4Kz...7mN — awaiting confirmation...',
      ]},
    },
    {
      delay: 10000,
      message: { id: 's7', from: 'Swift Trader', to: 'Alpha Scout', type: 'task_response', payload: { executed: true, txSignature: '4Kz...7mN', filledPrice: p.filledPrice, slippage: p.slippage, fee: 0.005 }, timestamp: '' },
      log: `Swift Trader → Alpha Scout: Swap executed! Price $${p.filledPrice}`,
    },
    {
      delay: 11500,
      message: { id: 's8', from: 'Swift Trader', to: 'Sentinel Guard', type: 'task_request', payload: { update: 'portfolio_change', token: tkn, delta: `+${p.positionSize}`, newExposure: `${newExposure}%` }, timestamp: '' },
      log: `Swift Trader → Sentinel Guard: Portfolio update (${tkn} → ${newExposure}%)`,
    },
    {
      delay: 13000,
      message: { id: 's9', from: 'Sentinel Guard', to: 'Swift Trader', type: 'task_response', payload: { acknowledged: true, newRiskLevel: 'medium' }, timestamp: '' },
      log: 'Sentinel Guard: Acknowledged. Risk level: MEDIUM',
      reasoning: { agentName: 'Sentinel Guard', agentColor: '#ef4444', thoughts: [
        `Portfolio updated: ${tkn} exposure ${newExposure}%`,
        'Risk level re-assessed: MEDIUM (no change)',
        'All positions within configured limits. Monitoring continues.',
      ]},
    },
    {
      delay: 14500,
      message: { id: 's10', from: 'Alpha Scout', to: 'Alpha Scout', type: 'heartbeat', payload: { settled: true, reward: `${p.settlementAmount} SOL via Asset Signer wallet`, totalEarned: '0.127 SOL' }, timestamp: '' },
      log: `Settlement: ${p.settlementAmount} SOL paid to Alpha Scout via Asset Signer PDA`,
      reasoning: { agentName: 'Alpha Scout', agentColor: '#00f0ff', thoughts: [
        'Task flow complete — trade executed successfully',
        `Settlement: ${p.settlementAmount} SOL task fee received in Asset Signer wallet`,
        'Cumulative earnings: 0.127 SOL across 24 tasks today',
        'Returning to monitoring mode — awaiting next Oracle Stream update',
      ]},
    },
  ];
}

const AGENT_COLORS: Record<string, string> = {
  'Alpha Scout': '#00f0ff',
  'Swift Trader': '#22c55e',
  'Sentinel Guard': '#ef4444',
  'Oracle Stream': '#8b5cf6',
  'Mint Master': '#f59e0b',
};

interface ReasoningEvent {
  agentName: string;
  agentColor: string;
  thoughts: string[];
  timestamp: string;
}

export default function OrchestratePage() {
  const { t } = useI18n();
  const store = useAgentStore();
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [messages, setMessages] = useState<ScenarioStep[]>([]);
  const [reasoningEvents, setReasoningEvents] = useState<ReasoningEvent[]>([]);
  const [activeMessages, setActiveMessages] = useState<{from: string; to: string; type: string}[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const logRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<ScenarioStep[]>(buildScenarioScript());
  const [tab, setTab] = useState<'live' | 'tasks' | 'terminal' | 'protocol'>('live');
  const [taskCount, setTaskCount] = useState(0);
  const [solSettled, setSolSettled] = useState(0);
  const [showSettlementFloat, setShowSettlementFloat] = useState(false);
  const [verificationDigest, setVerificationDigest] = useState<VerificationDigest | null>(null);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [memoTxSignature, setMemoTxSignature] = useState<string | null>(null);
  const [memoTxStatus, setMemoTxStatus] = useState<'idle' | 'signing' | 'confirming' | 'confirmed' | 'error'>('idle');
  const [memoTxError, setMemoTxError] = useState<string | null>(null);
  const [onChainVerified, setOnChainVerified] = useState<boolean | null>(null);
  const [jupiterRoute, setJupiterRoute] = useState<string | null>(null);
  const [a2aReady, setA2aReady] = useState(false);
  const [a2aTaskIds, setA2aTaskIds] = useState<string[]>([]);
  const [customToken, setCustomToken] = useState('SOL');
  const [customAction, setCustomAction] = useState<'BUY' | 'SELL'>('BUY');
  const [customSize, setCustomSize] = useState(1.5);

  const submitMemoTx = async () => {
    if (!verificationDigest || !publicKey) return;
    setMemoTxStatus('signing');
    setMemoTxError(null);
    try {
      const tx = await buildVerificationTransaction(verificationDigest, publicKey);
      setMemoTxStatus('confirming');
      const signature = await sendTransaction(tx, connection);
      setMemoTxSignature(signature);
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      setMemoTxStatus('confirmed');
      // Verify on-chain
      setTimeout(async () => {
        try {
          const result = await verifyOnChainDigest(signature, verificationDigest);
          setOnChainVerified(result.verified);
        } catch {
          setOnChainVerified(null);
        }
      }, 3000);
    } catch (err: unknown) {
      setMemoTxStatus('error');
      setMemoTxError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  useEffect(() => {
    registerA2AWorker().then(ok => setA2aReady(ok));
  }, []);

  const startScenario = async () => {
    let realPrice: number | undefined;
    try {
      const prices = await getJupiterPrices([customToken]);
      if (prices[customToken]) {
        realPrice = prices[customToken];
      }
    } catch {
      // Fall back to random price
    }
    try {
      const quoteInput = customAction === 'BUY' ? 'USDC' : customToken;
      const quoteOutput = customAction === 'BUY' ? customToken : 'USDC';
      const quote = await getJupiterQuote({ inputSymbol: quoteInput, outputSymbol: quoteOutput, amount: 280_000_000 }); // 280 USDC in micro-units
      if (quote) {
        setJupiterRoute(formatQuoteSummary(quote, quoteInput, quoteOutput));
      }
    } catch {}
    scriptRef.current = buildScenarioScript(realPrice, customToken, customAction, customSize);
    setRunning(true);
    setStarted(true);
    setCompleted(false);
    setMessages([]);
    setReasoningEvents([]);
    setActiveMessages([]);
    setCurrentIdx(0);
    setTaskCount(0);
    setSolSettled(0);
    setVerificationDigest(null);
    setMemoTxSignature(null);
    setMemoTxStatus('idle');
    setMemoTxError(null);
    setOnChainVerified(null);
    setJupiterRoute(null);
  };

  useEffect(() => {
    const script = scriptRef.current;
    if (!running || currentIdx < 0 || currentIdx >= script.length) {
      if (currentIdx >= script.length) {
        setRunning(false);
        setCompleted(true);
        setActiveMessages([]);
        // Update global store with orchestration results
        store.incrementTasks();
        store.incrementMessages(script.length);
        store.addSolSettled(0.005 + Math.random() * 0.01);
        // Compute SAOP verification digest
        const flowId = `saop-${Date.now().toString(36)}`;
        const digestMessages = script.map(s => ({
          from: s.message.from,
          to: s.message.to,
          type: s.message.type,
          payload: s.message.payload as Record<string, unknown>,
          timestamp: s.message.timestamp,
        }));
        computeFlowDigest(flowId, digestMessages).then(digest => {
          setVerificationDigest(digest);
        }).catch(() => {});
      }
      return;
    }
    const baseDelay = currentIdx === 0 ? 500 : script[currentIdx].delay - script[currentIdx - 1].delay;

    const timer = setTimeout(() => {
      const item = script[currentIdx];
      const ts = new Date().toISOString().slice(11, 19);
      setMessages(prev => [...prev, { ...item, message: { ...item.message, timestamp: ts } }]);

      // Send real A2A HTTP request via ServiceWorker (visible in Network tab)
      if (a2aReady) {
        sendA2ATask({
          from: item.message.from,
          to: item.message.to,
          type: item.message.type,
          payload: item.message.payload as Record<string, unknown>,
        }).then(result => {
          if (result?.taskId) {
            setA2aTaskIds(prev => [...prev, result.taskId]);
          }
        });
      }

      // Update active topology connections
      setActiveMessages([{ from: item.message.from, to: item.message.to, type: item.message.type }]);

      // Track tasks and settlement
      if (item.message.type === 'task_request') {
        setTaskCount(c => c + 1);
      }
      if (item.message.type === 'heartbeat' && item.message.payload?.settled) {
        const reward = parseFloat(String(item.message.payload.reward) || '0.005') || 0.005;
        setSolSettled(s => parseFloat((s + reward).toFixed(4)));
        setShowSettlementFloat(true);
        setTimeout(() => setShowSettlementFloat(false), 2000);
      }

      // Add reasoning event if present
      if (item.reasoning) {
        setReasoningEvents(prev => [...prev, { ...item.reasoning!, timestamp: ts }]);
      }

      setCurrentIdx(i => i + 1);
    }, baseDelay);

    return () => clearTimeout(timer);
  }, [running, currentIdx]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2a2d3e] bg-[#0a0b0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-black">SA</div>
            <span className="text-lg font-bold">SolAgent Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1">
              <Link href="/explorer" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.explorer')}</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.register')}</Link>
              <Link href="/orchestrate" className="px-4 py-2 rounded-lg text-sm text-[#00f0ff] bg-[#00f0ff]/10">{t('nav.orchestrate')}</Link>
              <Link href="/tools" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.tools')}</Link>
            </nav>
            <LanguageToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Orchestration Stats Counter */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181924] border border-[#2a2d3e]">
            <span className="text-[10px] text-[#6b7280] font-mono">{t('orch.tasks')}</span>
            <span className="text-sm font-mono font-bold text-[#00f0ff]">{taskCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181924] border border-[#2a2d3e]">
            <span className="text-[10px] text-[#6b7280] font-mono">{t('orch.solSettled')}</span>
            <span className="text-sm font-mono font-bold text-[#22c55e]">{solSettled.toFixed(3)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('orch.title')}</h1>
            <p className="text-sm text-[#6b7280]">{t('orch.subtitle')}</p>
          </div>
        </div>

        {/* Live Topology Visualization */}
        <div className="mb-6">
          <AgentTopology activeMessages={activeMessages} isRunning={running} />
        </div>

        {/* Start Orchestration Button */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {/* Custom Scenario Config */}
          {!running && (
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#6b7280]">TOKEN</label>
                <select value={customToken} onChange={e => setCustomToken(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e] text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]/50">
                  {['SOL', 'JUP', 'BONK', 'WIF', 'RAY'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#6b7280]">ACTION</label>
                <select value={customAction} onChange={e => setCustomAction(e.target.value as 'BUY' | 'SELL')}
                  className="px-2 py-1.5 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e] text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]/50">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#6b7280]">SIZE</label>
                <input type="number" value={customSize} onChange={e => setCustomSize(+e.target.value || 1)} step={0.1} min={0.1} max={100}
                  className="w-20 px-2 py-1.5 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e] text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]/50" />
              </div>
            </div>
          )}
          {!started && !running && (
            <p className="text-[#6b7280] text-sm">{t('orch.clickToWatch')}</p>
          )}
          <button
            onClick={startScenario}
            disabled={running}
            className={`px-8 py-3 rounded-lg font-semibold text-black transition-all ${
              running
                ? 'bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] opacity-80 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-105'
            }`}
          >
            {running ? t('orch.running') : completed ? t('orch.replay') : t('orch.start')}
          </button>
        </div>

        <div className="flex gap-1 mb-6">
          {([
            { id: 'live' as const, labelKey: 'orch.tab.live' },
            { id: 'tasks' as const, labelKey: 'orch.tab.tasks' },
            { id: 'terminal' as const, labelKey: 'orch.tab.terminal' },
            { id: 'protocol' as const, labelKey: 'orch.tab.protocol' },
          ]).map(({ id: tabId, labelKey }) => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${
                tab === tabId ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20' :
                'text-[#6b7280] hover:text-[#9ca3af] border border-transparent'
              }`}>
              {t(labelKey)}
            </button>
          ))}
        </div>

        {tab === 'live' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* A2A Message Feed */}
            <div className="gradient-border relative">
              {/* Settlement float animation */}
              {showSettlementFloat && (
                <div className="absolute -top-2 right-4 z-30 animate-float-up pointer-events-none">
                  <span className="px-3 py-1.5 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e] text-sm font-mono font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    +0.005 SOL
                  </span>
                </div>
              )}
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  {running && <div className="pulse-dot" />}
                  <span className="text-xs font-mono text-[#6b7280]">{t('orch.feed.title')}</span>
                  <span className="text-[10px] ml-auto text-[#6b7280] font-mono">{messages.length} {t('orch.feed.messages')}</span>
                </div>

                <div ref={logRef} className="bg-[#0a0b0f] rounded-lg p-4 h-[480px] overflow-y-auto space-y-2">
                  {messages.length === 0 && !running && (
                    <div className="flex items-center justify-center h-full text-[#6b7280] text-sm">
                      {t('orch.feed.empty')}
                    </div>
                  )}
                  {messages.map((item, i) => {
                    const fromColor = AGENT_COLORS[item.message.from] || '#9ca3af';
                    return (
                      <div key={i} className="fade-in flex gap-3 py-2 border-b border-[#2a2d3e]/50 last:border-0">
                        <span className="text-[10px] font-mono text-[#6b7280] w-16 shrink-0 pt-0.5">{item.message.timestamp}</span>
                        <div className="flex-1">
                          <div className="text-xs text-[#9ca3af] leading-relaxed">
                            {item.log.includes('→') ? (
                              <>
                                <span style={{ color: fromColor }} className="font-semibold">{item.message.from}</span>
                                <span className="text-[#6b7280]"> → </span>
                                <span style={{ color: AGENT_COLORS[item.message.to] || '#9ca3af' }} className="font-semibold">{item.message.to}</span>
                                <span className="text-[#9ca3af]">: {item.log.split(': ').slice(1).join(': ')}</span>
                              </>
                            ) : (
                              <span>{item.log}</span>
                            )}
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-[#6b7280] bg-[#12131a] rounded px-2 py-1">
                            {JSON.stringify(item.message.payload)}
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded h-fit ${
                          item.message.type === 'task_request' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' :
                          item.message.type === 'task_response' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                          item.message.type === 'heartbeat' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                          'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        }`}>
                          {item.message.type.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                  {running && messages.length > 0 && (
                    <div className="text-xs text-[#6b7280] typing pl-[76px]">{t('orch.feed.processing')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Reasoning Panel */}
            <div style={{ height: 560 }}>
              <ReasoningPanel events={reasoningEvents} isRunning={running} />
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            {/* User-registered agents */}
            {store.agents.length > 12 && (
              <div className="mb-4 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-[#22c55e]">Your Registered Agents</span>
                </div>
                <div className="space-y-2">
                  {store.agents.slice(12).map((agent, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e]">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22c55e]/20 to-[#00f0ff]/20 flex items-center justify-center text-sm">
                        🤖
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{agent.metadata.name}</div>
                        <div className="text-[10px] font-mono text-[#6b7280]">{agent.assetPublicKey}</div>
                      </div>
                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e]">registered</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {DEMO_TASKS.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}

        {tab === 'terminal' && (
          <AgentTerminal customAgents={store.agents.slice(5).map(a => ({ name: a.metadata.name, description: a.metadata.description }))} />
        )}

        {tab === 'protocol' && (
          <div className="space-y-4">
            {/* Transparency Notice */}
            <div className="rounded-xl bg-[#181924] border border-[#2a2d3e] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span className="text-xs font-semibold text-[#f59e0b]">Reference Implementation Notice</span>
              </div>
              <p className="text-[11px] text-[#9ca3af] leading-relaxed">
                Messages follow the <a href="https://google.github.io/A2A/" target="_blank" rel="noopener noreferrer" className="text-[#00f0ff] hover:underline">Google A2A Protocol</a> specification format.
                In this reference implementation, messages are locally simulated to demonstrate the orchestration flow.
                In a production deployment, these would be HTTP POST requests between agent endpoints with cryptographic signatures.
              </p>
            </div>

            {/* A2A ServiceWorker Status */}
            <div className={`rounded-xl border p-4 ${a2aReady ? 'bg-[#22c55e]/5 border-[#22c55e]/30' : 'bg-[#181924] border-[#2a2d3e]'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${a2aReady ? 'bg-[#22c55e] animate-pulse' : 'bg-[#6b7280]'}`} />
                <span className={`text-xs font-semibold ${a2aReady ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                  A2A Protocol Layer — {a2aReady ? 'ServiceWorker Active' : 'Initializing...'}
                </span>
              </div>
              <p className="text-[11px] text-[#9ca3af] leading-relaxed">
                {a2aReady
                  ? `Real HTTP requests are being sent via ServiceWorker to /a2a/tasks/send — visible in browser Network tab (filter: "a2a"). ${a2aTaskIds.length} tasks dispatched this session.`
                  : 'ServiceWorker is registering. A2A HTTP requests will be available shortly.'
                }
              </p>
            </div>

            {/* A2A Message Schema */}
            <div className="rounded-xl bg-[#0d0e14] border border-[#2a2d3e] p-5">
              <h4 className="text-sm font-semibold text-white mb-3">A2A Message Schema</h4>
              <div className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-4 overflow-x-auto">
                <pre className="text-[11px] font-mono text-[#9ca3af] leading-relaxed whitespace-pre">{`// A2A Protocol Message (Google A2A v0.3.0)
interface A2AMessage {
  id: string;                    // Unique message identifier
  from: string;                  // Sender agent name/ID
  to: string;                    // Recipient agent name/ID
  type: "task_request"           // Request a task execution
      | "task_response"          // Return task result
      | "discovery"              // Agent capability announcement
      | "heartbeat";             // Health/status ping
  payload: Record<string, any>;  // Task-specific data
  timestamp: string;             // ISO 8601 timestamp
}

// SAOP Extension: Verification Digest
interface SAOPDigest {
  flowId: string;                // Unique orchestration flow ID
  messageCount: number;          // Total messages in flow
  sha256Hex: string;             // SHA-256 of canonical messages
  memoPayload: string;           // "SAOP:v1:<flowId>:<sha256>"
}

// Memo Program Instruction (Solana)
// Program: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
// Data: UTF-8 encoded memoPayload string`}</pre>
              </div>
            </div>

            {/* Raw Messages from Current Flow */}
            {messages.length > 0 && (
              <div className="rounded-xl bg-[#0d0e14] border border-[#2a2d3e] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">Raw A2A Messages ({messages.length})</h4>
                  <button
                    onClick={() => {
                      const raw = messages.map(m => ({
                        id: m.message.id,
                        from: m.message.from,
                        to: m.message.to,
                        type: m.message.type,
                        payload: m.message.payload,
                        timestamp: m.message.timestamp,
                      }));
                      navigator.clipboard.writeText(JSON.stringify(raw, null, 2));
                    }}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-[#181924] border border-[#2a2d3e] text-[#6b7280] hover:text-white hover:border-[#00f0ff]/30 transition-all"
                  >
                    Copy All JSON
                  </button>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {messages.map((item, i) => (
                    <div key={i} className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-[#6b7280]">#{i + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.message.type === 'task_request' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' :
                          item.message.type === 'task_response' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                          item.message.type === 'heartbeat' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                          'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        }`}>
                          {item.message.type}
                        </span>
                        <span className="text-[10px] font-mono text-[#6b7280]">{item.message.timestamp}</span>
                      </div>
                      <pre className="text-[10px] font-mono text-[#9ca3af] leading-relaxed whitespace-pre overflow-x-auto">{JSON.stringify({
                        id: item.message.id,
                        from: item.message.from,
                        to: item.message.to,
                        type: item.message.type,
                        payload: item.message.payload,
                        timestamp: item.message.timestamp,
                      }, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.length === 0 && (
              <div className="text-center py-12 text-[#6b7280] text-sm">
                Run the orchestration scenario to see raw A2A protocol messages here
              </div>
            )}
          </div>
        )}

        {/* SAOP Verification Digest Panel */}
        {verificationDigest && (
          <div className="mt-8 rounded-xl bg-[#0d0e14] border border-[#2a2d3e] p-6 shadow-[0_0_40px_rgba(0,240,255,0.05)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-black">&#x2713;</div>
              <h3 className="text-lg font-bold text-white">SAOP Verification</h3>
              {memoTxStatus === 'confirmed' && onChainVerified === true && (
                <span className="ml-auto px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#22c55e]/20 border border-[#22c55e]/30 text-[#22c55e]">
                  On-Chain Verified
                </span>
              )}
              {memoTxStatus === 'confirmed' && onChainVerified === false && (
                <span className="ml-auto px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444]">
                  Verification Mismatch
                </span>
              )}
              {memoTxStatus !== 'confirmed' && (
                <span className="ml-auto px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-gradient-to-r from-[#00f0ff]/20 to-[#8b5cf6]/20 border border-[#00f0ff]/30 text-[#00f0ff]">
                  SAOP v0.1.0
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">Flow ID</span>
                  <p className="text-sm font-mono text-[#00f0ff] mt-0.5">{verificationDigest.flowId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">Message Count</span>
                  <p className="text-sm font-mono text-white mt-0.5">{verificationDigest.messageCount}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">SHA-256 Digest</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-mono text-[#8b5cf6] truncate">{verificationDigest.sha256Hex.slice(0, 16)}...{verificationDigest.sha256Hex.slice(-8)}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(verificationDigest.sha256Hex)}
                      className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono text-[#6b7280] hover:text-white bg-[#181924] border border-[#2a2d3e] hover:border-[#00f0ff]/30 transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">Memo Payload</span>
                  <p className="text-sm font-mono text-[#9ca3af] mt-0.5 break-all">{verificationDigest.memoPayload}</p>
                </div>
              </div>
            </div>

            {/* Jupiter Route Display */}
            {jupiterRoute && (
              <div className="mt-4 pt-4 border-t border-[#2a2d3e]">
                <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">Jupiter Quote Route</span>
                <p className="text-xs font-mono text-[#22c55e] mt-1">{jupiterRoute}</p>
              </div>
            )}

            {/* On-Chain Submission Section */}
            <div className="mt-5 pt-5 border-t border-[#2a2d3e]">
              {!publicKey && (
                <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  <span>Connect wallet to submit verification digest to Solana Devnet</span>
                </div>
              )}

              {publicKey && memoTxStatus === 'idle' && (
                <button
                  onClick={submitMemoTx}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#8b5cf6] text-black text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
                >
                  Submit Verification to Solana
                </button>
              )}

              {memoTxStatus === 'signing' && (
                <div className="flex items-center gap-3 text-sm text-[#f59e0b]">
                  <div className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
                  Waiting for wallet signature...
                </div>
              )}

              {memoTxStatus === 'confirming' && (
                <div className="flex items-center gap-3 text-sm text-[#00f0ff]">
                  <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                  Confirming on Solana Devnet...
                </div>
              )}

              {memoTxStatus === 'error' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#ef4444]">
                    <span>Transaction failed</span>
                  </div>
                  {memoTxError && <p className="text-[11px] font-mono text-[#6b7280]">{memoTxError}</p>}
                  <button onClick={submitMemoTx} className="text-xs text-[#00f0ff] hover:underline">Retry</button>
                </div>
              )}

              {memoTxStatus === 'confirmed' && memoTxSignature && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-sm text-[#22c55e] font-semibold">Transaction Confirmed</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider">Transaction Signature</span>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs font-mono text-[#00f0ff]">{memoTxSignature.slice(0, 20)}...{memoTxSignature.slice(-8)}</p>
                      <a
                        href={`https://explorer.solana.com/tx/${memoTxSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-[#8b5cf6] hover:underline"
                      >
                        Solana Explorer
                      </a>
                      <a
                        href={`https://solscan.io/tx/${memoTxSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-[#8b5cf6] hover:underline"
                      >
                        Solscan
                      </a>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-[#6b7280]">
                    Memo data &quot;{verificationDigest.memoPayload.slice(0, 30)}...&quot; is now permanently recorded on Solana Devnet.
                    Anyone can independently verify the orchestration flow by recomputing the SHA-256 digest and comparing it to the on-chain memo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TaskRow({ task }: { task: TaskRequest }) {
  const fromAgent = DEMO_AGENTS.find(a => a.assetPublicKey === task.fromAgent);
  const toAgent = DEMO_AGENTS.find(a => a.assetPublicKey === task.toAgent);

  const statusStyles: Record<string, string> = {
    pending: 'bg-[#f59e0b]/10 text-[#f59e0b]',
    running: 'bg-[#00f0ff]/10 text-[#00f0ff]',
    completed: 'bg-[#22c55e]/10 text-[#22c55e]',
    failed: 'bg-[#ef4444]/10 text-[#ef4444]',
    accepted: 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
  };

  return (
    <div className="gradient-border p-4">
      <div className="relative z-10 flex items-center gap-4">
        <div className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${statusStyles[task.status] || ''}`}>
          {task.status}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold" style={{ color: AGENT_COLORS[fromAgent?.metadata.name || ''] }}>
              {fromAgent?.metadata.name || task.fromAgent.slice(0, 12)}
            </span>
            <span className="text-[#6b7280]">→</span>
            <span className="font-semibold" style={{ color: AGENT_COLORS[toAgent?.metadata.name || ''] }}>
              {toAgent?.metadata.name || task.toAgent.slice(0, 12)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#6b7280] mt-1">
            {task.taskType} • {task.reward} SOL reward
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-[#6b7280]">{task.id}</div>
          {task.result && (
            <div className="text-[10px] font-mono text-[#22c55e] mt-1 max-w-[200px] truncate">
              {JSON.stringify(task.result).slice(0, 40)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
