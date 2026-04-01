import { describe, it, expect } from 'vitest';
import { TOKEN_MINTS, formatQuoteSummary, getJupiterPrices, getJupiterQuote } from '../jupiter';
import type { JupiterQuote } from '../jupiter';

describe('TOKEN_MINTS', () => {
  it('should contain correct SOL mint address', () => {
    expect(TOKEN_MINTS.SOL).toBe('So11111111111111111111111111111111111111112');
  });

  it('should contain correct USDC mint address', () => {
    expect(TOKEN_MINTS.USDC).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });

  it('should have all expected tokens', () => {
    const expectedTokens = ['SOL', 'USDC', 'USDT', 'JUP', 'BONK', 'RAY', 'ORCA', 'WIF'];
    for (const token of expectedTokens) {
      expect(TOKEN_MINTS[token]).toBeDefined();
      expect(TOKEN_MINTS[token].length).toBeGreaterThan(30); // Valid base58 pubkey
    }
  });
});

describe('formatQuoteSummary', () => {
  it('should format a single-hop route correctly', () => {
    const quote: JupiterQuote = {
      inputMint: TOKEN_MINTS.USDC,
      outputMint: TOKEN_MINTS.SOL,
      inAmount: '280000000',
      outAmount: '1500000000',
      priceImpactPct: '0.0012',
      routePlan: [
        {
          swapInfo: {
            ammKey: 'test-amm',
            label: 'Raydium',
            inputMint: TOKEN_MINTS.USDC,
            outputMint: TOKEN_MINTS.SOL,
            inAmount: '280000000',
            outAmount: '1500000000',
            feeAmount: '140000',
            feeMint: TOKEN_MINTS.USDC,
          },
          percent: 100,
        },
      ],
    };

    const result = formatQuoteSummary(quote, 'USDC', 'SOL');
    expect(result).toContain('Raydium');
    expect(result).toContain('USDC');
    expect(result).toContain('SOL');
    expect(result).toContain('0.0012');
  });

  it('should format a multi-hop route correctly', () => {
    const quote: JupiterQuote = {
      inputMint: TOKEN_MINTS.BONK,
      outputMint: TOKEN_MINTS.SOL,
      inAmount: '1000000000000',
      outAmount: '500000000',
      priceImpactPct: '0.15',
      routePlan: [
        {
          swapInfo: {
            ammKey: 'amm1',
            label: 'Raydium',
            inputMint: TOKEN_MINTS.BONK,
            outputMint: TOKEN_MINTS.USDC,
            inAmount: '1000000000000',
            outAmount: '100000000',
            feeAmount: '500000',
            feeMint: TOKEN_MINTS.BONK,
          },
          percent: 100,
        },
        {
          swapInfo: {
            ammKey: 'amm2',
            label: 'Orca',
            inputMint: TOKEN_MINTS.USDC,
            outputMint: TOKEN_MINTS.SOL,
            inAmount: '100000000',
            outAmount: '500000000',
            feeAmount: '50000',
            feeMint: TOKEN_MINTS.USDC,
          },
          percent: 100,
        },
      ],
    };

    const result = formatQuoteSummary(quote, 'BONK', 'SOL');
    expect(result).toContain('Raydium');
    expect(result).toContain('Orca');
    expect(result).toContain('BONK');
    expect(result).toContain('SOL');
  });
});

describe('getJupiterPrices', () => {
  it('should return empty object for empty symbols array', async () => {
    const result = await getJupiterPrices([]);
    expect(result).toEqual({});
  });

  it('should return empty object for unknown symbols', async () => {
    const result = await getJupiterPrices(['UNKNOWN_TOKEN_XYZ']);
    expect(result).toEqual({});
  });
});

describe('getJupiterQuote', () => {
  it('should return null for unknown input symbol', async () => {
    const result = await getJupiterQuote({ inputSymbol: 'FAKE', outputSymbol: 'SOL', amount: 1000 });
    expect(result).toBeNull();
  });

  it('should return null for unknown output symbol', async () => {
    const result = await getJupiterQuote({ inputSymbol: 'SOL', outputSymbol: 'FAKE', amount: 1000 });
    expect(result).toBeNull();
  });
});
