// A2A Protocol ServiceWorker — intercepts agent-to-agent requests
// This enables real HTTP requests visible in browser Network tab
// while running in a static export environment (GitHub Pages)

const AGENT_CARD = {
  name: "SolAgent Hub Orchestrator",
  protocol: "A2A",
  protocolVersion: "0.3.0",
  capabilities: { streaming: false, stateTransitionHistory: true },
  skills: [
    { id: "agent-discovery", name: "Agent Discovery" },
    { id: "task-orchestration", name: "Task Orchestration" },
    { id: "price-feed", name: "Real-time Price Feed" },
    { id: "swap-execution", name: "DEX Swap Execution" }
  ],
  authentication: { schemes: ["solana-wallet-signature"] }
};

const tasks = new Map();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/solagent-hub/a2a/.well-known/agent.json' || url.pathname === '/a2a/.well-known/agent.json') {
    event.respondWith(new Response(JSON.stringify(AGENT_CARD, null, 2), {
      headers: { 'Content-Type': 'application/json', 'X-A2A-Protocol': '0.3.0' }
    }));
    return;
  }

  if (url.pathname === '/solagent-hub/a2a/tasks/send' || url.pathname === '/a2a/tasks/send') {
    event.respondWith(handleTaskSend(event.request));
    return;
  }

  if (url.pathname === '/solagent-hub/a2a/tasks/status' || url.pathname === '/a2a/tasks/status') {
    event.respondWith(handleTaskStatus(event.request));
    return;
  }
});

async function handleTaskSend(request) {
  try {
    const body = await request.json();
    const taskId = 'task_' + Math.random().toString(36).slice(2, 10);
    const task = {
      id: taskId,
      status: 'working',
      from: body.params?.from || 'unknown',
      to: body.params?.to || 'unknown',
      type: body.params?.type || 'task_request',
      payload: body.params?.payload || {},
      createdAt: new Date().toISOString(),
    };
    tasks.set(taskId, task);

    // Simulate processing — mark completed after short delay
    setTimeout(() => {
      const t = tasks.get(taskId);
      if (t) { t.status = 'completed'; t.completedAt = new Date().toISOString(); }
    }, 500);

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id || 1,
      result: { taskId, status: 'working', createdAt: task.createdAt }
    }, null, 2), {
      headers: { 'Content-Type': 'application/json', 'X-A2A-Protocol': '0.3.0' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0', error: { code: -32600, message: 'Invalid request' }
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleTaskStatus(request) {
  try {
    const body = await request.json();
    const taskId = body.params?.taskId;
    const task = tasks.get(taskId);

    if (!task) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id || 1,
        error: { code: -32001, message: 'Task not found' }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id || 1,
      result: task
    }, null, 2), {
      headers: { 'Content-Type': 'application/json', 'X-A2A-Protocol': '0.3.0' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0', error: { code: -32600, message: 'Invalid request' }
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}
