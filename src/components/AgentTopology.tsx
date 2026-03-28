'use client';

import { useState, useEffect, useMemo } from 'react';

// --- Types ---
interface ActiveMessage {
  from: string;
  to: string;
  type: string;
}

interface AgentTopologyProps {
  activeMessages: ActiveMessage[];
  isRunning: boolean;
}

// --- Agent definitions ---
const AGENTS = [
  { id: 'Oracle Stream', label: 'Oracle Stream', role: 'Data Feed', color: '#8b5cf6', x: 400, y: 60, balance: '2.41 SOL' },
  { id: 'Alpha Scout', label: 'Alpha Scout', role: 'Analyst', color: '#00f0ff', x: 120, y: 230, balance: '1.87 SOL' },
  { id: 'Swift Trader', label: 'Swift Trader', role: 'Executor', color: '#22c55e', x: 680, y: 230, balance: '3.12 SOL' },
  { id: 'Sentinel Guard', label: 'Sentinel Guard', role: 'Risk Mgmt', color: '#ef4444', x: 400, y: 400, balance: '0.95 SOL' },
] as const;

// All possible connections
const CONNECTIONS = [
  { from: 'Oracle Stream', to: 'Alpha Scout' },
  { from: 'Oracle Stream', to: 'Swift Trader' },
  { from: 'Alpha Scout', to: 'Swift Trader' },
  { from: 'Alpha Scout', to: 'Sentinel Guard' },
  { from: 'Swift Trader', to: 'Sentinel Guard' },
  { from: 'Oracle Stream', to: 'Sentinel Guard' },
];

const NODE_W = 160;
const NODE_H = 76;

// --- Helper: find agent by id ---
function getAgent(id: string) {
  return AGENTS.find(a => a.id === id)!;
}

// --- Component ---
export default function AgentTopology({ activeMessages, isRunning }: AgentTopologyProps) {
  const [tick, setTick] = useState(0);

  // Animate tick for packet motion
  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(iv);
  }, [isRunning]);

  // Determine which connections are active (bidirectional match)
  const activeConns = useMemo(() => {
    const set = new Set<string>();
    for (const msg of activeMessages) {
      // Match connection in either direction
      for (const conn of CONNECTIONS) {
        if (
          (conn.from === msg.from && conn.to === msg.to) ||
          (conn.from === msg.to && conn.to === msg.from)
        ) {
          set.add(`${conn.from}->${conn.to}`);
        }
      }
    }
    return set;
  }, [activeMessages]);

  // Determine which agents are active
  const activeAgents = useMemo(() => {
    const set = new Set<string>();
    for (const msg of activeMessages) {
      set.add(msg.from);
      set.add(msg.to);
    }
    return set;
  }, [activeMessages]);

  // Directed messages for packet animation
  const directedMessages = useMemo(() => {
    return activeMessages.filter(m => m.from !== m.to);
  }, [activeMessages]);

  return (
    <div className="w-full" style={{ aspectRatio: '800 / 500' }}>
      <svg
        viewBox="0 0 800 500"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ background: '#0a0b0f', borderRadius: 12 }}
      >
        {/* PLACEHOLDER: defs (filters, gradients, animations) */}
        <Defs />

        {/* Background grid */}
        <BackgroundGrid />

        {/* Connection lines */}
        {CONNECTIONS.map(conn => {
          const from = getAgent(conn.from);
          const to = getAgent(conn.to);
          const key = `${conn.from}->${conn.to}`;
          const isActive = activeConns.has(key);
          return (
            <ConnectionLine
              key={key}
              x1={from.x}
              y1={from.y + NODE_H / 2}
              x2={to.x}
              y2={to.y + NODE_H / 2}
              fromColor={from.color}
              toColor={to.color}
              isActive={isActive}
              isRunning={isRunning}
            />
          );
        })}

        {/* Animated packets */}
        {directedMessages.map((msg, i) => {
          const from = getAgent(msg.from);
          const to = getAgent(msg.to);
          if (!from || !to) return null;
          return (
            <AnimatedPacket
              key={`${msg.from}-${msg.to}-${i}`}
              x1={from.x}
              y1={from.y + NODE_H / 2}
              x2={to.x}
              y2={to.y + NODE_H / 2}
              color={from.color}
            />
          );
        })}

        {/* Agent nodes */}
        {AGENTS.map(agent => (
          <AgentNode
            key={agent.id}
            agent={agent}
            isActive={activeAgents.has(agent.id)}
            isRunning={isRunning}
          />
        ))}
      </svg>

      {/* CSS animations injected via style tag */}
      <style>{ANIMATION_CSS}</style>
    </div>
  );
}

// --- Sub-components ---

function Defs() {
  return (
    <defs>
      {/* Glow filters for each agent color */}
      {AGENTS.map(agent => (
        <filter key={agent.id} id={`glow-${slugify(agent.id)}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor={agent.color} floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}

      {/* Generic bright glow for active connections */}
      <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Packet glow */}
      <filter id="glow-packet" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Node card gradients */}
      {AGENTS.map(agent => (
        <linearGradient key={`grad-${agent.id}`} id={`grad-${slugify(agent.id)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={agent.color} stopOpacity="0.15" />
          <stop offset="100%" stopColor="#181924" stopOpacity="0.95" />
        </linearGradient>
      ))}

      {/* Background grid pattern */}
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1c28" strokeWidth="0.5" />
      </pattern>
    </defs>
  );
}

function BackgroundGrid() {
  return <rect width="800" height="500" fill="url(#grid)" opacity="0.5" />;
}

interface ConnectionLineProps {
  x1: number; y1: number;
  x2: number; y2: number;
  fromColor: string; toColor: string;
  isActive: boolean;
  isRunning: boolean;
}

function ConnectionLine({ x1, y1, x2, y2, fromColor, toColor, isActive, isRunning }: ConnectionLineProps) {
  const baseOpacity = isActive ? 0.8 : isRunning ? 0.15 : 0.1;
  const strokeW = isActive ? 2 : 1;

  return (
    <g>
      {/* Base line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isActive ? fromColor : '#2a2d3e'}
        strokeWidth={strokeW}
        opacity={baseOpacity}
        filter={isActive ? 'url(#glow-line)' : undefined}
      />
      {/* Animated dash overlay */}
      {isRunning && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isActive ? fromColor : '#3a3d4e'}
          strokeWidth={isActive ? 1.5 : 0.5}
          opacity={isActive ? 0.9 : 0.25}
          strokeDasharray={isActive ? '8 6' : '4 12'}
          className="topology-dash-flow"
          filter={isActive ? 'url(#glow-line)' : undefined}
        />
      )}
    </g>
  );
}

interface AnimatedPacketProps {
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
}

function AnimatedPacket({ x1, y1, x2, y2, color }: AnimatedPacketProps) {
  return (
    <g filter="url(#glow-packet)">
      <circle r="5" fill={color} opacity="0.95">
        <animateMotion
          dur="1.2s"
          repeatCount="indefinite"
          path={`M${x1},${y1} L${x2},${y2}`}
        />
      </circle>
      {/* Trail */}
      <circle r="3" fill={color} opacity="0.4">
        <animateMotion
          dur="1.2s"
          repeatCount="indefinite"
          path={`M${x1},${y1} L${x2},${y2}`}
          begin="0.15s"
        />
      </circle>
    </g>
  );
}

interface AgentNodeProps {
  agent: typeof AGENTS[number];
  isActive: boolean;
  isRunning: boolean;
}

function AgentNode({ agent, isActive, isRunning }: AgentNodeProps) {
  const slug = slugify(agent.id);
  const x = agent.x - NODE_W / 2;
  const y = agent.y;

  return (
    <g filter={isActive ? `url(#glow-${slug})` : undefined}>
      {/* Card background */}
      <rect
        x={x} y={y}
        width={NODE_W} height={NODE_H}
        rx={12} ry={12}
        fill={`url(#grad-${slug})`}
        stroke={isActive ? agent.color : '#2a2d3e'}
        strokeWidth={isActive ? 2 : 1}
        opacity={isActive ? 1 : isRunning ? 0.7 : 0.55}
      />

      {/* Inner border highlight */}
      <rect
        x={x + 1} y={y + 1}
        width={NODE_W - 2} height={NODE_H - 2}
        rx={11} ry={11}
        fill="none"
        stroke={agent.color}
        strokeWidth={0.5}
        opacity={isActive ? 0.4 : 0.1}
      />

      {/* Status indicator dot */}
      <circle
        cx={x + 14} cy={y + 16}
        r={4}
        fill={agent.color}
        opacity={isActive ? 1 : 0.4}
        className={isActive ? 'topology-pulse-dot' : ''}
      />

      {/* Agent name */}
      <text
        x={x + 24} y={y + 20}
        fill={agent.color}
        fontSize={13}
        fontWeight={700}
        fontFamily="ui-monospace, monospace"
      >
        {agent.label}
      </text>

      {/* Role */}
      <text
        x={x + 14} y={y + 40}
        fill="#6b7280"
        fontSize={10}
        fontFamily="ui-monospace, monospace"
      >
        {agent.role}
      </text>

      {/* Wallet balance */}
      <text
        x={x + 14} y={y + 58}
        fill={isActive ? '#9ca3af' : '#4b5563'}
        fontSize={10}
        fontFamily="ui-monospace, monospace"
      >
        {agent.balance}
      </text>

      {/* Active badge */}
      {isActive && (
        <g>
          <rect
            x={x + NODE_W - 42} y={y + 48}
            width={32} height={16}
            rx={4}
            fill={agent.color}
            opacity={0.15}
          />
          <text
            x={x + NODE_W - 38} y={y + 59}
            fill={agent.color}
            fontSize={8}
            fontWeight={600}
            fontFamily="ui-monospace, monospace"
          >
            LIVE
          </text>
        </g>
      )}
    </g>
  );
}

// --- Utilities ---

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-');
}

// --- CSS animations ---
const ANIMATION_CSS = `
@keyframes topology-dash {
  to { stroke-dashoffset: -40; }
}

@keyframes topology-pulse {
  0%, 100% { opacity: 1; r: 4; }
  50% { opacity: 0.3; r: 6; }
}

.topology-dash-flow {
  animation: topology-dash 1.5s linear infinite;
}

.topology-pulse-dot {
  animation: topology-pulse 1.5s ease-in-out infinite;
}
`;
