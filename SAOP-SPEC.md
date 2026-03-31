# SAOP: Solana Agent Orchestration Protocol

**Version:** 0.1.0
**Status:** Draft
**Created:** 2026-03-31
**Authors:** @CryptoPothunter

---

## Abstract

This document specifies **SAOP (Solana Agent Orchestration Protocol)**, a protocol
standard for coordinating autonomous AI agents on the Solana blockchain. SAOP
introduces a four-layer orchestration architecture that bridges Google's
Agent-to-Agent (A2A) protocol and Anthropic's Model Context Protocol (MCP) with
Solana Layer 1 primitives — including the Metaplex Agent Registry, the Memo
Program, and PDA-based Asset Signer wallets.

SAOP defines normative rules for agent discovery, task routing, cryptographic
verification of orchestration flows, and trustless micro-payment settlement. The
goal is to establish an open, permissionless standard so that any compliant agent
can participate in multi-agent workflows with on-chain auditability and economic
incentives — without requiring a centralized coordinator.

## 1. Motivation

The emergence of autonomous AI agents has created a need for standardized
inter-agent communication. Google's A2A protocol addresses point-to-point agent
messaging, and Anthropic's MCP provides a uniform interface between agents and
external tools. However, neither protocol addresses:

1. **On-chain agent identity.** Agents lack a decentralized, tamper-proof
   registry. DNS-based discovery is centralized and censorable.
2. **Orchestration integrity.** There is no mechanism to prove that a sequence of
   agent interactions occurred in a specific order with specific payloads. Any
   party can fabricate or reorder message logs after the fact.
3. **Trustless settlement.** When agents perform work on behalf of other agents
   (or human principals), there is no native payment rail. Off-chain settlement
   reintroduces counterparty risk.
4. **Composable routing.** Multi-agent workflows require routing logic — priority
   queues, capability matching, fallback strategies — that neither A2A nor MCP
   prescribe.

Solana's sub-second finality, negligible transaction costs (~0.000005 SOL per
memo instruction), and programmable accounts (PDAs) make it uniquely suited to
serve as the settlement and verification substrate for agent orchestration.

SAOP fills the gap between existing agent communication protocols and on-chain
infrastructure by defining a complete orchestration lifecycle — from discovery to
settlement — with cryptographic guarantees anchored to Solana L1.

## 2. Protocol Overview

SAOP is a **middleware protocol** that sits between application-layer agent
protocols (A2A, MCP) and the Solana L1 execution environment. It does not
replace A2A or MCP; it orchestrates them.

```
┌─────────────────────────────────────────────────┐
│           Application / User Interface           │
├─────────────────────────────────────────────────┤
│  A2A Protocol    │    MCP Protocol               │
├─────────────────────────────────────────────────┤
│            ╔═══════════════════════╗             │
│            ║    SAOP v0.1.0       ║             │
│            ║  ┌─────────────────┐ ║             │
│            ║  │ Discovery Layer │ ║             │
│            ║  │ Routing Layer   │ ║             │
│            ║  │ Verification    │ ║             │
│            ║  │ Settlement      │ ║             │
│            ║  └─────────────────┘ ║             │
│            ╚═══════════════════════╝             │
├─────────────────────────────────────────────────┤
│  Solana L1: Metaplex Registry │ Memo │ PDAs     │
└─────────────────────────────────────────────────┘
```

A conforming implementation MUST support all four layers. Each layer is described
in detail in Section 4.

## 3. Terminology

The key words "MUST", "MUST NOT", "SHOULD", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

| Term | Definition |
|---|---|
| **Orchestrator** | A SAOP node responsible for coordinating a Task Flow across multiple Agent Nodes. The Orchestrator resolves agent capabilities, routes tasks, computes verification digests, and initiates settlement transactions. |
| **Agent Node** | Any autonomous agent registered in the Metaplex Agent Registry that exposes a conforming `agent-card.json` with the SAOP extension. Agent Nodes receive tasks, execute them, and return results via A2A or MCP. |
| **Task Flow** | An ordered sequence of tasks distributed across one or more Agent Nodes, identified by a unique `flow_id` (UUIDv4). A Task Flow has a defined lifecycle (Section 6). |
| **Verification Digest** | A SHA-256 hash of the concatenated, canonicalized A2A/MCP messages within a Task Flow. The digest is published to Solana via the Memo Program for tamper-evident auditability. |
| **Settlement PDA** | A Program Derived Address controlled by an Asset Signer program that holds SOL escrowed for a Task Flow. Funds are released to Agent Nodes upon successful verification. |
| **Agent Card** | A JSON document (conforming to the A2A `agent-card.json` schema) that advertises an agent's capabilities, endpoint, and SAOP-specific metadata. |
| **Flow Nonce** | A monotonically increasing integer scoped to an Orchestrator, used to prevent replay attacks on settlement transactions. |

## 4. Architecture

### 4.1 Discovery Layer

Agent discovery is performed through the **Metaplex Agent Registry**, a Solana
program that stores on-chain metadata linking an agent's public key to its
`agent-card.json` URI.

**Resolution flow:**

1. The Orchestrator queries the Metaplex Agent Registry by capability tags
   (e.g., `["defi", "swap", "jupiter"]`).
2. The registry returns a set of `(pubkey, metadata_uri)` tuples.
3. The Orchestrator fetches each `agent-card.json` from the metadata URI
   (typically Arweave or IPFS) and parses the `saop` extension field (Section 8).
4. Agents that satisfy the required capabilities and SAOP version constraint are
   added to the candidate pool.

Implementations MUST cache agent cards with a TTL no greater than 300 seconds.
Implementations MUST validate that the agent card is signed by the corresponding
on-chain public key.

### 4.2 Routing Layer

The Routing Layer selects Agent Nodes from the candidate pool and assigns tasks.

**Routing rules (applied in order):**

| Priority | Rule | Description |
|----------|------|-------------|
| 1 | Capability match | Agent MUST declare all required capabilities in its card. |
| 2 | Availability | Agent MUST respond to a health-check (`GET /saop/health`) within 2000ms. |
| 3 | Cost preference | If the Task Flow specifies `max_cost_lamports`, exclude agents whose `saop.cost_per_task` exceeds the budget. |
| 4 | Reputation score | Prefer agents with higher on-chain settlement success ratios. |
| 5 | Latency | Prefer agents with lower historical p95 response times. |

**Failure fallback:** If an assigned Agent Node fails to acknowledge a task
within the configured timeout (default: 10 seconds), the Orchestrator MUST
re-route to the next candidate. A maximum of 3 retry attempts is RECOMMENDED
before the Task Flow transitions to a `FAILED` state.

### 4.3 Verification Layer

The Verification Layer computes a cryptographic digest of the entire Task Flow
message log and publishes it to Solana. The detailed algorithm is specified in
Section 5.

The Solana **Memo Program** (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) is
used as the publication mechanism. Memo instructions are included in the same
transaction as the settlement instruction, ensuring atomicity: verification and
payment are coupled in a single Solana transaction.

### 4.4 Settlement Layer

Settlement is performed through **PDA-based Asset Signer wallets**. Before a
Task Flow begins, the principal (human or agent) deposits SOL into a Settlement
PDA derived from deterministic seeds:

```
seeds = ["saop", orchestrator_pubkey, flow_id_bytes]
```

Upon successful verification, the Orchestrator's program invokes a
`settle_flow` instruction that:

1. Validates the verification digest matches the on-chain memo.
2. Distributes SOL from the PDA to each participating Agent Node according to
   the pre-agreed cost schedule.
3. Increments the Flow Nonce to prevent replays.
4. Closes the PDA and returns any remaining rent-exempt balance to the principal.

## 5. Verification Digest Specification

The Verification Digest provides tamper-evident proof that a specific sequence
of agent messages occurred during a Task Flow.

### 5.1 Canonicalization

All A2A and MCP messages exchanged during a Task Flow MUST be collected by the
Orchestrator. Each message is represented as a JSON object containing at minimum:

```json
{
  "message_id": "uuid-v4",
  "flow_id": "uuid-v4",
  "sender": "agent_pubkey_base58",
  "receiver": "agent_pubkey_base58",
  "timestamp": "2026-03-31T12:00:00.000Z",
  "payload": { ... }
}
```

### 5.2 Ordering

Messages MUST be sorted by `timestamp` (ascending, ISO 8601). If two messages
share an identical timestamp, they MUST be further sorted by `message_id`
(lexicographic, ascending).

### 5.3 Concatenation

The sorted messages are JSON-stringified individually (no whitespace, keys
sorted alphabetically via deterministic serialization) and concatenated into a
single byte string with no delimiter:

```
concat = JSON.stringify(msg_0) + JSON.stringify(msg_1) + ... + JSON.stringify(msg_n)
```

### 5.4 Hashing

The SHA-256 hash is computed over the UTF-8 encoded byte representation of
`concat`:

```
digest = SHA-256(UTF8_ENCODE(concat))
```

The result is a 32-byte value, represented as a 64-character lowercase
hexadecimal string.

### 5.5 On-Chain Storage Format

The digest is published via a Solana Memo instruction with the following format:

```
SAOP:v1:<flow_id>:<sha256_hex>
```

**Example:**

```
SAOP:v1:a1b2c3d4-e5f6-7890-abcd-ef1234567890:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

The total memo length MUST NOT exceed 566 bytes (5 bytes prefix + 1 colon + 2
bytes version + 1 colon + 36 bytes UUID + 1 colon + 64 bytes hex + overhead).

### 5.6 Third-Party Verification

Any party with access to the original message log can independently verify a
Task Flow by:

1. Collecting all messages for the given `flow_id`.
2. Applying the canonicalization, ordering, and hashing steps above.
3. Comparing the resulting hex digest against the value stored in the on-chain
   memo transaction.

If the digests match, the message log is authentic and unmodified.

## 6. Task Flow Lifecycle

A Task Flow progresses through a deterministic state machine:

```
  CREATED ──► ROUTING ──► EXECUTING ──► VERIFYING ──► SETTLED ──► COMPLETED
     │            │            │             │            │
     └────────────┴────────────┴─────────────┴────────────┘
                          │
                       FAILED
```

| State | Entry Condition | Orchestrator Action |
|-------|----------------|---------------------|
| `CREATED` | Principal submits a Task Flow request with escrow deposit. | Validate request schema; derive Settlement PDA; confirm escrow received. |
| `ROUTING` | Escrow confirmed on-chain. | Query Discovery Layer; apply Routing Layer rules; assign Agent Nodes. |
| `EXECUTING` | All Agent Nodes acknowledged task assignments. | Forward A2A/MCP messages; collect responses; enforce timeouts. |
| `VERIFYING` | All tasks returned results (or terminal errors). | Compute Verification Digest (Section 5); construct memo instruction. |
| `SETTLED` | Memo + settlement transaction confirmed on Solana. | Distribute SOL from PDA to Agent Nodes per cost schedule. |
| `COMPLETED` | All distributions confirmed; PDA closed. | Emit completion event; archive flow log. |
| `FAILED` | Any unrecoverable error (exhausted retries, invalid digest, insufficient escrow). | Refund remaining escrow to principal; emit failure event with reason code. |

State transitions MUST be logged locally by the Orchestrator. Implementations
SHOULD expose a `GET /saop/flows/{flow_id}/status` endpoint returning the
current state and transition timestamps.

## 7. Settlement Rules

### 7.1 Escrow Deposit

Before a Task Flow enters the `ROUTING` state, the principal MUST transfer SOL
to the Settlement PDA. The amount MUST be greater than or equal to the sum of
all `cost_per_task` values for the anticipated Agent Nodes, plus a 1% protocol
fee (rounded up to the nearest lamport).

```
required_escrow = Σ(agent_cost_per_task) × task_count + protocol_fee
```

### 7.2 Distribution

Upon reaching the `SETTLED` state, the settlement program distributes funds in a
single atomic transaction containing:

1. One Memo instruction with the Verification Digest.
2. One or more SOL transfer instructions from the PDA to each Agent Node.
3. One SOL transfer for the protocol fee to the protocol treasury.

### 7.3 Refund Policy

If a Task Flow transitions to `FAILED`:

- Funds for **unexecuted** tasks are returned in full to the principal.
- Funds for **executed but unverified** tasks MAY be held in escrow for a
  dispute window of 72 hours (configurable by the Orchestrator).
- After the dispute window, unclaimed funds are returned to the principal.

### 7.4 Minimum Payment

The minimum payment per task is **1,000 lamports** (0.000001 SOL). Payments
below this threshold MUST be rejected by the settlement program.

## 8. Agent Card Extension

SAOP extends the standard A2A `agent-card.json` with an OPTIONAL `saop` field.
Agents that wish to participate in SAOP-orchestrated flows MUST include this
field.

```json
{
  "name": "JupiterSwapAgent",
  "description": "Executes token swaps via Jupiter aggregator",
  "url": "https://agent.example.com",
  "capabilities": ["defi", "swap", "jupiter"],
  "saop": {
    "version": "0.1.0",
    "solana_pubkey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "cost_per_task": 50000,
    "supported_flows": ["swap", "quote", "route"],
    "health_endpoint": "/saop/health",
    "max_concurrent_tasks": 10,
    "settlement_token": "SOL",
    "metaplex_registry_id": "MetaplexRegistryAddressBase58..."
  }
}
```

**Field definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | SAOP protocol version (semver). |
| `solana_pubkey` | string | Yes | Base58-encoded Solana public key for receiving settlements. |
| `cost_per_task` | integer | Yes | Cost in lamports per task execution. |
| `supported_flows` | string[] | Yes | List of flow types this agent can participate in. |
| `health_endpoint` | string | Yes | Relative path for health checks. |
| `max_concurrent_tasks` | integer | No | Maximum parallel tasks accepted. Default: 1. |
| `settlement_token` | string | No | Token for settlement. Currently only `"SOL"` is supported. |
| `metaplex_registry_id` | string | No | On-chain address of the agent's Metaplex Registry entry. |

## 9. Security Considerations

### 9.1 Replay Protection

Each settlement transaction includes a **Flow Nonce** — a monotonically
increasing counter scoped to the Orchestrator's public key and stored in a
dedicated PDA. The settlement program MUST reject any transaction where the
provided nonce is less than or equal to the last processed nonce. This prevents
an attacker from resubmitting a previously settled flow to extract duplicate
payments.

### 9.2 Rate Limiting

Orchestrators SHOULD enforce rate limits on incoming Task Flow requests to
prevent resource exhaustion. Recommended defaults:

- **10 concurrent flows** per principal.
- **100 tasks per minute** per Agent Node.
- **1,000 memo instructions per hour** per Orchestrator.

Agent Nodes SHOULD reject tasks that exceed their declared
`max_concurrent_tasks` and respond with HTTP 429.

### 9.3 PDA Authority Checks

The settlement program MUST verify that the `settle_flow` instruction is signed
by the Orchestrator whose public key was used to derive the Settlement PDA. No
other account may invoke distribution. The PDA derivation is deterministic and
auditable:

```
PDA = findProgramAddress(["saop", orchestrator_pubkey, flow_id], PROGRAM_ID)
```

### 9.4 Message Integrity

All A2A messages exchanged during a Task Flow SHOULD be signed by the sending
agent's Solana keypair. The Orchestrator MUST discard unsigned messages if the
flow's `require_signatures` flag is set to `true`.

### 9.5 Denial-of-Service Mitigation

Orchestrators MUST require an escrow deposit before routing tasks. This
economically disincentivizes spam flows. Agent Nodes MAY require a minimum
escrow threshold before accepting assignments.

### 9.6 Key Rotation

Agent Nodes MAY rotate their Solana keypair by updating their Metaplex Registry
entry and `agent-card.json`. During a rotation window, the previous key MUST
remain valid for settlement of in-flight flows. Implementations SHOULD support a
grace period of at least 1 hour.

## 10. Reference Implementation

The reference implementation of SAOP v0.1.0 is provided by the **SolAgent Hub**
project:

- **Repository:** [github.com/solagent-hub](https://github.com/solagent-hub)
- **Language:** TypeScript (Next.js frontend + Solana program client)
- **On-chain programs:** Anchor-based Solana programs for settlement and nonce management
- **Agent runtime:** Node.js orchestrator with A2A and MCP client adapters

The reference implementation is intended for demonstration and testing purposes.
Production deployments SHOULD undergo independent security audits of the
settlement program before handling material value.

### 10.1 Conformance

An implementation is **SAOP-conformant** if it:

1. Implements all four architectural layers (Section 4).
2. Correctly computes Verification Digests per Section 5.
3. Follows the Task Flow lifecycle state machine (Section 6).
4. Enforces Settlement Rules (Section 7).
5. Publishes a valid `agent-card.json` with the `saop` extension (Section 8).
6. Implements the security measures described in Section 9.

## 11. Authors & Acknowledgments

- **@CryptoPothunter** — Protocol design, specification authoring, reference implementation

### Acknowledgments

This specification builds upon foundational work by:

- **Google DeepMind** — Agent-to-Agent (A2A) Protocol
- **Anthropic** — Model Context Protocol (MCP)
- **Metaplex Foundation** — Metaplex Agent Registry and Digital Asset Standard
- **Solana Foundation** — Solana runtime, Memo Program, and PDA primitives

SAOP is an independent protocol specification and is not affiliated with or
endorsed by any of the above organizations.

---

*Copyright 2026 SolAgent Hub Contributors. This specification is released under CC-BY-4.0.*
