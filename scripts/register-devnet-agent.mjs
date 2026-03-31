#!/usr/bin/env node
/**
 * SolAgent Hub — Register a Real Agent on Solana Devnet
 *
 * This script:
 * 1. Generates a new Umi keypair
 * 2. Airdrops Devnet SOL
 * 3. Creates an MPL Core Asset (the agent NFT)
 * 4. Calls registerIdentityV1 to register the agent on-chain
 * 5. Outputs all public keys and tx signatures
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const umiBundle = require('@metaplex-foundation/umi-bundle-defaults');
const umi_pkg = require('@metaplex-foundation/umi');
const mplCore = require('@metaplex-foundation/mpl-core');
const mplAgentRegistry = require('@metaplex-foundation/mpl-agent-registry');
const mplAgentIdentityGen = require('@metaplex-foundation/mpl-agent-registry/dist/src/generated/identity');
const { writeFileSync } = require('fs');

const { createUmi } = umiBundle;
const { generateSigner, keypairIdentity, publicKey, sol } = umi_pkg;
const { createV1, mplCore: mplCorePlugin } = mplCore;
const { mplAgentIdentity } = mplAgentRegistry;
const { registerIdentityV1 } = mplAgentIdentityGen;

const DEVNET_RPC = 'https://api.devnet.solana.com';

// The agent card JSON hosted on GitHub Pages
const AGENT_CARD_URI = 'https://cryptopothunter.github.io/solagent-hub/agent-card.json';

const KEYPAIR_FILE = 'scripts/devnet-keypair.json';
const { existsSync, readFileSync } = require('fs');

async function main() {
  const mode = process.argv[2] || 'register'; // 'keygen' or 'register'

  console.log('=== SolAgent Hub — Devnet Agent Registration ===\n');

  // 1. Create Umi instance with devnet
  const umi = createUmi(DEVNET_RPC);
  umi.use(mplCorePlugin());
  umi.use(mplAgentIdentity());

  // 2. Load or generate keypair
  let authority;
  if (existsSync(KEYPAIR_FILE)) {
    const saved = JSON.parse(readFileSync(KEYPAIR_FILE, 'utf8'));
    const secretKey = new Uint8Array(saved.secretKey);
    const kp = umi_pkg.createSignerFromKeypair(umi, {
      publicKey: publicKey(saved.publicKey),
      secretKey,
    });
    authority = kp;
    console.log(`Loaded existing keypair: ${authority.publicKey}`);
  } else {
    authority = generateSigner(umi);
    // Save keypair for reuse
    writeFileSync(KEYPAIR_FILE, JSON.stringify({
      publicKey: String(authority.publicKey),
      secretKey: Array.from(authority.secretKey),
    }));
    console.log(`Generated new keypair: ${authority.publicKey}`);
    console.log(`Keypair saved to ${KEYPAIR_FILE}`);
  }

  umi.use(keypairIdentity(authority));

  if (mode === 'keygen') {
    console.log('\n========================================');
    console.log('请到以下地址领取 Devnet 测试币:');
    console.log('https://faucet.solana.com/');
    console.log(`\n钱包地址: ${authority.publicKey}`);
    console.log('========================================');
    console.log('\n领取完成后运行: node scripts/register-devnet-agent.mjs register');
    return;
  }

  // Check balance
  const balance = await umi.rpc.getBalance(authority.publicKey);
  const balanceSOL = Number(balance.basisPoints) / 1e9;
  console.log(`Balance: ${balanceSOL} SOL`);

  if (balanceSOL < 0.01) {
    console.error('\n余额不足! 请先领取测试币:');
    console.error('https://faucet.solana.com/');
    console.error(`钱包地址: ${authority.publicKey}`);
    console.error('\n领取后重新运行: node scripts/register-devnet-agent.mjs register');
    process.exit(1);
  }
  console.log();

  // 4. Create MPL Core Asset (or reuse existing one)
  const EXISTING_ASSET = process.argv[3] || null;
  let assetPublicKey;
  let createSig = null;

  if (EXISTING_ASSET) {
    assetPublicKey = publicKey(EXISTING_ASSET);
    console.log(`Reusing existing Core Asset: ${assetPublicKey}\n`);
  } else {
    console.log('Creating MPL Core Asset...');
    const assetSigner = generateSigner(umi);
    assetPublicKey = assetSigner.publicKey;
    console.log(`Asset address: ${assetPublicKey}`);

    const createTxBuilder = createV1(umi, {
      asset: assetSigner,
      name: 'SolAgent Hub Orchestrator',
      uri: AGENT_CARD_URI,
    });

    const createResult = await createTxBuilder.sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' },
    });
    createSig = encodeSignature(createResult.signature);
    console.log(`Core Asset created! TX: ${createSig}\n`);
  }

  // 5. Register Agent Identity
  console.log('Registering Agent Identity via Metaplex Agent Registry...');
  const registerTxBuilder = registerIdentityV1(umi, {
    asset: assetPublicKey,
    agentRegistrationUri: AGENT_CARD_URI,
  });

  const registerResult = await registerTxBuilder.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  });
  const registerSig = encodeSignature(registerResult.signature);
  console.log(`Agent Identity registered! TX: ${registerSig}\n`);

  // 6. Output results
  const results = {
    network: 'devnet',
    timestamp: new Date().toISOString(),
    authority: String(authority.publicKey),
    asset: String(assetPublicKey),
    agentCardUri: AGENT_CARD_URI,
    transactions: {
      createAsset: createSig || 'reused-existing',
      registerIdentity: registerSig,
    },
    explorerLinks: {
      asset: `https://explorer.solana.com/address/${assetPublicKey}?cluster=devnet`,
      createTx: createSig ? `https://explorer.solana.com/tx/${createSig}?cluster=devnet` : null,
      registerTx: `https://explorer.solana.com/tx/${registerSig}?cluster=devnet`,
    },
  };

  console.log('=== Registration Complete ===');
  console.log(JSON.stringify(results, null, 2));

  // Save results to file
  writeFileSync(
    'scripts/devnet-agent-result.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\nResults saved to scripts/devnet-agent-result.json');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function encodeSignature(sig) {
  // Umi returns Uint8Array signature, encode to base58
  const bs58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  if (typeof sig === 'string') return sig;
  // Simple base58 encode for Uint8Array
  let num = BigInt(0);
  for (const byte of sig) {
    num = num * 256n + BigInt(byte);
  }
  if (num === 0n) return '1';
  let result = '';
  while (num > 0n) {
    result = bs58chars[Number(num % 58n)] + result;
    num = num / 58n;
  }
  // Leading zeros
  for (const byte of sig) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

main().catch(err => {
  console.error('Registration failed:', err);
  process.exit(1);
});
