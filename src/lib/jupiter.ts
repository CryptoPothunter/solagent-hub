// Jupiter API integration — real-time price quotes from Jupiter Aggregator
// Used in SAOP orchestration flows for live market data instead of simulated prices

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';

// Well-known Solana token mints
export const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

export interface JupiterPrice {
  id: string;
  type: string;
  price: string;
  extraInfo?: {
    confidenceLevel: string;
  };
}

export interface JupiterPriceResponse {
  data: Record<string, JupiterPrice>;
  timeTaken: number;
}

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

/**
 * Fetch real-time price for one or more tokens from Jupiter Price API v2.
 * Returns prices in USDC.
 */
export async function getJupiterPrices(symbols: string[]): Promise<Record<string, number>> {
  const mints = symbols
    .map(s => TOKEN_MINTS[s.toUpperCase()])
    .filter(Boolean);

  if (mints.length === 0) return {};

  try {
    const url = `${JUPITER_PRICE_API}?ids=${mints.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jupiter API ${res.status}`);
    const json: JupiterPriceResponse = await res.json();

    const result: Record<string, number> = {};
    for (const symbol of symbols) {
      const mint = TOKEN_MINTS[symbol.toUpperCase()];
      if (mint && json.data[mint]) {
        result[symbol.toUpperCase()] = parseFloat(json.data[mint].price);
      }
    }
    return result;
  } catch (err) {
    console.warn('[Jupiter] Price fetch failed, using fallback:', err);
    return {};
  }
}

/**
 * Get a swap quote from Jupiter for a specific pair and amount.
 */
export async function getJupiterQuote(params: {
  inputSymbol: string;
  outputSymbol: string;
  amount: number; // in base units (lamports for SOL, etc.)
}): Promise<JupiterQuote | null> {
  const inputMint = TOKEN_MINTS[params.inputSymbol.toUpperCase()];
  const outputMint = TOKEN_MINTS[params.outputSymbol.toUpperCase()];

  if (!inputMint || !outputMint) return null;

  try {
    const url = `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${params.amount}&slippageBps=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jupiter Quote API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Jupiter] Quote fetch failed:', err);
    return null;
  }
}

/**
 * Format a Jupiter quote into human-readable summary.
 */
export function formatQuoteSummary(quote: JupiterQuote, inputSymbol: string, outputSymbol: string): string {
  const route = quote.routePlan.map(r => r.swapInfo.label).join(' → ');
  const priceImpact = parseFloat(quote.priceImpactPct).toFixed(4);
  return `Route: ${route} | Impact: ${priceImpact}% | ${inputSymbol} → ${outputSymbol}`;
}
