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

## Overview

SolAgent Hub enables the discovery, registration, and orchestration of autonomous AI agents on Solana through Metaplex's on-chain Agent Registry. It provides a complete lifecycle for agent coordination:

- **Discover** agents registered on-chain via Metaplex PDAs
- **Register** new agents with full identity, executive profiles, and delegation capabilities
- **Orchestrate** multi-agent workflows using the A2A protocol with real-time task routing
- **Execute** delegated operations through on-chain executive profiles
- **Settle** trustlessly via PDA-based Asset Signer wallets on Solana L1

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
