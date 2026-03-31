import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Since the translations object is not exported from i18n.tsx,
 * we parse the source file to extract and validate translation keys.
 */
const i18nSource = fs.readFileSync(path.resolve(__dirname, '../i18n.tsx'), 'utf-8');

// Extract all translation key entries: 'some.key': { en: '...', zh: '...' }
const keyPattern = /'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*zh:\s*'([^']*)'\s*\}/g;
const entries: { key: string; en: string; zh: string }[] = [];
let match: RegExpExecArray | null;
while ((match = keyPattern.exec(i18nSource)) !== null) {
  entries.push({ key: match[1], en: match[2], zh: match[3] });
}

describe('i18n translation completeness', () => {
  it('should have extracted a reasonable number of translation keys', () => {
    // The file has many keys; ensure we parsed at least 50
    expect(entries.length).toBeGreaterThanOrEqual(50);
  });

  it('every key must have non-empty en and zh values', () => {
    for (const entry of entries) {
      expect(entry.en, `en value missing for key "${entry.key}"`).not.toBe('');
      expect(entry.zh, `zh value missing for key "${entry.key}"`).not.toBe('');
    }
  });

  it('should contain all required nav.* keys', () => {
    const navKeys = entries.filter(e => e.key.startsWith('nav.'));
    const requiredNavKeys = ['nav.explorer', 'nav.register', 'nav.orchestrate', 'nav.tools'];
    for (const k of requiredNavKeys) {
      expect(navKeys.some(e => e.key === k), `Missing nav key: ${k}`).toBe(true);
    }
  });

  it('should contain explorer.* keys', () => {
    const explorerKeys = entries.filter(e => e.key.startsWith('explorer.'));
    expect(explorerKeys.length).toBeGreaterThanOrEqual(5);
  });

  it('should contain register.* keys', () => {
    const registerKeys = entries.filter(e => e.key.startsWith('register.'));
    expect(registerKeys.length).toBeGreaterThanOrEqual(5);
  });

  it('should contain orch.* keys', () => {
    const orchKeys = entries.filter(e => e.key.startsWith('orch.'));
    expect(orchKeys.length).toBeGreaterThanOrEqual(5);
  });
});
