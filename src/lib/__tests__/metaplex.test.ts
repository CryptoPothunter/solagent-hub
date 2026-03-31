import { describe, it, expect } from 'vitest';
import {
  deriveAgentIdentityPda,
  deriveAssetSignerPda,
  deriveExecutiveProfilePda,
  buildRegistrationDocument,
  AGENT_REGISTRY_PROGRAM_ID,
} from '../metaplex';

const KNOWN_ASSET = 'ALSwAJHKiSF8CWCYqadoAcrYQkJc8dd8pwhWygqKsWN2';

describe('deriveAgentIdentityPda', () => {
  it('produces deterministic output for a known asset key', () => {
    const a = deriveAgentIdentityPda(KNOWN_ASSET);
    const b = deriveAgentIdentityPda(KNOWN_ASSET);
    expect(a.pda).toBe(b.pda);
    expect(a.bump).toBe(b.bump);
  });

  it('returns a bump value between 0 and 255', () => {
    const { bump } = deriveAgentIdentityPda(KNOWN_ASSET);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
  });

  it('returns a valid base58 PDA string (32+ chars)', () => {
    const { pda } = deriveAgentIdentityPda(KNOWN_ASSET);
    expect(pda.length).toBeGreaterThanOrEqual(32);
    expect(pda).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it('produces different PDAs for different inputs', () => {
    const a = deriveAgentIdentityPda(KNOWN_ASSET);
    const b = deriveAgentIdentityPda('9zUL5izBErPh6ErkszZbsWW4EkWYSckuc4d3hrJKnAYC');
    expect(a.pda).not.toBe(b.pda);
  });

  it('falls back gracefully for invalid input', () => {
    const { pda } = deriveAgentIdentityPda('not-a-real-key');
    expect(pda).toContain('PDA_');
    expect(pda).toContain('Identity');
  });
});

describe('deriveAssetSignerPda', () => {
  it('produces deterministic output and valid base58 PDA', () => {
    const a = deriveAssetSignerPda(KNOWN_ASSET);
    const b = deriveAssetSignerPda(KNOWN_ASSET);
    expect(a.pda).toBe(b.pda);
    expect(a.bump).toBe(b.bump);
    expect(a.pda.length).toBeGreaterThanOrEqual(32);
    expect(a.pda).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it('derives a different PDA than deriveAgentIdentityPda for the same input', () => {
    const identity = deriveAgentIdentityPda(KNOWN_ASSET);
    const signer = deriveAssetSignerPda(KNOWN_ASSET);
    expect(identity.pda).not.toBe(signer.pda);
  });

  it('falls back gracefully for invalid input', () => {
    const { pda } = deriveAssetSignerPda('invalid');
    expect(pda).toContain('WAL_');
    expect(pda).toContain('Signer');
  });
});

describe('deriveExecutiveProfilePda', () => {
  it('produces deterministic output and valid base58 PDA', () => {
    const authority = '9zUL5izBErPh6ErkszZbsWW4EkWYSckuc4d3hrJKnAYC';
    const a = deriveExecutiveProfilePda(authority);
    const b = deriveExecutiveProfilePda(authority);
    expect(a.pda).toBe(b.pda);
    expect(a.bump).toBeGreaterThanOrEqual(0);
    expect(a.bump).toBeLessThanOrEqual(255);
    expect(a.pda).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it('falls back gracefully for invalid input', () => {
    const { pda } = deriveExecutiveProfilePda('bad-key');
    expect(pda).toContain('EXEC_');
    expect(pda).toContain('Profile');
  });
});

describe('buildRegistrationDocument', () => {
  const baseParams = {
    name: 'Test Agent',
    description: 'A test agent',
    image: '/agents/test.svg',
    services: [{ name: 'A2A', endpoint: 'https://example.com/agent-card.json', version: '0.3.0' }],
    agentId: KNOWN_ASSET,
  };

  it('produces correct ERC-8004 structure with required fields', () => {
    const doc = buildRegistrationDocument(baseParams) as Record<string, unknown>;
    expect(doc.type).toBe('https://eips.ethereum.org/EIPS/eip-8004#registration-v1');
    expect(doc.name).toBe('Test Agent');
    expect(doc.description).toBe('A test agent');
    expect(doc.image).toBe('/agents/test.svg');
    expect(doc.active).toBe(true);
    expect(doc.services).toHaveLength(1);
    expect(doc.registrations).toEqual([{ agentId: KNOWN_ASSET, agentRegistry: 'solana:101:metaplex' }]);
    expect(doc.supportedTrust).toEqual(['reputation', 'crypto-economic']);
  });

  it('omits saop field when saopEndpoint is not provided', () => {
    const doc = buildRegistrationDocument(baseParams) as Record<string, unknown>;
    expect(doc).not.toHaveProperty('saop');
  });

  it('includes SAOP extension when saopEndpoint is provided', () => {
    const doc = buildRegistrationDocument({ ...baseParams, saopEndpoint: 'https://example.com/saop' }) as Record<string, unknown>;
    expect(doc).toHaveProperty('saop');
    const saop = doc.saop as Record<string, unknown>;
    expect(saop.version).toBe('0.1.0');
    expect(saop.orchestrationEndpoint).toBe('https://example.com/saop');
    expect(saop.verificationSupported).toBe(true);
    expect(saop.settlementMint).toBe('So11111111111111111111111111111111111111112');
  });
});

describe('AGENT_REGISTRY_PROGRAM_ID', () => {
  it('matches the expected program ID', () => {
    expect(AGENT_REGISTRY_PROGRAM_ID.toBase58()).toBe('1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p');
  });
});
