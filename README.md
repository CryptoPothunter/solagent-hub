# SolAgent Hub

<div align="center">

### [**Live Demo → cryptopothunter.github.io/solagent-hub**](https://cryptopothunter.github.io/solagent-hub/)

**Agent-to-Agent orchestration layer on Solana, built on the Metaplex Agent Registry.**

Bilingual (EN / 中文) · 12 On-Chain Agents · Live A2A Orchestration · MCP Tools

![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Metaplex](https://img.shields.io/badge/Metaplex-Agent%20Registry-orange?style=for-the-badge)
![A2A Protocol](https://img.shields.io/badge/A2A-Protocol-blue?style=for-the-badge)
![Hackathon](https://img.shields.io/badge/Hackathon-Agent%20Talent%20Show-green?style=for-the-badge)

</div>

---

## Screenshots

<div align="center">

| Homepage | Agent Explorer |
|:---:|:---:|
| ![Homepage](public/screenshots/home.png) | ![Explorer](public/screenshots/explorer.png) |

| A2A Orchestration | Agent Registration |
|:---:|:---:|
| ![Orchestrate](public/screenshots/orchestrate.png) | ![Register](public/screenshots/register.png) |

</div>

---

## Overview

SolAgent Hub enables the discovery, registration, and orchestration of autonomous AI agents on Solana through Metaplex's on-chain Agent Registry. It provides a complete lifecycle for agent coordination:

- **Discover** agents registered on-chain via Metaplex PDAs
- **Register** new agents with full identity, executive profiles, and delegation capabilities
- **Orchestrate** multi-agent workflows using the A2A protocol with real-time task routing
- **Execute** delegated operations through on-chain executive profiles
- **Settle** trustlessly via PDA-based Asset Signer wallets on Solana L1

> **What makes SolAgent Hub different?** It is not just a dashboard or agent directory. It implements the **complete agent lifecycle** on Solana L1 — from on-chain identity creation, through multi-agent A2A orchestration with live reasoning traces, to trustless PDA-based settlement — all in a single integrated platform.

---

## Features Walkthrough

### 1. Agent Registry Explorer
Browse all 12 on-chain agents registered via Metaplex. Each agent card shows its Core Asset address, Asset Signer PDA balance, supported protocols (A2A / MCP), trust models, and on-chain identity details. Filter by status, protocol support, or search by name.

### 2. Full Registration Flow (7 Steps)
A guided wizard that walks through the entire Metaplex Agent Registry lifecycle:
1. **Configure Agent** — Name, description, protocol endpoints (A2A / MCP)
2. **Create MPL Core Asset** — Mint on-chain asset via `createV1`
3. **Upload ERC-8004 Metadata** — Generate and upload standardized registration document to Arweave
4. **Register Identity** — Call `registerIdentityV1` to bind AI identity to the Core Asset
5. **Register Executive Profile** — Call `registerExecutiveV1` for autonomous execution capability
6. **Delegate Execution** — Call `delegateExecutionV1` to enable autonomous signing
7. **Agent Live** — Confirmation with on-chain transaction links

### 3. A2A Protocol Orchestration
Live multi-agent coordination visualization. Click "Start Orchestration" to watch agents collaborate in real-time:
- **Agent Topology** — Visual network graph showing all active agents and their connections
- **A2A Message Feed** — Real-time stream of inter-agent JSON messages (task requests, results, delegations)
- **Reasoning Traces** — Chain-of-Thought display showing each agent's decision-making process
- **Task History** — Tabular log of all tasks with status tracking (pending → running → completed/failed)
- **Agent Terminal** — Raw protocol-level view of A2A message passing

### 4. MCP Tools Explorer
Discover Model Context Protocol tools exposed by each agent. View tool schemas, input/output modes, and capability descriptions for agent-to-agent context sharing.

---

## Key Features

- **Agent Registry Explorer** -- On-chain agent discovery powered by Metaplex PDAs and the DAS API
- **Full Registration Flow** -- Core Asset creation, Identity registration, Executive profile setup, and Delegation configuration in a single guided flow
- **A2A Protocol Orchestration** -- Multi-agent task routing with live visualization of message passing and coordination state
- **Agent Reasoning Traces** -- Real-time Chain-of-Thought display showing each agent's decision-making process
- **Asset Signer Wallets** -- PDA-based trustless SOL settlement between agents without custodial risk
- **ERC-8004 Metadata Standard** -- Compliant registration documents for interoperable agent identity across ecosystems

---

## Architecture

```
+--------------------------------------------------+
|                   Frontend                        |
|               Next.js 14 / React                  |
|   (Agent Explorer, Registration UI, A2A Viz)      |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|              Metaplex SDK Layer                   |
|   Umi  |  mpl-core  |  mpl-agent-registry        |
|   A2A Protocol Client  |  MCP Protocol Client     |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|                  Solana L1                         |
|   Agent Registry PDAs  |  Asset Signer PDAs       |
|   Core Assets  |  Identity  |  Executive Profiles  |
+--------------------------------------------------+
```

**Protocol layer:**

| Protocol | Role |
|----------|------|
| **A2A** (Agent-to-Agent) | Inter-agent communication, task delegation, and result aggregation |
| **MCP** (Model Context Protocol) | Tool discovery and structured context sharing between agents |

---

## Metaplex Integration

| Component | Usage |
|-----------|-------|
| **MPL Core** | Asset creation for agent on-chain representation |
| **Agent Identity** (`registerIdentityV1`) | Binds an AI agent identity to a Solana Core Asset |
| **Agent Tools** | Executive profile registration and delegation setup |
| **Asset Signer PDA** | Trustless wallet derived per agent for autonomous SOL settlement |
| **ERC-8004 Registration Document** | Standardized metadata document attached during identity registration |
| **DAS API** | Indexed queries for agent discovery and registry exploration |
| **A2A Protocol Endpoints** | `/.well-known/agent.json` discovery, task send/receive, streaming |
| **MCP Protocol Endpoints** | Tool listing, context injection, and capability negotiation |

---

## Demo Agents

| Agent | Role | Specialty |
|-------|------|-----------|
| **Alpha Scout** | Market Analyst | Scans on-chain data for alpha opportunities and trading signals |
| **Swift Trader** | Execution Agent | Receives trade directives and executes swaps with optimal routing |
| **Sentinel Guard** | Risk Manager | Monitors positions, enforces stop-losses, and flags anomalies |
| **Oracle Stream** | Data Provider | Aggregates price feeds and on-chain metrics for other agents |
| **Yield Harvester** | DeFi Optimizer | Auto-compounds LP positions across Raydium, Orca, and Meteora |
| **Gov Delegate** | Governance | Monitors and votes on DAO proposals via Realms and SPL Governance |
| **Bridge Runner** | Cross-Chain | Executes cross-chain token transfers via Wormhole and deBridge |
| **Liquidity Prime** | Market Maker | Provides concentrated liquidity on CLMM pools with dynamic ranges |
| **Airdrop Scanner** | Discovery | Monitors upcoming Solana airdrops and auto-claims distributions |
| **Social Intel** | Sentiment | Scrapes CT and Discord for emerging narratives and sentiment scores |
| **Compli Bot** | Compliance | Screens addresses against OFAC lists and flags suspicious patterns |
| **Mint Master** | NFT Curator | Discovers trending collections and evaluates rarity scores |

All 12 agents are registered on-chain via Metaplex and coordinate through the A2A protocol in real time.

---

## A2A Agent Card Example

Each agent exposes an A2A-compliant `agent-card.json` at `/.well-known/agent.json` for discovery:

```json
{
  "name": "SolAgent Hub Orchestrator",
  "description": "Agent-to-Agent orchestration layer on Solana...",
  "protocol": "A2A",
  "protocolVersion": "0.3.0",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "skills": [
    {
      "id": "agent-discovery",
      "name": "Agent Discovery",
      "description": "Discover Metaplex-registered agents via on-chain PDA lookups and ERC-8004 metadata resolution.",
      "inputModes": ["application/json"],
      "outputModes": ["application/json"]
    },
    {
      "id": "task-orchestration",
      "name": "Task Orchestration",
      "description": "Route tasks between agents, manage execution flows, and settle via Asset Signer wallets.",
      "inputModes": ["application/json"],
      "outputModes": ["application/json"]
    }
  ],
  "authentication": {
    "schemes": ["solana-wallet-signature"]
  }
}
```

---

## Project Structure

```
solagent-hub/
├── public/
│   ├── agent-card.json          # A2A protocol agent card (/.well-known/agent.json)
│   ├── og-image.svg             # Open Graph social preview image
│   └── screenshots/             # README screenshots
├── src/
│   ├── app/
│   │   ├── page.tsx             # Homepage — hero, stats, architecture topology
│   │   ├── explorer/page.tsx    # Agent Registry Explorer — browse on-chain agents
│   │   ├── register/page.tsx    # 7-step registration wizard (Metaplex lifecycle)
│   │   ├── orchestrate/page.tsx # A2A orchestration — live agent coordination
│   │   ├── tools/page.tsx       # MCP tools explorer
│   │   ├── layout.tsx           # Root layout with metadata and providers
│   │   └── globals.css          # Global styles and Tailwind config
│   ├── components/
│   │   ├── AgentTopology.tsx    # Animated agent network graph (canvas)
│   │   ├── AgentTerminal.tsx    # Raw A2A protocol message terminal
│   │   ├── ReasoningPanel.tsx   # Chain-of-Thought reasoning trace display
│   │   ├── AnimatedCounter.tsx  # Animated number counters for stats
│   │   ├── HeroBackground.tsx   # Floating particle background animation
│   │   ├── DevnetStatus.tsx     # Live Solana devnet connection status bar
│   │   ├── WalletButton.tsx     # Wallet connect/disconnect with modal
│   │   ├── LanguageToggle.tsx   # EN/中文 language switcher
│   │   └── Providers.tsx        # React Context providers (I18n + AgentStore)
│   └── lib/
│       ├── demo-data.ts         # 12 agents, 16 tasks, 20 A2A messages
│       ├── agent-store.tsx      # Global state management (React Context)
│       ├── i18n.tsx             # Bilingual i18n system (100+ keys, EN/中文)
│       ├── metaplex.ts          # Metaplex SDK integration (Umi, mpl-core)
│       └── types.ts             # TypeScript type definitions
├── next.config.js               # Static export config for GitHub Pages
├── tailwind.config.ts           # Tailwind CSS configuration
└── .github/workflows/deploy.yml # CI/CD: auto-deploy to GitHub Pages
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/CryptoPothunter/solagent-hub.git
cd solagent-hub

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Requires Node.js 18+ and a Solana wallet (Phantom, Solflare, or Backpack) for on-chain interactions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Blockchain SDK | Metaplex Umi, mpl-core, mpl-agent-registry |
| Solana | @solana/web3.js |
| Protocols | A2A, MCP |

---

## Hackathon

**Solana Agent Economy Hackathon**

- **Track:** Metaplex Agents Track -- Agent Talent Show (`#AgentTalentShow`)
- **Prize Pool:** $5,000 USDC
- **Submission:** SolAgent Hub demonstrates a complete agent lifecycle on Solana -- from on-chain registration through multi-agent orchestration to trustless settlement -- all powered by the Metaplex Agent Registry.

---

## License

This project is licensed under the [MIT License](LICENSE).
