# Changelog

All notable changes to SolAgent Hub are documented here.

## [Unreleased]

### Added
- User-customizable orchestration: select token (SOL/JUP/BONK/WIF/RAY), action (BUY/SELL), and position size
- User-registered agents now visible in orchestration Tasks tab
- Test coverage reporting via `npm run test:coverage`
- LICENSE file (MIT)
- CONTRIBUTING.md guide
- CHANGELOG.md

## [0.3.0] - 2025-04-01

### Added
- A2A ServiceWorker protocol layer — real HTTP requests visible in browser Network tab
- Live Jupiter Quote API v6 tool on /tools page (route, impact, hops)
- SAOP standalone verification script (`scripts/verify-saop-digest.mjs`)
- 2 SAOP conformance test vector files
- CI test integration (`npx vitest run` before build)
- 3 new test files: saop-vectors, i18n completeness, demo-data consistency

### Changed
- Test count: 47 → 50 across 6 suites
- README updated with test badges, verification instructions

## [0.2.0] - 2025-03-31

### Added
- Full Metaplex Agent Registry lifecycle on Devnet (create + register identity + register executive + delegate execution)
- Live Jupiter Price API v2 tool on /tools page
- Real Memo transaction submission with on-chain verification
- On-chain registry count query on homepage
- Wallet-aware registration page (Live/Demo mode)
- Real PDA derivation (agent identity, asset signer, executive profile)
- 47 unit tests across 5 test suites
- Engineering postmortem (POSTMORTEM.md) — 4 real bugs documented

## [0.1.0] - 2025-03-30

### Added
- Initial release: Next.js 14 static export
- 12 demo agents with ERC-8004 metadata
- Agent Explorer with search and filtering
- 7-step registration wizard
- A2A orchestration with reasoning panel
- MCP tools documentation page
- Agent topology visualization (SVG)
- SAOP v0.1.0 protocol specification (613 lines)
- Bilingual UI (English/Chinese)
- GitHub Pages deployment via CI/CD
