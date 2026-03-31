import { describe, it, expect } from 'vitest';
import {
  REAL_ONCHAIN_AGENT,
  DEMO_AGENTS,
  DEMO_TASKS,
  DEMO_MESSAGES,
  getAgentByKey,
  getAgentByName,
  getTasksForAgent,
} from '../demo-data';

describe('REAL_ONCHAIN_AGENT', () => {
  it('has assetPublicKey set to the expected real public key', () => {
    expect(REAL_ONCHAIN_AGENT.assetPublicKey).toBe('ALSwAJHKiSF8CWCYqadoAcrYQkJc8dd8pwhWygqKsWN2');
  });

  it('has a valid (non-placeholder) public key format', () => {
    // Real base58 keys are 32-44 chars of base58 alphabet
    expect(REAL_ONCHAIN_AGENT.assetPublicKey).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });

  it('has required metadata fields', () => {
    const m = REAL_ONCHAIN_AGENT.metadata;
    expect(m.name).toBeTruthy();
    expect(m.description).toBeTruthy();
    expect(m.services.length).toBeGreaterThanOrEqual(1);
    expect(m.active).toBe(true);
    expect(m.registrations.length).toBeGreaterThanOrEqual(1);
  });
});

describe('DEMO_AGENTS', () => {
  it('all agents have required metadata fields (name, description, services, active, registrations)', () => {
    for (const agent of DEMO_AGENTS) {
      const m = agent.metadata;
      expect(m.name, `Agent ${agent.assetPublicKey} missing name`).toBeTruthy();
      expect(m.description, `Agent ${agent.assetPublicKey} missing description`).toBeTruthy();
      expect(m.services.length, `Agent ${m.name} has no services`).toBeGreaterThanOrEqual(1);
      expect(typeof m.active).toBe('boolean');
      expect(m.registrations.length, `Agent ${m.name} has no registrations`).toBeGreaterThanOrEqual(1);
    }
  });

  it('contains multiple agents', () => {
    expect(DEMO_AGENTS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('DEMO_TASKS', () => {
  const agentKeys = new Set(DEMO_AGENTS.map(a => a.assetPublicKey));

  it('all tasks reference valid agent keys from DEMO_AGENTS', () => {
    for (const task of DEMO_TASKS) {
      expect(agentKeys.has(task.fromAgent), `fromAgent ${task.fromAgent} not in DEMO_AGENTS`).toBe(true);
      expect(agentKeys.has(task.toAgent), `toAgent ${task.toAgent} not in DEMO_AGENTS`).toBe(true);
    }
  });

  it('all tasks have required fields', () => {
    for (const task of DEMO_TASKS) {
      expect(task.id).toBeTruthy();
      expect(task.fromAgent).toBeTruthy();
      expect(task.toAgent).toBeTruthy();
      expect(task.taskType).toBeTruthy();
      expect(task.payload).toBeDefined();
      expect(task.createdAt).toBeTruthy();
    }
  });
});

describe('DEMO_MESSAGES', () => {
  it('all messages have required fields (id, from, to, type, payload, timestamp)', () => {
    for (const msg of DEMO_MESSAGES) {
      expect(msg.id).toBeTruthy();
      expect(msg.from).toBeTruthy();
      expect(msg.to).toBeTruthy();
      expect(msg.type).toBeTruthy();
      expect(msg.payload).toBeDefined();
      expect(msg.timestamp).toBeTruthy();
    }
  });

  it('message types are valid A2AMessage types', () => {
    const validTypes = ['task_request', 'task_response', 'discovery', 'heartbeat'];
    for (const msg of DEMO_MESSAGES) {
      expect(validTypes, `Invalid type "${msg.type}" on ${msg.id}`).toContain(msg.type);
    }
  });
});

describe('getAgentByName', () => {
  it('returns the correct agent for a known name', () => {
    const agent = getAgentByName('Alpha Scout');
    expect(agent).toBeDefined();
    expect(agent!.metadata.name).toBe('Alpha Scout');
    expect(agent!.assetPublicKey).toBe('AGT1...MarketAnalyst7xK');
  });

  it('returns undefined for a non-existent name', () => {
    expect(getAgentByName('NonExistentAgent')).toBeUndefined();
  });
});

describe('getAgentByKey', () => {
  it('returns the correct agent for a known key', () => {
    const agent = getAgentByKey('AGT1...MarketAnalyst7xK');
    expect(agent).toBeDefined();
    expect(agent!.metadata.name).toBe('Alpha Scout');
  });

  it('returns undefined for a non-existent key', () => {
    expect(getAgentByKey('NONEXISTENT_KEY')).toBeUndefined();
  });
});

describe('getTasksForAgent', () => {
  it('returns tasks where the agent is sender or receiver', () => {
    const tasks = getTasksForAgent('AGT2...TradeExecutor9pL');
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    for (const task of tasks) {
      expect(
        task.fromAgent === 'AGT2...TradeExecutor9pL' || task.toAgent === 'AGT2...TradeExecutor9pL'
      ).toBe(true);
    }
  });

  it('returns empty array for a key with no tasks', () => {
    expect(getTasksForAgent('NONEXISTENT_KEY')).toEqual([]);
  });
});
