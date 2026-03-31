import { describe, it, expect } from 'vitest';
import { computeFlowDigest } from '../verification';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface TestVector {
  description: string;
  flowId: string;
  messages: Array<{
    from: string;
    to: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp: string;
  }>;
  expectedDigest: string;
}

function loadVector(name: string): TestVector {
  const filePath = resolve(__dirname, '../../../scripts/test-vectors', name);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('SAOP test vectors', () => {
  it('vector-01: simple 2-message flow matches expectedDigest', async () => {
    const vector = loadVector('vector-01.json');
    const digest = await computeFlowDigest(vector.flowId, vector.messages);

    expect(digest.memoPayload).toBe(vector.expectedDigest);
    expect(digest.messageCount).toBe(2);
    expect(digest.flowId).toBe('test-vector-01');
  });

  it('vector-02: full 4-agent orchestration flow matches expectedDigest', async () => {
    const vector = loadVector('vector-02.json');
    const digest = await computeFlowDigest(vector.flowId, vector.messages);

    expect(digest.memoPayload).toBe(vector.expectedDigest);
    expect(digest.messageCount).toBe(5);
    expect(digest.flowId).toBe('test-vector-02');
  });

  it('vector digests are deterministic across repeated runs', async () => {
    const vector = loadVector('vector-01.json');
    const d1 = await computeFlowDigest(vector.flowId, vector.messages);
    const d2 = await computeFlowDigest(vector.flowId, vector.messages);

    expect(d1.sha256Hex).toBe(d2.sha256Hex);
    expect(d1.memoPayload).toBe(d2.memoPayload);
  });
});
