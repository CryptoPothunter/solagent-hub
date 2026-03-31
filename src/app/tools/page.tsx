'use client';
import Link from 'next/link';
import { useState } from 'react';
import WalletButton from '@/components/WalletButton';
import { useI18n } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { getJupiterPrices, TOKEN_MINTS } from '@/lib/jupiter';

interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Tool {
  name: string;
  description: string;
  params: ToolParam[];
  exampleRequest: string;
  exampleResponse: string;
}

interface AgentTools {
  agent: string;
  color: string;
  emoji: string;
  agentId: string;
  tools: Tool[];
}

const AGENTS_TOOLS: AgentTools[] = [
  {
    agent: 'Oracle Stream',
    color: '#8b5cf6',
    emoji: '\u{1F4E1}',
    agentId: 'AGT4',
    tools: [
      {
        name: 'get_price_feed',
        description: 'Get real-time token price data',
        params: [
          { name: 'token', type: 'string', required: true, description: 'Token symbol (e.g. SOL, BONK)' },
          { name: 'interval', type: 'string', required: false, description: 'Price interval (1m, 5m, 1h, 1d)' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "get_price_feed",\n    "arguments": { "token": "SOL", "interval": "5m" }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"price\\": 187.23, \\"change_24h\\": 3.2, \\"volume\\": 1240000 }"\n  }]\n}',
      },
      {
        name: 'scan_liquidity',
        description: 'Scan DEX liquidity pools',
        params: [
          { name: 'token_pair', type: 'string', required: true, description: 'Trading pair (e.g. SOL/USDC)' },
          { name: 'min_tvl', type: 'number', required: false, description: 'Minimum TVL filter in USD' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "scan_liquidity",\n    "arguments": { "token_pair": "SOL/USDC", "min_tvl": 100000 }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"pools\\": [{ \\"dex\\": \\"Raydium\\", \\"tvl\\": 4200000 }] }"\n  }]\n}',
      },
      {
        name: 'watch_whales',
        description: 'Monitor large wallet movements',
        params: [
          { name: 'min_amount_sol', type: 'number', required: true, description: 'Minimum SOL amount to trigger alert' },
          { name: 'token', type: 'string', required: false, description: 'Filter by specific token' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "watch_whales",\n    "arguments": { "min_amount_sol": 1000, "token": "SOL" }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"alerts\\": [{ \\"wallet\\": \\"7xK3...9mPq\\", \\"amount\\": 2500, \\"direction\\": \\"out\\" }] }"\n  }]\n}',
      },
    ],
  },
  {
    agent: 'Alpha Scout',
    color: '#00f0ff',
    emoji: '\u{1F50D}',
    agentId: 'AGT1',
    tools: [
      {
        name: 'analyze_signal',
        description: 'Run technical analysis on a token',
        params: [
          { name: 'token', type: 'string', required: true, description: 'Token symbol to analyze' },
          { name: 'indicators', type: 'string[]', required: false, description: 'List of indicators (rsi, macd, bollinger, etc.)' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "analyze_signal",\n    "arguments": { "token": "SOL", "indicators": ["rsi", "macd"] }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"rsi\\": 28.4, \\"macd\\": \\"bullish_cross\\", \\"signal\\": \\"oversold\\" }"\n  }]\n}',
      },
      {
        name: 'generate_trade_signal',
        description: 'Generate buy/sell signal with confidence',
        params: [
          { name: 'token', type: 'string', required: true, description: 'Token to generate signal for' },
          { name: 'timeframe', type: 'string', required: true, description: 'Analysis timeframe (1h, 4h, 1d)' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "generate_trade_signal",\n    "arguments": { "token": "SOL", "timeframe": "4h" }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"signal\\": \\"BUY\\", \\"confidence\\": 0.87, \\"entry\\": 187.23 }"\n  }]\n}',
      },
      {
        name: 'backtest_strategy',
        description: 'Backtest a trading strategy',
        params: [
          { name: 'strategy_id', type: 'string', required: true, description: 'Strategy identifier to backtest' },
          { name: 'period', type: 'string', required: true, description: 'Historical period (7d, 30d, 90d)' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "backtest_strategy",\n    "arguments": { "strategy_id": "rsi_macd_cross", "period": "30d" }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"winRate\\": 0.72, \\"sharpe\\": 1.84, \\"trades\\": 47 }"\n  }]\n}',
      },
    ],
  },
  {
    agent: 'Swift Trader',
    color: '#22c55e',
    emoji: '\u{26A1}',
    agentId: 'AGT2',
    tools: [
      {
        name: 'execute_swap',
        description: 'Execute a token swap via Jupiter',
        params: [
          { name: 'from_token', type: 'string', required: true, description: 'Source token symbol' },
          { name: 'to_token', type: 'string', required: true, description: 'Destination token symbol' },
          { name: 'amount', type: 'number', required: true, description: 'Amount of source token to swap' },
          { name: 'max_slippage', type: 'number', required: false, description: 'Maximum slippage percentage (default 0.5)' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "execute_swap",\n    "arguments": {\n      "from_token": "USDC",\n      "to_token": "SOL",\n      "amount": 280,\n      "max_slippage": 0.5\n    }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"tx\\": \\"4Kz...7mN\\", \\"filled\\": 1.5, \\"price\\": 187.42 }"\n  }]\n}',
      },
      {
        name: 'get_route',
        description: 'Get best swap route without executing',
        params: [
          { name: 'from_token', type: 'string', required: true, description: 'Source token symbol' },
          { name: 'to_token', type: 'string', required: true, description: 'Destination token symbol' },
          { name: 'amount', type: 'number', required: true, description: 'Amount to route' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "get_route",\n    "arguments": { "from_token": "USDC", "to_token": "SOL", "amount": 500 }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"route\\": \\"USDC->Raydium->SOL\\", \\"expected\\": 2.67, \\"slippage\\": 0.12 }"\n  }]\n}',
      },
      {
        name: 'cancel_order',
        description: 'Cancel a pending limit order',
        params: [
          { name: 'order_id', type: 'string', required: true, description: 'The order ID to cancel' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "cancel_order",\n    "arguments": { "order_id": "ORD_a8f3k2" }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"cancelled\\": true, \\"refunded\\": 280 }"\n  }]\n}',
      },
    ],
  },
  {
    agent: 'Sentinel Guard',
    color: '#ef4444',
    emoji: '\u{1F6E1}\u{FE0F}',
    agentId: 'AGT3',
    tools: [
      {
        name: 'check_risk',
        description: 'Evaluate portfolio risk for a proposed trade',
        params: [
          { name: 'action', type: 'string', required: true, description: 'Proposed action (BUY, SELL)' },
          { name: 'token', type: 'string', required: true, description: 'Token symbol' },
          { name: 'amount', type: 'number', required: true, description: 'Amount of the proposed trade' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "check_risk",\n    "arguments": { "action": "BUY", "token": "SOL", "amount": 1.5 }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"approved\\": true, \\"exposure\\": \\"35.2%\\", \\"limit\\": \\"40%\\" }"\n  }]\n}',
      },
      {
        name: 'get_exposure',
        description: 'Get current portfolio exposure breakdown',
        params: [],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "get_exposure",\n    "arguments": {}\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"SOL\\": 32, \\"USDC\\": 45, \\"BONK\\": 8, \\"other\\": 15 }"\n  }]\n}',
      },
      {
        name: 'set_limit',
        description: 'Set risk limits for a token',
        params: [
          { name: 'token', type: 'string', required: true, description: 'Token symbol to set limits for' },
          { name: 'max_exposure_pct', type: 'number', required: true, description: 'Maximum exposure percentage (0-100)' },
        ],
        exampleRequest: '{\n  "method": "tools/call",\n  "params": {\n    "name": "set_limit",\n    "arguments": { "token": "SOL", "max_exposure_pct": 40 }\n  }\n}',
        exampleResponse: '{\n  "content": [{\n    "type": "text",\n    "text": "{ \\"updated\\": true, \\"token\\": \\"SOL\\", \\"max_exposure_pct\\": 40 }"\n  }]\n}',
      },
    ],
  },
];

const MCP_CONFIG = `{
  "mcpServers": {
    "solagent-oracle": {
      "url": "https://solagent.hub/agent/AGT4/mcp"
    },
    "solagent-scout": {
      "url": "https://solagent.hub/agent/AGT1/mcp"
    },
    "solagent-trader": {
      "url": "https://solagent.hub/agent/AGT2/mcp"
    },
    "solagent-sentinel": {
      "url": "https://solagent.hub/agent/AGT3/mcp"
    }
  }
}`;

function ParamsTable({ params, color }: { params: ToolParam[]; color: string }) {
  const { t } = useI18n();
  if (params.length === 0) {
    return <div className="text-xs text-[#6b7280] italic">{t('tools.noParams')}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[#6b7280] border-b border-[#2a2d3e]">
            <th className="pb-2 pr-4 font-medium">{t('tools.param.name')}</th>
            <th className="pb-2 pr-4 font-medium">{t('tools.param.type')}</th>
            <th className="pb-2 pr-4 font-medium">{t('tools.param.required')}</th>
            <th className="pb-2 font-medium">{t('tools.param.description')}</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-[#2a2d3e]/50">
              <td className="py-2 pr-4 font-mono" style={{ color }}>{p.name}</td>
              <td className="py-2 pr-4 font-mono text-[#9ca3af]">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-[#22c55e]">{t('tools.param.yes')}</span>
                ) : (
                  <span className="text-[#6b7280]">{t('tools.param.no')}</span>
                )}
              </td>
              <td className="py-2 text-[#9ca3af]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolCard({ tool, color }: { tool: Tool; color: string }) {
  const { t } = useI18n();
  const [showExample, setShowExample] = useState(false);
  return (
    <div className="gradient-border">
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-mono font-semibold text-sm" style={{ color }}>
              {tool.name}
            </h4>
            <p className="text-xs text-[#9ca3af] mt-1">{tool.description}</p>
          </div>
          <Link
            href="/orchestrate"
            className="shrink-0 ml-4 px-3 py-1.5 rounded-lg text-[10px] font-mono border border-[#2a2d3e] text-[#9ca3af] hover:text-white hover:border-[#00f0ff]/40 transition-all"
          >
            {t('tools.tryTerminal')}
          </Link>
        </div>

        <div className="mb-3">
          <div className="text-[10px] font-mono text-[#6b7280] mb-2 uppercase tracking-wider">{t('tools.params')}</div>
          <ParamsTable params={tool.params} color={color} />
        </div>

        <button
          onClick={() => setShowExample(!showExample)}
          className="text-[10px] font-mono transition-colors hover:text-white"
          style={{ color }}
        >
          {showExample ? t('tools.hideExample') : t('tools.showExample')}
        </button>

        {showExample && (
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-mono text-[#6b7280] mb-1">{t('tools.request')}</div>
              <div className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-3 overflow-x-auto">
                <pre className="text-[11px] font-mono text-[#9ca3af] leading-relaxed whitespace-pre">{tool.exampleRequest}</pre>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#6b7280] mb-1">{t('tools.response')}</div>
              <div className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-3 overflow-x-auto">
                <pre className="text-[11px] font-mono text-[#9ca3af] leading-relaxed whitespace-pre">{tool.exampleResponse}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LivePriceTool() {
  const [token, setToken] = useState('SOL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const prices = await getJupiterPrices([token]);
      if (prices && prices[token] !== undefined) {
        setResult(JSON.stringify({
          token,
          price: prices[token],
          source: 'Jupiter Price API v2',
          timestamp: new Date().toISOString(),
          network: 'mainnet',
        }, null, 2));
      } else {
        setError(`No price data for ${token}`);
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border-2 border-[#22c55e]/30 bg-gradient-to-r from-[#22c55e]/5 to-transparent p-5 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="text-xs font-mono font-semibold text-[#22c55e]">LIVE MCP TOOL — Real Jupiter Price API</span>
      </div>
      <p className="text-xs text-[#9ca3af] mb-4">
        This tool calls the real Jupiter Price API v2 and returns live market data. Try it below.
      </p>
      <div className="flex items-center gap-3 mb-3">
        <select
          value={token}
          onChange={e => setToken(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e] text-sm text-white font-mono focus:outline-none focus:border-[#22c55e]/50"
        >
          {Object.keys(TOKEN_MINTS).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={fetchPrice}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e] text-sm font-mono border border-[#22c55e]/30 hover:bg-[#22c55e]/30 disabled:opacity-40 transition-all"
        >
          {loading ? 'Fetching...' : 'get_price_feed →'}
        </button>
      </div>
      {result && (
        <div className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-3">
          <pre className="text-[11px] font-mono text-[#22c55e] whitespace-pre">{result}</pre>
        </div>
      )}
      {error && (
        <div className="text-xs text-[#ef4444] font-mono">{error}</div>
      )}
    </div>
  );
}

export default function ToolsPage() {
  const { t } = useI18n();
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
              <Link href="/explorer" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.explorer')}</Link>
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
          <h1 className="text-3xl font-bold mb-2">{t('tools.title')}</h1>
          <p className="text-sm text-[#6b7280]">{t('tools.subtitle')}</p>
        </div>

        {/* Live Tool */}
        <LivePriceTool />

        {/* Agent Sections */}
        <div className="space-y-12">
          {AGENTS_TOOLS.map((agent) => (
            <section key={agent.agent}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg"
                  style={{
                    background: `${agent.color}15`,
                    borderColor: `${agent.color}30`,
                  }}
                >
                  {agent.emoji}
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: agent.color }}>
                    {agent.agent}
                  </h2>
                  <div className="text-[10px] font-mono text-[#6b7280]">
                    {agent.tools.length} {t('tools.tools')} &middot; MCP endpoint: /agent/{agent.agentId}/mcp
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {agent.tools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} color={agent.color} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* MCP Server Configuration */}
        <div className="mt-16 gradient-border p-6">
          <div className="relative z-10">
            <h3 className="text-sm font-semibold mb-1 text-[#00f0ff]">{t('tools.mcpConfig.title')}</h3>
            <p className="text-xs text-[#6b7280] mb-4">
              {t('tools.mcpConfig.desc')}
            </p>
            <div className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-[#9ca3af] leading-relaxed whitespace-pre">{MCP_CONFIG}</pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
