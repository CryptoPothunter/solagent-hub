'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';

type Translations = Record<string, Record<Lang, string>>;

const translations: Translations = {
  // --- Common / Nav ---
  'nav.explorer': { en: 'Agent Explorer', zh: 'Agent 浏览器' },
  'nav.register': { en: 'Register Agent', zh: '注册 Agent' },
  'nav.orchestrate': { en: 'Orchestrate', zh: '编排中心' },
  'nav.tools': { en: 'Tools', zh: '工具箱' },
  'common.active': { en: 'Active', zh: '活跃' },
  'common.inactive': { en: 'Inactive', zh: '不活跃' },

  // --- Home page ---
  'home.poweredBy': { en: 'POWERED BY METAPLEX AGENT REGISTRY', zh: '基于 METAPLEX AGENT REGISTRY 构建' },
  'home.title1': { en: 'Agent-to-Agent', zh: 'Agent-to-Agent' },
  'home.title2': { en: 'Orchestration Layer', zh: '编排协议层' },
  'home.subtitle': {
    en: "Discover, register, and orchestrate autonomous AI agents on Solana. Built on Metaplex's on-chain Agent Registry with A2A protocol communication, execution delegation, and trustless SOL settlement.",
    zh: '在 Solana 上发现、注册和编排自主 AI Agent。基于 Metaplex 链上 Agent Registry，支持 A2A 协议通信、执行委托和无信任 SOL 结算。',
  },
  'home.explore': { en: 'Explore Agents', zh: '浏览 Agent' },
  'home.register': { en: 'Register an Agent', zh: '注册 Agent' },
  'home.stats.agents': { en: 'Registered Agents', zh: '已注册 Agent' },
  'home.stats.messages': { en: 'A2A Messages', zh: 'A2A 消息' },
  'home.stats.tasks': { en: 'Tasks Completed', zh: '已完成任务' },
  'home.stats.sol': { en: 'SOL Settled', zh: 'SOL 已结算' },
  'home.nav.explorer.desc': { en: 'Discover on-chain agents', zh: '发现链上 Agent' },
  'home.nav.register.desc': { en: 'Launch & register identity', zh: '创建并注册身份' },
  'home.nav.orchestrate.desc': { en: 'A2A task orchestration', zh: 'A2A 任务编排' },
  'home.nav.tools.desc': { en: 'MCP tools explorer', zh: 'MCP 工具浏览' },
  'home.arch.title': { en: 'Architecture', zh: '系统架构' },
  'home.arch.subtitle': {
    en: 'Live agent topology — Metaplex Agent Registry + A2A Protocol',
    zh: '实时 Agent 拓扑 — Metaplex Agent Registry + A2A Protocol',
  },
  'home.arch.identity.title': { en: 'On-Chain Identity', zh: '链上身份' },
  'home.arch.identity.desc': {
    en: 'MPL Core Asset → registerIdentityV1 → PDA + AgentIdentity Plugin → ERC-8004 Metadata on Arweave',
    zh: 'MPL Core Asset → registerIdentityV1 → PDA + AgentIdentity 插件 → Arweave 上的 ERC-8004 Metadata',
  },
  'home.arch.delegation.title': { en: 'Execution Delegation', zh: '执行委托' },
  'home.arch.delegation.desc': {
    en: 'Executive Profile → DelegateExecutionV1 → Asset Signer PDA wallet → Autonomous on-chain signing',
    zh: 'Executive Profile → DelegateExecutionV1 → Asset Signer PDA 钱包 → 自主链上签名',
  },
  'home.arch.a2a.title': { en: 'A2A Communication', zh: 'A2A 通信' },
  'home.arch.a2a.desc': {
    en: 'agent-card.json discovery → Task routing → Multi-agent orchestration → SOL settlement via PDA',
    zh: 'agent-card.json 发现 → 任务路由 → 多 Agent 编排 → PDA SOL 结算',
  },
  'home.footer': {
    en: 'Built for Solana Agent Economy Hackathon — #AgentTalentShow — Metaplex Agents Track',
    zh: '为 Solana Agent Economy Hackathon 而构建 — #AgentTalentShow — Metaplex Agents Track',
  },
  'home.saop.badge': {
    en: 'SAOP v0.1.0 — Solana Agent Orchestration Protocol',
    zh: 'SAOP v0.1.0 — Solana Agent 编排协议',
  },
  'home.arch.saop.title': { en: 'SAOP Verification', zh: 'SAOP 验证' },
  'home.arch.saop.desc': {
    en: 'SHA-256 flow digest → Solana Memo Program → On-chain auditability',
    zh: 'SHA-256 流摘要 → Solana Memo Program → 链上可审计性',
  },
  'home.devnet': { en: 'DEVNET', zh: 'DEVNET' },

  // --- Explorer page ---
  'explorer.title': { en: 'Agent Registry Explorer', zh: 'Agent Registry 浏览器' },
  'explorer.subtitle': {
    en: 'Discover on-chain registered agents via Metaplex Agent Registry PDAs',
    zh: '通过 Metaplex Agent Registry PDA 发现链上注册的 Agent',
  },
  'explorer.search': { en: 'Search agents by name or capability...', zh: '按名称或能力搜索 Agent...' },
  'explorer.filter.all': { en: 'All', zh: '全部' },
  'explorer.filter.active': { en: 'Active', zh: '活跃' },
  'explorer.noResults': { en: 'No agents found matching your criteria.', zh: '没有找到匹配的 Agent。' },
  'explorer.onchainDetails': { en: 'On-Chain Details', zh: '链上详情' },
  'explorer.hideDetails': { en: 'Hide Details', zh: '隐藏详情' },
  'explorer.assetSigner': { en: 'Asset Signer', zh: 'Asset Signer' },
  'explorer.howTitle': { en: 'How Agent Discovery Works', zh: 'Agent 发现机制' },
  'explorer.how1.title': { en: '1. On-Chain Identity', zh: '1. 链上身份' },
  'explorer.how1.desc': {
    en: 'Each agent is an MPL Core asset with an AgentIdentity plugin. The identity PDA is derived from seeds ["agent_identity", asset_pubkey], making every agent discoverable on-chain.',
    zh: '每个 Agent 都是一个 MPL Core 资产，附带 AgentIdentity 插件。身份 PDA 由种子 ["agent_identity", asset_pubkey] 派生，使每个 Agent 都可在链上被发现。',
  },
  'explorer.how2.title': { en: '2. ERC-8004 Metadata', zh: '2. ERC-8004 Metadata' },
  'explorer.how2.desc': {
    en: 'The registration URI points to a JSON document following ERC-8004 standard — name, description, service endpoints (A2A, MCP, web), trust models, and active status.',
    zh: '注册 URI 指向遵循 ERC-8004 标准的 JSON 文档 — 包含名称、描述、服务端点（A2A、MCP、web）、信任模型和活跃状态。',
  },
  'explorer.how3.title': { en: '3. Asset Signer Wallet', zh: '3. Asset Signer 钱包' },
  'explorer.how3.desc': {
    en: 'Every agent has a built-in wallet PDA with no private key. It can receive SOL and tokens, but only the asset itself can sign outgoing transactions via delegated executives.',
    zh: '每个 Agent 都有一个内置的无私钥钱包 PDA。它可以接收 SOL 和代币，但只有资产本身才能通过委托的 Executive 签署外发交易。',
  },
  'explorer.registry.querying': { en: 'Querying Metaplex Agent Registry on Devnet...', zh: '正在查询 Devnet 上的 Metaplex Agent Registry...' },
  'explorer.registry.found': { en: 'on-chain accounts found', zh: '个链上账户' },
  'explorer.registry.failed': { en: 'Registry query failed', zh: 'Registry 查询失败' },
  'explorer.registry.noAgents': { en: 'No agents currently registered on Devnet via this program.', zh: '当前 Devnet 上没有通过此程序注册的 Agent。' },
  'explorer.registry.showingDemo': { en: 'demo agents for reference', zh: '个演示 Agent 作为参考' },

  // --- Register page ---
  'register.title': { en: 'Register an Agent', zh: '注册 Agent' },
  'register.subtitle': {
    en: 'Full Metaplex Agent Registry flow — from Core asset to autonomous execution',
    zh: '完整的 Metaplex Agent Registry 流程 — 从 Core 资产到自主执行',
  },
  'register.step.config': { en: 'Configure Agent', zh: '配置 Agent' },
  'register.step.config.desc': {
    en: "Define your agent's identity, capabilities, and service endpoints.",
    zh: '定义 Agent 的身份、能力和服务端点。',
  },
  'register.step.create': { en: 'Create MPL Core Asset', zh: '创建 MPL Core 资产' },
  'register.step.create.desc': {
    en: 'Mint an MPL Core asset on Solana — the on-chain anchor for your agent identity.',
    zh: '在 Solana 上铸造一个 MPL Core 资产 — 作为 Agent 身份的链上锚点。',
  },
  'register.step.upload': { en: 'Upload ERC-8004 Metadata', zh: '上传 ERC-8004 Metadata' },
  'register.step.upload.desc': {
    en: 'Upload the agent registration document to Arweave — following ERC-8004 standard.',
    zh: '将 Agent 注册文档上传到 Arweave — 遵循 ERC-8004 标准。',
  },
  'register.step.identity': { en: 'Register Agent Identity', zh: '注册 Agent 身份' },
  'register.step.identity.desc': {
    en: 'Call registerIdentityV1 to bind identity PDA + AgentIdentity plugin to the Core asset.',
    zh: '调用 registerIdentityV1 将身份 PDA + AgentIdentity 插件绑定到 Core 资产。',
  },
  'register.step.executive': { en: 'Register Executive Profile', zh: '注册 Executive Profile' },
  'register.step.executive.desc': {
    en: 'Create an on-chain executive profile — the operator identity that will run your agent.',
    zh: '创建链上 Executive Profile — 运行 Agent 的操作者身份。',
  },
  'register.step.delegate': { en: 'Delegate Execution', zh: '委托执行' },
  'register.step.delegate.desc': {
    en: 'Link your agent to the executive — granting permission to sign transactions autonomously.',
    zh: '将 Agent 链接到 Executive — 授予自主签署交易的权限。',
  },
  'register.step.done': { en: 'Agent Live', zh: 'Agent 已上线' },
  'register.step.done.desc': {
    en: 'Your agent is registered, delegated, and ready for A2A communication.',
    zh: 'Agent 已注册、已委托，可进行 A2A 通信。',
  },
  'register.form.name': { en: 'Agent Name', zh: 'Agent 名称' },
  'register.form.name.placeholder': { en: 'e.g., Alpha Scout', zh: '例如：Alpha Scout' },
  'register.form.desc': { en: 'Description', zh: '描述' },
  'register.form.desc.placeholder': { en: 'Describe what your agent does...', zh: '描述你的 Agent 能做什么...' },
  'register.btn.continue': { en: 'Continue', zh: '继续' },
  'register.btn.execute': { en: 'Execute on Devnet', zh: '在 Devnet 上执行' },
  'register.btn.processing': { en: 'Processing...', zh: '处理中...' },
  'register.btn.viewExplorer': { en: 'View in Explorer →', zh: '在浏览器中查看 →' },
  'register.txLog': { en: 'Transaction Log', zh: '交易日志' },

  // --- Orchestrate page ---
  'orch.title': { en: 'Agent Orchestration', zh: 'Agent 编排' },
  'orch.subtitle': {
    en: 'Live A2A protocol communication between Metaplex-registered agents',
    zh: 'Metaplex 注册 Agent 之间的实时 A2A 协议通信',
  },
  'orch.tasks': { en: 'Tasks', zh: '任务' },
  'orch.solSettled': { en: 'SOL Settled', zh: 'SOL 已结算' },
  'orch.clickToWatch': {
    en: 'Click to watch 5 AI agents collaborate in real-time via A2A protocol',
    zh: '点击观看 5 个 AI Agent 通过 A2A 协议实时协作',
  },
  'orch.start': { en: '▶ Start Orchestration', zh: '▶ 开始编排' },
  'orch.running': { en: 'Running...', zh: '运行中...' },
  'orch.replay': { en: '▶ Replay', zh: '▶ 重新播放' },
  'orch.tab.live': { en: '● Live Feed + Reasoning', zh: '● 实时消息 + 推理' },
  'orch.tab.tasks': { en: '◈ Task History', zh: '◈ 任务历史' },
  'orch.tab.terminal': { en: '⌘ Agent Terminal', zh: '⌘ Agent 终端' },
  'orch.tab.protocol': { en: '{ } A2A Protocol', zh: '{ } A2A 协议' },
  'orch.feed.title': { en: 'A2A Protocol Message Feed', zh: 'A2A 协议消息流' },
  'orch.feed.messages': { en: 'messages', zh: '条消息' },
  'orch.feed.empty': {
    en: 'Click "Run Scenario" to start the A2A orchestration demo',
    zh: '点击"开始编排"启动 A2A 编排演示',
  },
  'orch.feed.processing': { en: 'Processing', zh: '处理中' },
  'orch.verify.title': { en: 'SAOP Verification', zh: 'SAOP 验证' },
  'orch.verify.onChainVerified': { en: 'On-Chain Verified', zh: '链上已验证' },
  'orch.verify.mismatch': { en: 'Verification Mismatch', zh: '验证不匹配' },
  'orch.verify.connectWallet': { en: 'Connect wallet to submit verification digest to Solana Devnet', zh: '连接钱包以将验证摘要提交到 Solana Devnet' },
  'orch.verify.submit': { en: 'Submit Verification to Solana', zh: '提交验证到 Solana' },
  'orch.verify.signing': { en: 'Waiting for wallet signature...', zh: '等待钱包签名...' },
  'orch.verify.confirming': { en: 'Confirming on Solana Devnet...', zh: '在 Solana Devnet 上确认中...' },
  'orch.verify.failed': { en: 'Transaction failed', zh: '交易失败' },
  'orch.verify.confirmed': { en: 'Transaction Confirmed', zh: '交易已确认' },
  'orch.verify.onChainNote': { en: 'Memo data is now permanently recorded on Solana Devnet. Anyone can independently verify the orchestration flow.', zh: 'Memo 数据已永久记录在 Solana Devnet 上。任何人都可以独立验证编排流程。' },
  'orch.verify.retry': { en: 'Retry', zh: '重试' },
  'orch.jupiter.route': { en: 'Jupiter Route', zh: 'Jupiter 路由' },

  // --- Tools page ---
  'tools.title': { en: 'MCP Tools Explorer', zh: 'MCP 工具浏览器' },
  'tools.subtitle': {
    en: 'Tools exposed by Metaplex-registered agents via Model Context Protocol',
    zh: 'Metaplex 注册 Agent 通过 Model Context Protocol 暴露的工具',
  },
  'tools.params': { en: 'Parameters', zh: '参数' },
  'tools.noParams': { en: 'No parameters required', zh: '无需参数' },
  'tools.showExample': { en: '▶ Show Example', zh: '▶ 显示示例' },
  'tools.hideExample': { en: '▼ Hide Example', zh: '▼ 隐藏示例' },
  'tools.tryTerminal': { en: 'Try in Terminal', zh: '在终端中尝试' },
  'tools.request': { en: 'Request', zh: '请求' },
  'tools.response': { en: 'Response', zh: '响应' },
  'tools.tools': { en: 'tools', zh: '个工具' },
  'tools.mcpConfig.title': { en: 'MCP Server Configuration', zh: 'MCP Server 配置' },
  'tools.mcpConfig.desc': {
    en: 'Add these servers to your MCP client (Claude Desktop, Cursor, etc.) to connect directly to SolAgent Hub agents.',
    zh: '将这些服务器添加到你的 MCP 客户端（Claude Desktop、Cursor 等）以直接连接 SolAgent Hub Agent。',
  },
  'tools.param.name': { en: 'Name', zh: '名称' },
  'tools.param.type': { en: 'Type', zh: '类型' },
  'tools.param.required': { en: 'Required', zh: '必填' },
  'tools.param.description': { en: 'Description', zh: '描述' },
  'tools.param.yes': { en: 'yes', zh: '是' },
  'tools.param.no': { en: 'no', zh: '否' },

  // --- Wallet ---
  'wallet.connect': { en: 'Connect Wallet', zh: '连接钱包' },
  'wallet.connecting': { en: 'Connecting...', zh: '连接中...' },
  'wallet.selectTitle': { en: 'Connect Wallet', zh: '连接钱包' },
  'wallet.selectDesc': {
    en: 'Select a wallet to connect to SolAgent Hub on Devnet',
    zh: '选择一个钱包连接到 SolAgent Hub Devnet',
  },
  'wallet.copy': { en: 'Copy Address', zh: '复制地址' },
  'wallet.copied': { en: 'Copied!', zh: '已复制!' },
  'wallet.viewExplorer': { en: 'View on Explorer', zh: '在浏览器中查看' },
  'wallet.disconnect': { en: 'Disconnect', zh: '断开连接' },

  // --- DevnetStatus ---
  'devnet.connected': { en: 'Devnet Connected', zh: 'Devnet 已连接' },
  'devnet.connecting': { en: 'Connecting...', zh: '连接中...' },
  'devnet.unavailable': { en: 'Devnet Unavailable', zh: 'Devnet 不可用' },
  'devnet.retry': { en: 'Retry', zh: '重试' },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'solagent-lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] ?? key;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
