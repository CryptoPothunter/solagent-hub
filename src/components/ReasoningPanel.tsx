'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ReasoningEvent {
  agentName: string;
  agentColor: string;
  thoughts: string[];
  timestamp: string;
}

interface ReasoningPanelProps {
  events: ReasoningEvent[];
  isRunning: boolean;
}

/* ------------------------------------------------------------------ */
/*  Inline keyframe styles (injected once)                             */
/* ------------------------------------------------------------------ */

const KEYFRAMES = `
@keyframes rp-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rp-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}
@keyframes rp-pulse {
  0%, 100% { box-shadow: 0 0 4px var(--glow); }
  50%      { box-shadow: 0 0 12px var(--glow); }
}
@keyframes rp-scanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
`;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const PREFIXES = [
  '\u2192 Observing:',
  '\u2192 Analyzing:',
  '\u2192 Deciding:',
  '\u2192 Executing:',
  '\u2192 Result:',
] as const;

/** Single thought line with typewriter fade-in */
function ThoughtLine({
  text,
  index,
  agentColor,
  isLast,
  isRunning,
}: {
  text: string;
  index: number;
  agentColor: string;
  isLast: boolean;
  isRunning: boolean;
}) {
  const prefix = PREFIXES[index % PREFIXES.length];
  const delayMs = index * 320;

  return (
    <div
      style={{
        opacity: 0,
        animation: `rp-fadein 0.4s ease-out ${delayMs}ms forwards`,
        paddingLeft: 20,
        lineHeight: 1.7,
        fontSize: 13,
      }}
    >
      <span style={{ color: agentColor, fontWeight: 600 }}>{prefix} </span>
      <span style={{ color: '#c9cde0' }}>{text}</span>
      {isLast && isRunning && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 16,
            marginLeft: 4,
            verticalAlign: 'text-bottom',
            background: agentColor,
            animation: 'rp-blink 0.8s step-end infinite',
          }}
        />
      )}
    </div>
  );
}

/** One agent's reasoning block (card) */
function AgentBlock({
  event,
  isLatest,
  isRunning,
}: {
  event: ReasoningEvent;
  isLatest: boolean;
  isRunning: boolean;
}) {
  const done = !isLatest || !isRunning;

  return (
    <div
      style={{
        '--glow': event.agentColor,
        background: '#181924',
        border: '1px solid #2a2d3e',
        borderLeft: `3px solid ${event.agentColor}`,
        borderRadius: 8,
        padding: '14px 18px',
        marginBottom: 12,
        position: 'relative',
        animation: isLatest && isRunning ? 'rp-pulse 2.5s ease-in-out infinite' : 'none',
        transition: 'box-shadow 0.3s',
      } as React.CSSProperties}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Glowing dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: event.agentColor,
              boxShadow: `0 0 6px ${event.agentColor}`,
              display: 'inline-block',
            }}
          />
          <span style={{ color: event.agentColor, fontWeight: 700, fontSize: 14 }}>
            {event.agentName}
          </span>
          {done && (
            <span style={{ color: '#34d399', fontSize: 13, marginLeft: 4 }}>&#10003;</span>
          )}
        </div>
        <span style={{ color: '#555b74', fontSize: 11 }}>{event.timestamp}</span>
      </div>

      {/* Thought lines */}
      {event.thoughts.map((t, i) => (
        <ThoughtLine
          key={i}
          text={t}
          index={i}
          agentColor={event.agentColor}
          isLast={i === event.thoughts.length - 1}
          isRunning={isLatest && isRunning}
        />
      ))}
    </div>
  );
}

/** Panel header bar */
function Header({ isRunning }: { isRunning: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: '1px solid #2a2d3e',
        background: '#10111a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15, color: '#00f0ff', fontWeight: 700, letterSpacing: 0.5 }}>
          &#9670; Agent Reasoning Traces
        </span>
        {isRunning && (
          <span
            style={{
              fontSize: 10,
              color: '#0a0b0f',
              background: '#00f0ff',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: 1,
            }}
          >
            Live
          </span>
        )}
      </div>
      {/* Decorative traffic lights */}
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
      </div>
    </div>
  );
}

/** Subtle CRT-style scanline overlay */
function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 12,
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: '100%',
          height: 2,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,240,255,0.04) 50%, transparent 100%)',
          animation: 'rp-scanline 4s linear infinite',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ReasoningPanel({ events, isRunning }: ReasoningPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stylesInjected, setStylesInjected] = useState(false);

  /* Inject keyframes once */
  useEffect(() => {
    if (stylesInjected) return;
    const id = 'rp-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
    setStylesInjected(true);
  }, [stylesInjected]);

  /* Auto-scroll to bottom when new events arrive */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [events]);

  return (
    <div
      style={{
        position: 'relative',
        background: '#0a0b0f',
        borderRadius: 12,
        border: '1px solid #2a2d3e',
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, SFMono-Regular, monospace",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 320,
      }}
    >
      <ScanlineOverlay />
      <Header isRunning={isRunning} />

      {/* Scrollable body */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          position: 'relative',
          zIndex: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: '#2a2d3e #0a0b0f',
        }}
      >
        {events.length === 0 && (
          <div
            style={{
              color: '#555b74',
              textAlign: 'center',
              padding: '48px 0',
              fontSize: 13,
            }}
          >
            {isRunning ? 'Waiting for agent reasoning...' : 'No reasoning traces yet.'}
          </div>
        )}

        {events.map((event, idx) => (
          <AgentBlock
            key={`${event.agentName}-${event.timestamp}-${idx}`}
            event={event}
            isLatest={idx === events.length - 1}
            isRunning={isRunning}
          />
        ))}
      </div>

      {/* Bottom status bar */}
      <div
        style={{
          padding: '8px 18px',
          borderTop: '1px solid #2a2d3e',
          background: '#10111a',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: '#555b74',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isRunning ? '#00f0ff' : '#555b74',
            boxShadow: isRunning ? '0 0 6px #00f0ff' : 'none',
            display: 'inline-block',
            animation: isRunning ? 'rp-blink 1.2s ease-in-out infinite' : 'none',
          }}
        />
        {isRunning ? 'Agents reasoning...' : `${events.length} trace${events.length !== 1 ? 's' : ''} recorded`}
      </div>
    </div>
  );
}
