#!/usr/bin/env node
// SAOP Verification Digest — Standalone computation script
// Usage: node scripts/verify-saop-digest.mjs scripts/test-vectors/vector-01.json

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/verify-saop-digest.mjs <vector-file.json>');
  process.exit(1);
}

const absPath = resolve(filePath);
const vector = JSON.parse(readFileSync(absPath, 'utf-8'));

const { flowId, messages } = vector;

// Step 1 & 2: Sort by timestamp ascending
const sorted = [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

// Step 3: Canonicalize each message with alphabetically sorted keys, join with '|'
const canonical = sorted.map(msg =>
  JSON.stringify({
    from: msg.from,
    payload: msg.payload,
    timestamp: msg.timestamp,
    to: msg.to,
    type: msg.type,
  })
).join('|');

// Step 4: SHA-256 of UTF-8 encoded concatenation
const sha256Hex = createHash('sha256').update(canonical, 'utf-8').digest('hex');

// Step 5: Format SAOP memo payload
const memoPayload = `SAOP:v1:${flowId}:${sha256Hex}`;

console.log(`Flow ID:        ${flowId}`);
console.log(`Message count:  ${messages.length}`);
console.log(`SHA-256 hex:    ${sha256Hex}`);
console.log(`SAOP memo:      ${memoPayload}`);

if (vector.expectedDigest && vector.expectedDigest !== 'PLACEHOLDER') {
  const match = vector.expectedDigest === memoPayload;
  console.log(`Expected:       ${vector.expectedDigest}`);
  console.log(`Match:          ${match ? 'PASS' : 'FAIL'}`);
  if (!match) process.exit(1);
}
