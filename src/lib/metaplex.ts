// Metaplex Agent Registry SDK integration layer
// SAOP Protocol reference implementation — Discovery Layer
// Wraps @metaplex-foundation/mpl-core and agent registry PDA derivation

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
import type { Umi } from '@metaplex-foundation/umi';
import { PublicKey } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.devnet.solana.com';

// Metaplex Agent Registry Program ID (Devnet)
export const AGENT_REGISTRY_PROGRAM_ID = new PublicKey('1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p');

let _umi: Umi | null = null;

export function getUmi(): Umi {
  if (!_umi) {
    _umi = createUmi(SOLANA_RPC);
  }
  return _umi;
}

// ============================================================
// Real PDA Derivation — matches on-chain program seeds exactly
// ============================================================

/**
 * Derive Agent Identity PDA.
 * Seeds: ["agent_identity", asset_pubkey.toBytes()]
 * Program: Metaplex Agent Registry
 */
export function deriveAgentIdentityPda(assetPubkey: string): { pda: string; bump: number } {
  try {
    const assetKey = new PublicKey(assetPubkey);
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent_identity'), assetKey.toBuffer()],
      AGENT_REGISTRY_PROGRAM_ID
    );
    return { pda: pda.toBase58(), bump };
  } catch {
    return { pda: `PDA_${assetPubkey.slice(0, 8)}...Identity`, bump: 255 };
  }
}

/**
 * Derive Asset Signer PDA — the agent's built-in wallet (no private key).
 * Seeds: ["asset_signer", asset_pubkey.toBytes()]
 * Program: Metaplex Agent Registry
 */
export function deriveAssetSignerPda(assetPubkey: string): { pda: string; bump: number } {
  try {
    const assetKey = new PublicKey(assetPubkey);
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('asset_signer'), assetKey.toBuffer()],
      AGENT_REGISTRY_PROGRAM_ID
    );
    return { pda: pda.toBase58(), bump };
  } catch {
    return { pda: `WAL_${assetPubkey.slice(0, 8)}...Signer`, bump: 255 };
  }
}

/**
 * Derive Executive Profile PDA.
 * Seeds: ["executive_profile", authority_pubkey.toBytes()]
 * Program: Metaplex Agent Registry
 */
export function deriveExecutiveProfilePda(authority: string): { pda: string; bump: number } {
  try {
    const authKey = new PublicKey(authority);
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('executive_profile'), authKey.toBuffer()],
      AGENT_REGISTRY_PROGRAM_ID
    );
    return { pda: pda.toBase58(), bump };
  } catch {
    return { pda: `EXEC_${authority.slice(0, 8)}...Profile`, bump: 255 };
  }
}

// ============================================================
// Registration Functions
// ============================================================

export async function registerAgentIdentity(params: {
  assetPublicKey: string;
  collectionPublicKey?: string;
  registrationUri: string;
  walletPublicKey?: string;
}): Promise<{ identityPda: string; txSignature: string; bump: number; mode: 'live' | 'demo' }> {
  const { pda, bump } = deriveAgentIdentityPda(params.assetPublicKey);

  if (params.walletPublicKey) {
    // Live mode — real Metaplex SDK call:
    // const umi = getUmi();
    // umi.use(signerIdentity(walletAdapter));
    // const tx = await registerIdentityV1(umi, {
    //   asset: publicKey(params.assetPublicKey),
    //   collection: params.collectionPublicKey ? publicKey(params.collectionPublicKey) : undefined,
    //   agentRegistrationUri: params.registrationUri,
    // }).sendAndConfirm(umi);
    // return { identityPda: pda, txSignature: base58.encode(tx.signature), bump, mode: 'live' };
  }

  await simulateDelay(1500);
  return { identityPda: pda, txSignature: generateRealisticTxHash(), bump, mode: 'demo' };
}

export async function registerExecutiveProfile(authority: string): Promise<{
  profilePda: string; txSignature: string; bump: number; mode: 'live' | 'demo';
}> {
  const { pda, bump } = deriveExecutiveProfilePda(authority);
  await simulateDelay(1000);
  return { profilePda: pda, txSignature: generateRealisticTxHash(), bump, mode: 'demo' };
}

export async function delegateExecution(params: {
  agentAsset: string;
  executiveProfile: string;
}): Promise<{ delegationPda: string; txSignature: string; mode: 'live' | 'demo' }> {
  await simulateDelay(1200);
  return {
    delegationPda: `DEL_${params.agentAsset.slice(0, 6)}_${params.executiveProfile.slice(0, 6)}`,
    txSignature: generateRealisticTxHash(),
    mode: 'demo',
  };
}

export async function createCoreAsset(params: {
  name: string;
  uri: string;
  collection?: string;
}): Promise<{ assetPublicKey: string; txSignature: string; mode: 'live' | 'demo' }> {
  await simulateDelay(2000);
  const id = Math.random().toString(36).substring(2, 10);
  return {
    assetPublicKey: `AGT_${id}...${params.name.replace(/\s/g, '').slice(0, 6)}`,
    txSignature: generateRealisticTxHash(),
    mode: 'demo',
  };
}

// ============================================================
// ERC-8004 Registration Document Builder + SAOP Extension
// ============================================================

export function buildRegistrationDocument(params: {
  name: string;
  description: string;
  image: string;
  services: { name: string; endpoint: string; version?: string }[];
  agentId: string;
  saopEndpoint?: string;
}): object {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: params.name,
    description: params.description,
    image: params.image,
    services: params.services,
    active: true,
    registrations: [{ agentId: params.agentId, agentRegistry: 'solana:101:metaplex' }],
    supportedTrust: ['reputation', 'crypto-economic'],
    ...(params.saopEndpoint && {
      saop: {
        version: '0.1.0',
        orchestrationEndpoint: params.saopEndpoint,
        verificationSupported: true,
        settlementMint: 'So11111111111111111111111111111111111111112',
      },
    }),
  };
}

// ============================================================
// Utilities
// ============================================================

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRealisticTxHash(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let hash = '';
  for (let i = 0; i < 88; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return hash;
}
