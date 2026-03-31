#!/usr/bin/env node
/**
 * SolAgent Hub — Register Executive Profile & Delegate Execution on Solana Devnet
 *
 * 1. Loads keypair from scripts/devnet-keypair.json
 * 2. Sets up Umi with mplCore, mplAgentIdentity, mplAgentTools
 * 3. Calls registerExecutiveV1 to create an executive profile PDA
 * 4. Calls delegateExecutionV1 to delegate execution to the agent asset
 * 5. Saves results to scripts/executive-delegate-result.json
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { readFileSync, writeFileSync } = require('fs');
const umiBundle = require('@metaplex-foundation/umi-bundle-defaults');
const umi_pkg = require('@metaplex-foundation/umi');
const mplCore = require('@metaplex-foundation/mpl-core');
const mplAgentRegistry = require('@metaplex-foundation/mpl-agent-registry');
const mplAgentToolsGen = require('@metaplex-foundation/mpl-agent-registry/dist/src/generated/tools');
const mplAgentIdentityGen = require('@metaplex-foundation/mpl-agent-registry/dist/src/generated/identity');

const { createUmi } = umiBundle;
const { keypairIdentity, publicKey, createSignerFromKeypair } = umi_pkg;
const { mplCore: mplCorePlugin } = mplCore;
const { mplAgentIdentity, mplAgentTools } = mplAgentRegistry;
const { registerExecutiveV1, findExecutiveProfileV1Pda, findExecutionDelegateRecordV1Pda, delegateExecutionV1 } = mplAgentToolsGen;
const { findAgentIdentityV2Pda } = mplAgentIdentityGen;

const DEVNET_RPC = 'https://api.devnet.solana.com';
const AGENT_ASSET = 'ALSwAJHKiSF8CWCYqadoAcrYQkJc8dd8pwhWygqKsWN2';

function encodeSignature(sig) {
  const bs58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  if (typeof sig === 'string') return sig;
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
  for (const byte of sig) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

async function main() {
  console.log('=== SolAgent Hub — Register Executive & Delegate Execution (Devnet) ===\n');

  // 1. Create Umi with all plugins
  const umi = createUmi(DEVNET_RPC);
  umi.use(mplCorePlugin());
  umi.use(mplAgentIdentity());
  umi.use(mplAgentTools());

  // 2. Load keypair
  const saved = JSON.parse(readFileSync('scripts/devnet-keypair.json', 'utf8'));
  const secretKey = new Uint8Array(saved.secretKey);
  const authority = createSignerFromKeypair(umi, {
    publicKey: publicKey(saved.publicKey),
    secretKey,
  });
  umi.use(keypairIdentity(authority));
  console.log(`Authority: ${authority.publicKey}`);

  // Check balance
  const balance = await umi.rpc.getBalance(authority.publicKey);
  const balanceSOL = Number(balance.basisPoints) / 1e9;
  console.log(`Balance: ${balanceSOL} SOL\n`);

  // 3. Derive PDAs
  const agentAsset = publicKey(AGENT_ASSET);
  const executiveProfilePda = findExecutiveProfileV1Pda(umi, { authority: authority.publicKey });
  const agentIdentityPda = findAgentIdentityV2Pda(umi, { asset: agentAsset });
  const executionDelegateRecordPda = findExecutionDelegateRecordV1Pda(umi, {
    executiveProfile: executiveProfilePda[0],
    agentAsset,
  });

  console.log(`Agent Asset: ${agentAsset}`);
  console.log(`Executive Profile PDA: ${executiveProfilePda[0]}`);
  console.log(`Agent Identity PDA: ${agentIdentityPda[0]}`);
  console.log(`Execution Delegate Record PDA: ${executionDelegateRecordPda[0]}\n`);

  // 4. Register Executive Profile (skip if already registered)
  let registerSig = null;
  console.log('Step 1: Registering Executive Profile...');
  try {
    const registerTx = registerExecutiveV1(umi, {
      authority: authority,
    });
    const registerResult = await registerTx.sendAndConfirm(umi, {
      confirm: { commitment: 'confirmed' },
    });
    registerSig = encodeSignature(registerResult.signature);
    console.log(`Executive Profile registered! TX: ${registerSig}\n`);
  } catch (err) {
    if (err.name === 'ExecutiveProfileMustBeUninitialized' ||
        (err.message && err.message.includes('Executive Profile must be uninitialized'))) {
      console.log('Executive Profile already registered, skipping.\n');
      registerSig = 'already-registered';
    } else {
      throw err;
    }
  }

  // 5. Delegate Execution
  console.log('Step 2: Delegating Execution...');
  const delegateTx = delegateExecutionV1(umi, {
    agentAsset,
    agentIdentity: agentIdentityPda,
    executiveProfile: executiveProfilePda,
    authority: authority,
  });
  const delegateResult = await delegateTx.sendAndConfirm(umi, {
    confirm: { commitment: 'confirmed' },
  });
  const delegateSig = encodeSignature(delegateResult.signature);
  console.log(`Execution delegated! TX: ${delegateSig}\n`);

  // 6. Save results
  const results = {
    network: 'devnet',
    timestamp: new Date().toISOString(),
    authority: String(authority.publicKey),
    agentAsset: AGENT_ASSET,
    executiveProfile: String(executiveProfilePda[0]),
    agentIdentity: String(agentIdentityPda[0]),
    executionDelegateRecord: String(executionDelegateRecordPda[0]),
    transactions: {
      registerExecutive: registerSig,
      delegateExecution: delegateSig,
    },
    explorerLinks: {
      executiveProfile: `https://explorer.solana.com/address/${executiveProfilePda[0]}?cluster=devnet`,
      executionDelegateRecord: `https://explorer.solana.com/address/${executionDelegateRecordPda[0]}?cluster=devnet`,
      registerTx: `https://explorer.solana.com/tx/${registerSig}?cluster=devnet`,
      delegateTx: `https://explorer.solana.com/tx/${delegateSig}?cluster=devnet`,
    },
  };

  console.log('=== Results ===');
  console.log(JSON.stringify(results, null, 2));

  writeFileSync('scripts/executive-delegate-result.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to scripts/executive-delegate-result.json');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
