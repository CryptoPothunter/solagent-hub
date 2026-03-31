// A2A Protocol Client — sends real HTTP requests via ServiceWorker
// Requests are visible in browser Network tab, proving protocol integration

const BASE_PATH = typeof window !== 'undefined' && window.location.pathname.includes('/solagent-hub')
  ? '/solagent-hub/a2a'
  : '/a2a';

let swRegistered = false;

export async function registerA2AWorker(): Promise<boolean> {
  if (swRegistered) return true;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const swPath = typeof window !== 'undefined' && window.location.pathname.includes('/solagent-hub')
      ? '/solagent-hub/a2a-worker.js'
      : '/a2a-worker.js';
    const reg = await navigator.serviceWorker.register(swPath, { scope: BASE_PATH + '/' });

    // Wait for the worker to be active
    if (reg.installing) {
      await new Promise<void>((resolve) => {
        reg.installing!.addEventListener('statechange', function handler() {
          if (this.state === 'activated') {
            this.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
    }

    swRegistered = true;
    return true;
  } catch (err) {
    console.warn('[A2A] ServiceWorker registration failed:', err);
    return false;
  }
}

export interface A2ATaskResult {
  taskId: string;
  status: string;
  createdAt: string;
}

export async function sendA2ATask(params: {
  from: string;
  to: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<A2ATaskResult | null> {
  try {
    const res = await fetch(`${BASE_PATH}/tasks/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tasks/send',
        params,
      }),
    });
    const json = await res.json();
    return json.result || null;
  } catch {
    return null;
  }
}

export async function getA2ATaskStatus(taskId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BASE_PATH}/tasks/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tasks/status',
        params: { taskId },
      }),
    });
    const json = await res.json();
    return json.result || null;
  } catch {
    return null;
  }
}

export async function fetchAgentCard(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BASE_PATH}/.well-known/agent.json`);
    return await res.json();
  } catch {
    return null;
  }
}
