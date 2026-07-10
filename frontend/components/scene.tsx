"use client";

// The moving parts of the room: a window wall whose light drifts, and an
// analog wall clock whose hands actually sweep. All CSS motion; the clock
// hands get their real angle once on mount and run on pure animation.

import { useEffect, useState } from "react";

/* A wall of glass: outside view drifting, a bar of light crossing slowly. */
export function WindowWall({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <div className="outside-view absolute inset-0" />
      <div className="light-streak" />
      {/* frame */}
      <div className="absolute inset-y-0 left-1/4 w-1 bg-ink/20" />
      <div className="absolute inset-y-0 left-2/4 w-1 bg-ink/20" />
      <div className="absolute inset-y-0 left-3/4 w-1 bg-ink/20" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-ink/15" />
      <div className="absolute inset-x-0 bottom-0 h-2 bg-ink/15" />
      <div className="absolute inset-0 border border-ink/10 shadow-[inset_0_2px_16px_rgba(43,58,62,0.14)]" />
      {children}
    </div>
  );
}

/* Analog clock. Hands start at the real time and sweep via CSS. */
export function WallClock({ className = "h-16 w-16" }: { className?: string }) {
  const [angles, setAngles] = useState<{
    h: number;
    m: number;
    s: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // set once, async (real time is unknowable at prerender)
    Promise.resolve().then(() => {
      if (cancelled) return;
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      setAngles({ h: h * 30, m: m * 6, s: s * 6 });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={`relative rounded-full border-2 border-ink/70 bg-surface shadow-[0_2px_10px_rgba(43,58,62,0.18)] ${className}`}
      role="img"
      aria-label="wall clock"
    >
      {/* tick marks: each in a full-size layer rotated about the center */}
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="absolute inset-0"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <span className="absolute left-1/2 top-[4%] h-[8%] w-px -translate-x-1/2 bg-ink/40" />
        </span>
      ))}
      {angles && (
        <>
          <span
            className="clock-hand hour w-[3px] bg-ink"
            style={{
              height: "26%",
              animationDelay: `-${(angles.h / 360) * 43200}s`,
            }}
          />
          <span
            className="clock-hand minute w-[2px] bg-ink/80"
            style={{
              height: "36%",
              animationDelay: `-${(angles.m / 360) * 3600}s`,
            }}
          />
          <span
            className="clock-hand second w-px bg-coral"
            style={{
              height: "40%",
              animationDelay: `-${(angles.s / 360) * 60}s`,
            }}
          />
        </>
      )}
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
    </div>
  );
}
