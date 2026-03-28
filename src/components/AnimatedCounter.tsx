'use client';
import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix: string;
  duration: number;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function AnimatedCounter({ value, suffix, duration }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = easedProgress * value;

      setDisplay(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  // Format: use 1 decimal if the target value has decimals, otherwise integer
  const hasDecimals = value % 1 !== 0;
  const formatted = hasDecimals ? display.toFixed(1) : Math.round(display).toString();

  return (
    <span className="font-mono">
      {formatted}
      {suffix && <span className="text-sm text-[#9ca3af] ml-1">{suffix}</span>}
    </span>
  );
}
