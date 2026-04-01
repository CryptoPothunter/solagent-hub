import { describe, it, expect } from 'vitest';
import { computeFlowDigest, parseMemoPayload, buildMemoInstruction } from '../verification';
import { PublicKey } from '@solana/web3.js';

describe('computeFlowDigest', () => {
  it('should compute deterministic SHA-256 digest for a message set', async () => {
    const messages = [
      { from: 'AgentA', to: 'AgentB', type: 'task_request', payload: { action: 'buy' }, timestamp: '2026-03-28T09:00:00Z' },
      { from: 'AgentB', to: 'AgentA', type: 'task_response', payload: { status: 'done' }, timestamp: '2026-03-28T09:00:01Z' },
    ];

    const digest = await computeFlowDigest('test-flow-1', messages);

    expect(digest.flowId).toBe('test-flow-1');
    expect(digest.messageCount).toBe(2);
    expect(digest.sha256Hex).toMatch(/^[0-9a-f]{64}$/);
    expect(digest.memoPayload).toBe(`SAOP:v1:test-flow-1:${digest.sha256Hex}`);
    expect(digest.timestamp).toBeTruthy();
  });

  it('should produce identical digest for same messages regardless of input order', async () => {
    const messages = [
      { from: 'AgentB', to: 'AgentA', type: 'task_response', payload: { status: 'done' }, timestamp: '2026-03-28T09:00:01Z' },
      { from: 'AgentA', to: 'AgentB', type: 'task_request', payload: { action: 'buy' }, timestamp: '2026-03-28T09:00:00Z' },
    ];

    const digest1 = await computeFlowDigest('flow-order-test', messages);

    // Reverse order
    const reversed = [...messages].reverse();
    const digest2 = await computeFlowDigest('flow-order-test', reversed);

    expect(digest1.sha256Hex).toBe(digest2.sha256Hex);
  });

  it('should produce different digest for different flow IDs (same messages)', async () => {
    const messages = [
      { from: 'AgentA', to: 'AgentB', type: 'task_request', payload: { action: 'buy' }, timestamp: '2026-03-28T09:00:00Z' },
    ];

    const d1 = await computeFlowDigest('flow-a', messages);
    const d2 = await computeFlowDigest('flow-b', messages);

    // Different flow IDs should NOT affect the hash (hash is of messages only)
    // But the memo payload should differ
    expect(d1.sha256Hex).toBe(d2.sha256Hex);
    expect(d1.memoPayload).not.toBe(d2.memoPayload);
  });

  it('should handle empty message array', async () => {
    const digest = await computeFlowDigest('empty-flow', []);
    expect(digest.messageCount).toBe(0);
    expect(digest.sha256Hex).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('parseMemoPayload', () => {
  it('should parse valid SAOP memo payload', () => {
    const result = parseMemoPayload('SAOP:v1:test-flow:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(result).toEqual({
      version: 'v1',
      flowId: 'test-flow',
      sha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });
  });

  it('should return null for invalid memo format', () => {
    expect(parseMemoPayload('INVALID:v1:test:hash')).toBeNull();
    expect(parseMemoPayload('SAOP')).toBeNull();
    expect(parseMemoPayload('')).toBeNull();
  });

  it('should return null for wrong prefix', () => {
    expect(parseMemoPayload('OTHER:v1:flow:hash')).toBeNull();
  });
});

describe('buildMemoInstruction', () => {
  it('should create instruction with correct program ID', () => {
    const signer = new PublicKey('11111111111111111111111111111111');
    const ix = buildMemoInstruction('SAOP:v1:test:abc123', signer);
    expect(ix.programId.toBase58()).toBe('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    expect(ix.keys).toHaveLength(1);
    expect(ix.keys[0].isSigner).toBe(true);
  });

  it('should encode memo payload as UTF-8 data', () => {
    const signer = new PublicKey('11111111111111111111111111111111');
    const payload = 'SAOP:v1:flow123:deadbeef';
    const ix = buildMemoInstruction(payload, signer);
    expect(Buffer.from(ix.data).toString('utf-8')).toBe(payload);
  });
});

describe('computeFlowDigest - edge cases', () => {
  it('should handle messages with complex nested payloads', async () => {
    const messages = [
      { from: 'A', to: 'B', type: 'task_request', payload: { nested: { deep: [1, 2, 3] } }, timestamp: '2025-01-01T00:00:00Z' },
    ];
    const digest = await computeFlowDigest('nested-test', messages);
    expect(digest.sha256Hex).toMatch(/^[0-9a-f]{64}$/);
    expect(digest.messageCount).toBe(1);
  });

  it('should handle single message flow', async () => {
    const messages = [
      { from: 'X', to: 'Y', type: 'heartbeat', payload: {}, timestamp: '2025-06-15T12:00:00Z' },
    ];
    const digest = await computeFlowDigest('single-msg', messages);
    expect(digest.sha256Hex).toMatch(/^[0-9a-f]{64}$/);
    expect(digest.memoPayload).toContain('SAOP:v1:single-msg:');
  });

  it('should produce different digests for different payloads', async () => {
    const msg1 = [{ from: 'A', to: 'B', type: 'task_request', payload: { action: 'buy' }, timestamp: '2025-01-01T00:00:00Z' }];
    const msg2 = [{ from: 'A', to: 'B', type: 'task_request', payload: { action: 'sell' }, timestamp: '2025-01-01T00:00:00Z' }];
    const d1 = await computeFlowDigest('diff-test', msg1);
    const d2 = await computeFlowDigest('diff-test', msg2);
    expect(d1.sha256Hex).not.toBe(d2.sha256Hex);
  });
});

describe('parseMemoPayload - edge cases', () => {
  it('should handle memo with extra colons in sha256', () => {
    // sha256 shouldn't have colons, but test robustness
    const result = parseMemoPayload('SAOP:v1:flow:hash:extra');
    expect(result).toBeNull(); // 5 parts instead of 4
  });
});
