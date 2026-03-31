// SAOP Verification Layer — On-chain orchestration digest via Solana Memo Program
// Records SHA-256 hash of A2A message flows on-chain for trustless auditability

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const SOLANA_RPC = 'https://api.devnet.solana.com';

export interface VerificationDigest {
  flowId: string;
  messageCount: number;
  sha256Hex: string;
  memoPayload: string;
  timestamp: string;
}

/**
 * Compute SHA-256 digest of an orchestration flow's A2A messages.
 * Follows SAOP-SPEC Section 5: Verification Digest Specification.
 *
 * 1. Canonicalize: JSON.stringify each message with sorted keys
 * 2. Order: sort by timestamp ascending
 * 3. Concatenate with | delimiter
 * 4. Hash: SHA-256 of UTF-8 encoded concatenation
 */
export async function computeFlowDigest(
  flowId: string,
  messages: Array<{ from: string; to: string; type: string; payload: Record<string, unknown>; timestamp: string }>
): Promise<VerificationDigest> {
  // Step 1 & 2: Canonicalize and sort
  const sorted = [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Step 3: Concatenate canonical forms
  const canonical = sorted.map(msg =>
    JSON.stringify({
      from: msg.from,
      payload: msg.payload,
      timestamp: msg.timestamp,
      to: msg.to,
      type: msg.type,
    })
  ).join('|');

  // Step 4: SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // SAOP memo format: "SAOP:v1:<flow_id>:<sha256_hex>"
  const memoPayload = `SAOP:v1:${flowId}:${sha256Hex}`;

  return {
    flowId,
    messageCount: messages.length,
    sha256Hex,
    memoPayload,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a Solana Memo transaction instruction for the verification digest.
 * This can be signed by a connected wallet and submitted to Devnet.
 */
export function buildMemoInstruction(
  memoPayload: string,
  signerPublicKey: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signerPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoPayload, 'utf-8'),
  });
}

/**
 * Build a complete transaction with the memo instruction.
 * Caller must sign and send.
 */
export async function buildVerificationTransaction(
  digest: VerificationDigest,
  signerPublicKey: PublicKey
): Promise<Transaction> {
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();

  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = signerPublicKey;
  tx.add(buildMemoInstruction(digest.memoPayload, signerPublicKey));

  return tx;
}

/**
 * Verify a digest against a recorded on-chain memo.
 * Fetches the transaction and compares the memo data.
 */
export async function verifyOnChainDigest(
  txSignature: string,
  expectedDigest: VerificationDigest
): Promise<{ verified: boolean; onChainMemo?: string; error?: string }> {
  try {
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { verified: false, error: 'Transaction not found' };
    }

    // Extract memo instruction data
    const memoIx = tx.transaction.message.compiledInstructions?.find(ix => {
      const programId = tx.transaction.message.staticAccountKeys[ix.programIdIndex];
      return programId?.equals(MEMO_PROGRAM_ID);
    });

    if (!memoIx) {
      return { verified: false, error: 'No Memo instruction found in transaction' };
    }

    const onChainMemo = Buffer.from(memoIx.data).toString('utf-8');
    const verified = onChainMemo === expectedDigest.memoPayload;

    return { verified, onChainMemo };
  } catch (err) {
    return { verified: false, error: String(err) };
  }
}

/**
 * Parse a SAOP memo payload back into components.
 */
export function parseMemoPayload(memo: string): { version: string; flowId: string; sha256: string } | null {
  const parts = memo.split(':');
  if (parts.length !== 4 || parts[0] !== 'SAOP') return null;
  return {
    version: parts[1],
    flowId: parts[2],
    sha256: parts[3],
  };
}
