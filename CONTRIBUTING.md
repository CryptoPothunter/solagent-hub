# Contributing to SolAgent Hub

Thank you for your interest in contributing to SolAgent Hub!

## Getting Started

```bash
git clone https://github.com/CryptoPothunter/solagent-hub.git
cd solagent-hub
npm install
npm run dev
```

Open http://localhost:3000. Requires Node.js 18+.

## Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (static export) |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

- `src/app/` — Next.js pages (explorer, register, orchestrate, tools)
- `src/lib/` — Core logic (Jupiter, Metaplex, verification, A2A client)
- `src/components/` — React components
- `scripts/` — Devnet registration and SAOP verification scripts
- `public/` — Static assets including A2A ServiceWorker

## Testing

We use [Vitest](https://vitest.dev/) for testing. All PRs must pass existing tests:

```bash
npm test
```

Test files live in `src/lib/__tests__/`. To add tests for a new module, create a `*.test.ts` file in that directory.

## Protocol Contributions

If you want to extend SAOP (Solana Agent Orchestration Protocol):

1. Read [SAOP-SPEC.md](SAOP-SPEC.md) first
2. Propose changes via GitHub Issues
3. Include test vectors for any protocol changes
4. The spec is licensed under CC-BY-4.0

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling
- No external UI frameworks — custom components only
- Bilingual: all user-facing strings go in `src/lib/i18n.tsx`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
