'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---
interface TerminalLine {
  id: number;
  type: 'user' | 'agent' | 'system' | 'thinking';
  text: string;
  color?: string;
  timestamp: string;
  agentName?: string;
}

// --- Constants ---
const AGENT_COLORS: Record<string, string> = {
  'Alpha Scout': '#00f0ff',
  'Swift Trader': '#22c55e',
  'Sentinel Guard': '#ef4444',
  'Oracle Stream': '#8b5cf6',
};

const COMMANDS = [
  'help',
  'agents',
  'ask alpha scout analyze SOL',
  'ask sentinel check risk',
  'ask swift trader buy 1 SOL',
  'ask oracle stream price SOL',
  'orchestrate buy SOL',
  'status',
  'clear',
];

// --- Helpers ---
function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

let lineId = 0;
function mkLine(type: TerminalLine['type'], text: string, color?: string, agentName?: string): TerminalLine {
  return { id: ++lineId, type, text, color, timestamp: ts(), agentName };
}

// --- Pre-built responses ---
// placeholder, will be filled in component
function getHelpLines(): TerminalLine[] {
  return [
    mkLine('system', 'Available commands:'),
    mkLine('system', '  help                          — Show this help message'),
    mkLine('system', '  agents                        — List registered agents'),
    mkLine('system', '  ask alpha scout analyze SOL    — Alpha Scout market analysis'),
    mkLine('system', '  ask sentinel check risk        — Sentinel Guard risk assessment'),
    mkLine('system', '  ask swift trader buy 1 SOL     — Swift Trader trade execution'),
    mkLine('system', '  ask oracle stream price SOL    — Oracle Stream price feed'),
    mkLine('system', '  orchestrate buy SOL            — Full multi-agent orchestration'),
    mkLine('system', '  status                         — Agent wallet balances & tasks'),
    mkLine('system', '  clear                          — Clear terminal'),
  ];
}

function getAgentsLines(): TerminalLine[] {
  return [
    mkLine('system', 'Registered Agents (4):'),
    mkLine('agent', '  [ONLINE]  Alpha Scout      — Market analysis & signal detection', '#00f0ff', 'Alpha Scout'),
    mkLine('agent', '  [ONLINE]  Swift Trader     — DEX trade execution via Jupiter', '#22c55e', 'Swift Trader'),
    mkLine('agent', '  [ONLINE]  Sentinel Guard   — Portfolio risk management', '#ef4444', 'Sentinel Guard'),
    mkLine('agent', '  [ONLINE]  Oracle Stream    — Real-time price feed aggregator', '#8b5cf6', 'Oracle Stream'),
  ];
}

function getAnalyzeLines(): TerminalLine[] {
  return [
    mkLine('agent', '[Alpha Scout] Running technical analysis on SOL/USDC...', '#00f0ff', 'Alpha Scout'),
    mkLine('agent', '  Price:       $187.23 (+3.2% 24h)', '#00f0ff'),
    mkLine('agent', '  RSI(14):     28.4 — OVERSOLD', '#00f0ff'),
    mkLine('agent', '  MACD:        Bullish crossover confirmed', '#00f0ff'),
    mkLine('agent', '  Volume:      $1.24B (24h, +18% above avg)', '#00f0ff'),
    mkLine('agent', '  Support:     $182.50 | Resistance: $195.00', '#00f0ff'),
    mkLine('agent', '  Signal:      BUY — Confidence 87%', '#00f0ff'),
    mkLine('agent', '  Recommendation: Accumulate 1.5 SOL at market', '#00f0ff'),
  ];
}

function getRiskLines(): TerminalLine[] {
  return [
    mkLine('agent', '[Sentinel Guard] Portfolio Risk Assessment:', '#ef4444', 'Sentinel Guard'),
    mkLine('agent', '  SOL exposure:     32.1% (limit: 40%)', '#ef4444'),
    mkLine('agent', '  Portfolio VaR:    -4.2% (daily 95%)', '#ef4444'),
    mkLine('agent', '  Correlation risk: MODERATE (SOL-ETH r=0.78)', '#ef4444'),
    mkLine('agent', '  Anomaly scan:     No unusual on-chain activity', '#ef4444'),
    mkLine('agent', '  Overall risk:     MEDIUM — within acceptable limits', '#ef4444'),
    mkLine('agent', '  Status:           CLEAR for new positions', '#ef4444'),
  ];
}

function getBuySellLines(action: string): TerminalLine[] {
  const isBuy = action.toLowerCase().includes('buy');
  const side = isBuy ? 'BUY' : 'SELL';
  return [
    mkLine('agent', `[Swift Trader] Executing ${side} order...`, '#22c55e', 'Swift Trader'),
    mkLine('agent', `  Route:        Jupiter Aggregator → Raydium pool`, '#22c55e'),
    mkLine('agent', `  Pair:         SOL/USDC`, '#22c55e'),
    mkLine('agent', `  Side:         ${side} 1.5 SOL`, '#22c55e'),
    mkLine('agent', `  Est. price:   $187.42`, '#22c55e'),
    mkLine('agent', `  Slippage:     0.12% (max 0.5%)`, '#22c55e'),
    mkLine('agent', `  Tx hash:      4Kz9rT2vN8bXwQ1mL5pY3fHj6gR7dC0aE...7mN`, '#22c55e'),
    mkLine('agent', `  Status:       CONFIRMED — 1 block confirmation`, '#22c55e'),
    mkLine('agent', `  Fee:          0.005 SOL (network + protocol)`, '#22c55e'),
  ];
}

function getPriceLines(): TerminalLine[] {
  return [
    mkLine('agent', '[Oracle Stream] Live Price Feed — SOL/USDC:', '#8b5cf6', 'Oracle Stream'),
    mkLine('agent', '  Price:       $187.23', '#8b5cf6'),
    mkLine('agent', '  Bid:         $187.21 | Ask: $187.25', '#8b5cf6'),
    mkLine('agent', '  24h High:    $191.47 | Low: $181.03', '#8b5cf6'),
    mkLine('agent', '  24h Vol:     $1.24B', '#8b5cf6'),
    mkLine('agent', '  Source:      Jupiter + Raydium + Orca (aggregated)', '#8b5cf6'),
    mkLine('agent', '  Latency:     42ms | Updated: just now', '#8b5cf6'),
  ];
}

function getStatusLines(): TerminalLine[] {
  return [
    mkLine('system', 'Agent Wallet Balances & Task Summary:'),
    mkLine('agent', '  Alpha Scout      2.847 SOL    Tasks: 24    Earnings: 0.127 SOL', '#00f0ff'),
    mkLine('agent', '  Swift Trader     5.312 SOL    Tasks: 18    Earnings: 0.093 SOL', '#22c55e'),
    mkLine('agent', '  Sentinel Guard   1.205 SOL    Tasks: 31    Earnings: 0.068 SOL', '#ef4444'),
    mkLine('agent', '  Oracle Stream    0.892 SOL    Tasks: 47    Earnings: 0.041 SOL', '#8b5cf6'),
    mkLine('system', '  ─────────────────────────────────────────────────'),
    mkLine('system', '  Total:           10.256 SOL   Tasks: 120   Earnings: 0.329 SOL'),
  ];
}

function getOrchestrateLines(): { lines: TerminalLine[]; delays: number[] } {
  const oracleLines = [
    mkLine('system', '◈ Initiating multi-agent orchestration flow...'),
    mkLine('system', ''),
    mkLine('agent', '[Oracle Stream] Fetching price data...', '#8b5cf6', 'Oracle Stream'),
    mkLine('agent', '  SOL/USDC = $187.23 | RSI(14) = 28.4 | MACD: bullish crossover', '#8b5cf6'),
    mkLine('agent', '  → Broadcasting to Alpha Scout', '#8b5cf6'),
  ];
  const alphaLines = [
    mkLine('agent', '[Alpha Scout] Received Oracle feed. Analyzing...', '#00f0ff', 'Alpha Scout'),
    mkLine('agent', '  RSI oversold + MACD bullish → combined confidence: 87%', '#00f0ff'),
    mkLine('agent', '  Decision: BUY 1.5 SOL. Requesting risk clearance...', '#00f0ff'),
    mkLine('agent', '  → Forwarding to Sentinel Guard', '#00f0ff'),
  ];
  const sentinelLines = [
    mkLine('agent', '[Sentinel Guard] Risk check for BUY 1.5 SOL...', '#ef4444', 'Sentinel Guard'),
    mkLine('agent', '  Portfolio exposure: 32% → 35.2% (under 40% limit)', '#ef4444'),
    mkLine('agent', '  APPROVED — risk level: MEDIUM', '#ef4444'),
    mkLine('agent', '  → Forwarding clearance to Swift Trader', '#ef4444'),
  ];
  const swiftLines = [
    mkLine('agent', '[Swift Trader] Executing BUY 1.5 SOL via Jupiter...', '#22c55e', 'Swift Trader'),
    mkLine('agent', '  Route: USDC → SOL via Raydium | Slippage: 0.12%', '#22c55e'),
    mkLine('agent', '  Tx: 4Kz9rT2vN8bXwQ1mL5pY3fHj6gR7dC0aE...7mN', '#22c55e'),
    mkLine('agent', '  CONFIRMED at $187.42 — 1 block confirmation', '#22c55e'),
  ];
  const settlementLines = [
    mkLine('system', ''),
    mkLine('system', '◈ Orchestration complete. Settlement: 0.005 SOL → Alpha Scout'),
    mkLine('system', '  Total flow: Oracle → Alpha → Sentinel → Swift (4 agents, 3 tasks)'),
  ];

  const all = [...oracleLines, ...alphaLines, ...sentinelLines, ...swiftLines, ...settlementLines];
  // Assign delays: oracle immediate, alpha after 800ms, sentinel after 800ms, swift after 800ms, settlement after 800ms
  const delays: number[] = [];
  oracleLines.forEach((_, i) => delays.push(i === 0 ? 0 : 100));
  alphaLines.forEach((_, i) => delays.push(i === 0 ? 800 : 100));
  sentinelLines.forEach((_, i) => delays.push(i === 0 ? 800 : 100));
  swiftLines.forEach((_, i) => delays.push(i === 0 ? 800 : 100));
  settlementLines.forEach((_, i) => delays.push(i === 0 ? 800 : 100));

  return { lines: all, delays };
}

// --- Props ---
interface AgentTerminalProps {
  customAgents?: { name: string; description: string }[];
}

// --- Component ---
export default function AgentTerminal({ customAgents = [] }: AgentTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    mkLine('system', 'SolAgent Hub — Agent Command Interface v1.0'),
    mkLine('system', 'Connected to 4 agents on Solana devnet. Type "help" for commands.'),
    mkLine('system', ''),
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  // Focus input on click anywhere in terminal
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Autocomplete
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    const matches = COMMANDS.filter(c => c.startsWith(input.toLowerCase()) && c !== input.toLowerCase());
    setSuggestions(matches.slice(0, 5));
  }, [input]);

  // Append lines with optional thinking delay
  const appendLines = useCallback(async (newLines: TerminalLine[], thinkingAgent?: string) => {
    setIsProcessing(true);
    if (thinkingAgent) {
      const thinkingLine = mkLine('thinking', `${thinkingAgent} is thinking...`, AGENT_COLORS[thinkingAgent] || '#6b7280');
      setLines(prev => [...prev, thinkingLine]);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
      setLines(prev => prev.filter(l => l.id !== thinkingLine.id));
    }
    setLines(prev => [...prev, ...newLines]);
    setIsProcessing(false);
  }, []);

  // Append lines sequentially with delays (for orchestrate)
  const appendSequential = useCallback(async (items: TerminalLine[], delays: number[]) => {
    setIsProcessing(true);
    for (let i = 0; i < items.length; i++) {
      if (delays[i] > 0) {
        // Show thinking dots for agent transitions
        if (items[i].agentName && delays[i] >= 800) {
          const thinkingLine = mkLine('thinking', `${items[i].agentName} is thinking...`, items[i].color);
          setLines(prev => [...prev, thinkingLine]);
          await new Promise(r => setTimeout(r, delays[i]));
          setLines(prev => prev.filter(l => l.id !== thinkingLine.id));
        } else {
          await new Promise(r => setTimeout(r, delays[i]));
        }
      }
      const line = items[i];
      setLines(prev => [...prev, line]);
    }
    setIsProcessing(false);
  }, []);

  // Handle command
  const handleCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);
    setSuggestions([]);

    // Add user input line
    setLines(prev => [...prev, mkLine('user', `commander> ${trimmed}`)]);

    const lower = trimmed.toLowerCase();

    if (lower === 'clear') {
      setLines([mkLine('system', 'Terminal cleared.'), mkLine('system', '')]);
      return;
    }
    if (lower === 'help') {
      await appendLines(getHelpLines());
      return;
    }
    if (lower === 'agents') {
      const agentLines = [
        mkLine('system', `Registered Agents (${4 + customAgents.length}):`),
        mkLine('agent', '  [ONLINE]  Alpha Scout      — Market analysis & signal detection', '#00f0ff', 'Alpha Scout'),
        mkLine('agent', '  [ONLINE]  Swift Trader     — DEX trade execution via Jupiter', '#22c55e', 'Swift Trader'),
        mkLine('agent', '  [ONLINE]  Sentinel Guard   — Portfolio risk management', '#ef4444', 'Sentinel Guard'),
        mkLine('agent', '  [ONLINE]  Oracle Stream    — Real-time price feed aggregator', '#8b5cf6', 'Oracle Stream'),
        ...customAgents.map(a => mkLine('agent', `  [ONLINE]  ${a.name.padEnd(16)} — ${a.description.slice(0, 50)}`, '#f59e0b')),
      ];
      await appendLines(agentLines);
      return;
    }
    if (lower === 'status') {
      await appendLines(getStatusLines());
      return;
    }
    if (lower.includes('orchestrate')) {
      const { lines: oLines, delays } = getOrchestrateLines();
      await appendSequential(oLines, delays);
      return;
    }
    if (lower.includes('analyze')) {
      await appendLines(getAnalyzeLines(), 'Alpha Scout');
      return;
    }
    if (lower.includes('risk')) {
      await appendLines(getRiskLines(), 'Sentinel Guard');
      return;
    }
    if (lower.includes('buy') || lower.includes('sell')) {
      await appendLines(getBuySellLines(lower), 'Swift Trader');
      return;
    }
    if (lower.includes('price')) {
      await appendLines(getPriceLines(), 'Oracle Stream');
      return;
    }
    // Unknown
    await appendLines([mkLine('system', 'Unknown command. Type "help" for available commands.')]);
  }, [appendLines, appendSequential]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const newIdx = historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInput(history[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < 0) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= history.length) { setHistoryIdx(-1); setInput(''); }
      else { setHistoryIdx(newIdx); setInput(history[newIdx]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0]);
        setSuggestions([]);
      }
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-[#2a2d3e] bg-[#0a0b0f] font-mono text-sm"
      onClick={focusInput}
      style={{ minHeight: 560 }}
    >
      {/* CRT scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2a2d3e] bg-[#0d0e14]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
        </div>
        <span className="text-[11px] text-[#6b7280]">Agent Command Interface</span>
        <span className="text-[10px] text-[#6b7280] ml-auto">4 agents connected</span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="px-4 py-3 overflow-y-auto"
        style={{ height: 'calc(100% - 90px)', minHeight: 420 }}
      >
        {lines.map(line => (
          <div key={line.id} className="flex gap-2 leading-6">
            {line.type !== 'system' || line.text !== '' ? (
              <span className="text-[10px] text-[#3a3d4e] w-[70px] shrink-0 pt-[3px] select-none">
                [{line.timestamp}]
              </span>
            ) : (
              <span className="w-[70px] shrink-0" />
            )}
            {line.type === 'user' && (
              <span className="text-white">{line.text}</span>
            )}
            {line.type === 'agent' && (
              <span style={{ color: line.color || '#22c55e' }}>{line.text}</span>
            )}
            {line.type === 'system' && (
              <span className="text-[#6b7280]">{line.text}</span>
            )}
            {line.type === 'thinking' && (
              <span style={{ color: line.color || '#6b7280' }} className="animate-pulse">{line.text}</span>
            )}
          </div>
        ))}
      </div>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-[42px] left-4 right-4 z-10">
          <div className="bg-[#12131a] border border-[#2a2d3e] rounded-lg py-1 px-2">
            {suggestions.map((s, i) => (
              <div
                key={s}
                className={`px-2 py-1 text-xs cursor-pointer rounded ${
                  i === 0 ? 'bg-[#1a1b26] text-[#00f0ff]' : 'text-[#6b7280] hover:text-[#9ca3af]'
                }`}
                onClick={() => { setInput(s); setSuggestions([]); inputRef.current?.focus(); }}
              >
                {s}
                {i === 0 && <span className="text-[10px] text-[#3a3d4e] ml-2">TAB</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-2.5 border-t border-[#2a2d3e] bg-[#0d0e14]">
        <span className="text-[#00f0ff] select-none">commander&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder={isProcessing ? 'Processing...' : 'Type a command...'}
          className="flex-1 bg-transparent outline-none text-white placeholder-[#3a3d4e] caret-[#00f0ff]"
          autoFocus
        />
      </div>
    </div>
  );
}
