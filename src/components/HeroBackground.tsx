'use client';

const DOTS = [
  { x: 5, y: 8, color: 'cyan', size: 3, delay: 0, dur: 6 },
  { x: 12, y: 25, color: 'purple', size: 2, delay: 1.2, dur: 7 },
  { x: 22, y: 12, color: 'cyan', size: 2.5, delay: 0.5, dur: 8 },
  { x: 30, y: 35, color: 'purple', size: 3, delay: 2, dur: 6.5 },
  { x: 40, y: 8, color: 'cyan', size: 2, delay: 0.8, dur: 7 },
  { x: 48, y: 22, color: 'purple', size: 2.5, delay: 1.5, dur: 9 },
  { x: 55, y: 45, color: 'cyan', size: 3, delay: 0.3, dur: 6 },
  { x: 65, y: 15, color: 'purple', size: 2, delay: 2.5, dur: 7.5 },
  { x: 72, y: 30, color: 'cyan', size: 2.5, delay: 1, dur: 8 },
  { x: 80, y: 10, color: 'purple', size: 3, delay: 0.7, dur: 6 },
  { x: 88, y: 40, color: 'cyan', size: 2, delay: 1.8, dur: 7 },
  { x: 95, y: 20, color: 'purple', size: 2.5, delay: 0.4, dur: 9 },
  { x: 15, y: 55, color: 'cyan', size: 3, delay: 2.2, dur: 6.5 },
  { x: 25, y: 70, color: 'purple', size: 2, delay: 0.9, dur: 8 },
  { x: 35, y: 60, color: 'cyan', size: 2.5, delay: 1.3, dur: 7 },
  { x: 50, y: 75, color: 'purple', size: 3, delay: 0.6, dur: 6 },
  { x: 60, y: 58, color: 'cyan', size: 2, delay: 2.8, dur: 9 },
  { x: 70, y: 80, color: 'purple', size: 2.5, delay: 1.1, dur: 7.5 },
  { x: 82, y: 65, color: 'cyan', size: 3, delay: 0.2, dur: 6 },
  { x: 92, y: 78, color: 'purple', size: 2, delay: 1.7, dur: 8 },
  { x: 8, y: 88, color: 'cyan', size: 2.5, delay: 3, dur: 7 },
  { x: 18, y: 42, color: 'purple', size: 3, delay: 0.1, dur: 6.5 },
  { x: 42, y: 50, color: 'cyan', size: 2, delay: 2.4, dur: 9 },
  { x: 58, y: 90, color: 'purple', size: 2.5, delay: 1.6, dur: 7 },
  { x: 75, y: 50, color: 'cyan', size: 3, delay: 0.5, dur: 6 },
];

const LINES: [number, number][] = [
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7],
  [6, 8], [7, 9], [8, 10], [9, 11], [10, 11],
  [12, 14], [13, 15], [14, 16], [15, 17], [16, 18],
  [17, 19], [18, 19], [1, 12], [3, 14], [5, 15],
  [7, 16], [9, 18], [20, 13], [21, 1], [22, 6],
  [23, 17], [24, 8], [0, 21], [4, 7], [12, 21],
];

export default function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0a0b0f',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(6px, -8px); }
          50% { transform: translate(-4px, 6px); }
          75% { transform: translate(5px, 4px); }
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 0.3; r: var(--dot-r); }
          50% { opacity: 0.8; r: calc(var(--dot-r) + 1.5px); }
        }
        @keyframes heroLineFade {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.18; }
        }
        @keyframes heroDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3px, -2px) scale(1.002); }
          66% { transform: translate(-2px, 3px) scale(0.998); }
        }
      `}</style>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          animation: 'heroDrift 20s ease-in-out infinite',
        }}
      >
        {LINES.map(([a, b], i) => (
          <line
            key={`l-${i}`}
            x1={DOTS[a].x}
            y1={DOTS[a].y}
            x2={DOTS[b].x}
            y2={DOTS[b].y}
            stroke="#2a2d3e"
            strokeWidth="0.08"
            style={{
              animation: `heroLineFade ${6 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}

        {DOTS.map((dot, i) => {
          const fill = dot.color === 'cyan' ? '#00f0ff' : '#8b5cf6';
          const shouldPulse = i % 3 === 0;
          return (
            <circle
              key={`d-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size * 0.3}
              fill={fill}
              style={{
                '--dot-r': `${dot.size * 0.3}px`,
                opacity: shouldPulse ? undefined : 0.35,
                animation: shouldPulse
                  ? `heroPulse ${dot.dur}s ease-in-out ${dot.delay}s infinite, heroFloat ${dot.dur + 2}s ease-in-out ${dot.delay}s infinite`
                  : `heroFloat ${dot.dur}s ease-in-out ${dot.delay}s infinite`,
              } as React.CSSProperties}
            />
          );
        })}
      </svg>
    </div>
  );
}
