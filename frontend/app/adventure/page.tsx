"use client";

// The coast road: a winding trail over the water, one island per stop.
// Your character stands on the island your level has reached; the trail
// behind you is lit amber, the stops ahead wait in the haze. Powered
// entirely by XP, the server keeps the ledger.

import { useEffect, useState } from "react";

import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import CoinIcon from "../../components/CoinIcon";
import { StandingFigure } from "../../components/scene";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";

// Mirrors backend app/services/rewards.py.
const LEVEL_STEP_XP = 120;

type LandmarkKind =
  | "desk"
  | "library"
  | "cafe"
  | "rooftop"
  | "cliff"
  | "lighthouse"
  | "horizon";

interface Stop {
  level: number;
  name: string;
  blurb: string;
  x: number;
  y: number;
  landmark: LandmarkKind;
}

// Coordinates live in the map's 400 x 760 viewBox; the road starts at the
// bottom of the map and walks toward the horizon.
const STOPS: Stop[] = [
  { level: 1, name: "Window Desk", blurb: "Where every journey starts.", x: 95, y: 690, landmark: "desk" },
  { level: 2, name: "Boardwalk Library", blurb: "Two focused hours got you here.", x: 300, y: 592, landmark: "library" },
  { level: 3, name: "Tide-pool Cafe", blurb: "The regulars nod. You belong.", x: 92, y: 490, landmark: "cafe" },
  { level: 5, name: "Harbor Rooftop", blurb: "The boats look small from up here.", x: 306, y: 388, landmark: "rooftop" },
  { level: 8, name: "Cliff Trail", blurb: "Salt air, thick vocabulary.", x: 96, y: 288, landmark: "cliff" },
  { level: 12, name: "The Lighthouse", blurb: "You keep other ships focused now.", x: 298, y: 186, landmark: "lighthouse" },
  { level: 20, name: "Horizon Point", blurb: "Legend of the seaside study room.", x: 180, y: 74, landmark: "horizon" },
];

const MAP_W = 400;
const MAP_H = 760;

/* Smooth serpentine through the stops: vertical-midpoint cubic segments. */
function roadPath(): string {
  let d = `M ${STOPS[0].x} ${STOPS[0].y}`;
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    const midY = (a.y + b.y) / 2;
    d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
  }
  return d;
}

/* --- landmark palette, matching the flat low-saturation look of scene.tsx.
   Reached stops draw in full color; stops still ahead collapse into one
   hazy silhouette tone and read as shapes on the horizon. --- */

interface LmColors {
  wood: string;
  woodDark: string;
  metal: string;
  paper: string;
  green: string;
  clay: string;
}

const LM_FULL: LmColors = {
  wood: "#c9a87c",
  woodDark: "#a8865d",
  metal: "#3e6472",
  paper: "#f2ede0",
  green: "#8fae8c",
  clay: "#c05b45",
};

const LM_SILHOUETTE: LmColors = {
  wood: "#a9bcc4",
  woodDark: "#9db1ba",
  metal: "#9db1ba",
  paper: "#b8c8cf",
  green: "#a9bcc4",
  clay: "#a9bcc4",
};

/* Each landmark is drawn with its ground line at y=0, centered on x=0.
   `lit` marks the island you are standing on: its lamp turns amber. */
function Landmark({ kind, c, lit }: { kind: LandmarkKind; c: LmColors; lit: boolean }) {
  const lamp = lit ? "var(--sun)" : c.metal;
  switch (kind) {
    case "desk":
      // The desk from the room, with its lamp: where every journey starts.
      return (
        <g>
          <rect x="-15" y="-13" width="30" height="3.5" rx="1.5" fill={c.wood} />
          <rect x="-12" y="-9.5" width="3" height="9.5" fill={c.woodDark} />
          <rect x="9" y="-9.5" width="3" height="9.5" fill={c.woodDark} />
          <rect x="-13" y="-16" width="7" height="2" rx="1" fill={c.metal} />
          <line x1="-9.5" y1="-16" x2="-9.5" y2="-25" stroke={c.metal} strokeWidth="1.8" />
          <path d="M-9.5 -25 L-4 -29" stroke={c.metal} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-6.5 -31 L-1 -28.5 L-4.5 -24.5 L-8.5 -27.5 Z" fill={lamp} />
          {lit && <path d="M-4 -26 L2 -13.5 L-12 -13.5 Z" fill="var(--sun)" opacity="0.2" className="anim-lampglow" />}
          <path d="M2 -14.5 l4 -1.2 l4 1.2 Z" fill={c.paper} />
        </g>
      );
    case "library":
      // A bookshelf up on boardwalk piles.
      return (
        <g>
          <rect x="-18" y="-6" width="36" height="2.5" rx="1" fill={c.wood} />
          <rect x="-14" y="-3.5" width="2.5" height="3.5" fill={c.woodDark} />
          <rect x="-1" y="-3.5" width="2.5" height="3.5" fill={c.woodDark} />
          <rect x="11.5" y="-3.5" width="2.5" height="3.5" fill={c.woodDark} />
          <rect x="-12" y="-32" width="24" height="26" rx="1.5" fill={c.woodDark} />
          <rect x="-10" y="-30" width="20" height="10" fill={c.paper} />
          <rect x="-10" y="-18" width="20" height="10" fill={c.paper} />
          <g>
            <rect x="-8.5" y="-28.5" width="3" height="8.5" fill={c.metal} />
            <rect x="-4.5" y="-27.5" width="3" height="7.5" fill={c.green} />
            <rect x="-0.5" y="-28.5" width="3" height="8.5" fill={c.clay} />
            <rect x="3.5" y="-27" width="3" height="7" fill={c.wood} />
            <rect x="-8.5" y="-16.5" width="3" height="8.5" fill={c.green} />
            <rect x="-4.5" y="-15.5" width="3" height="7.5" fill={c.wood} />
            <rect x="-0.5" y="-16.5" width="3" height="8.5" fill={c.metal} />
            <rect x="3.5" y="-15.5" width="3" height="7.5" fill={c.clay} />
          </g>
        </g>
      );
    case "cafe":
      // A parasol over a little table, one cup waiting.
      return (
        <g>
          <line x1="2" y1="0" x2="2" y2="-34" stroke={c.woodDark} strokeWidth="1.8" />
          <path d="M-16 -30 Q2 -44 20 -30 L2 -33 Z" fill={c.clay} />
          <path d="M-16 -30 Q-7 -37 2 -37.5 L2 -33 Z" fill={c.paper} />
          <path d="M20 -30 Q11 -37 2 -37.5 L2 -33 Z" fill={c.paper} />
          <ellipse cx="-8" cy="-12" rx="8" ry="2.5" fill={c.wood} />
          <line x1="-8" y1="-10" x2="-8" y2="0" stroke={c.woodDark} strokeWidth="1.6" />
          <rect x="-10.5" y="-16.5" width="5" height="4" rx="1" fill={lit ? "var(--sun)" : c.metal} />
          <path d="M-5.5 -15.5 q2.5 0 0 2.5" fill="none" stroke={lit ? "var(--sun)" : c.metal} strokeWidth="1" />
        </g>
      );
    case "rooftop":
      // A harbor house with a flat roof terrace and a flag in the wind.
      return (
        <g>
          <rect x="-16" y="-22" width="32" height="22" rx="1.5" fill={c.paper} />
          <rect x="-18" y="-26" width="36" height="4" rx="1.5" fill={c.metal} />
          <g stroke={c.metal} strokeWidth="1.2">
            <line x1="-14" y1="-26" x2="-14" y2="-30" />
            <line x1="-6" y1="-26" x2="-6" y2="-30" />
            <line x1="2" y1="-26" x2="2" y2="-30" />
            <line x1="10" y1="-26" x2="10" y2="-30" />
            <line x1="-16" y1="-30" x2="12" y2="-30" />
          </g>
          <rect x="-9" y="-17" width="6" height="6" rx="1" fill={lit ? "var(--sun)" : c.metal} opacity={lit ? 1 : 0.85} />
          <rect x="4" y="-17" width="6" height="6" rx="1" fill={c.metal} opacity="0.85" />
          <line x1="15" y1="-26" x2="15" y2="-40" stroke={c.woodDark} strokeWidth="1.6" />
          <path d="M15 -40 L26 -37 L15 -34 Z" fill={c.clay} />
        </g>
      );
    case "cliff":
      // Stacked cliff rocks and the trail signpost.
      return (
        <g>
          <path d="M-20 0 L-16 -14 L-6 -18 L4 -12 L6 0 Z" fill={c.metal} opacity="0.85" />
          <path d="M-14 -14 L-6 -17 L2 -12 L-4 -8 Z" fill={c.paper} opacity="0.5" />
          <path d="M2 0 L5 -8 L14 -10 L18 0 Z" fill={c.woodDark} opacity="0.7" />
          <line x1="12" y1="0" x2="12" y2="-26" stroke={c.woodDark} strokeWidth="2" />
          <path d="M4 -26 h14 l4 3 l-4 3 h-14 Z" fill={lit ? "var(--sun)" : c.wood} />
          <g stroke={c.green} strokeWidth="1.4" strokeLinecap="round" fill="none">
            <path d="M-10 -18 q-1 -4 -3 -5" />
            <path d="M-8 -18 q1 -4 2 -6" />
          </g>
        </g>
      );
    case "lighthouse":
      // The lighthouse. When you stand here, the lamp sweeps warm light.
      return (
        <g>
          {lit && (
            <g className="anim-lampglow">
              <path d="M-3 -47 L-34 -56 L-34 -40 Z" fill="var(--sun)" opacity="0.28" />
              <path d="M3 -47 L34 -54 L34 -38 Z" fill="var(--sun)" opacity="0.28" />
            </g>
          )}
          <path d="M-8 0 L-5.5 -38 L5.5 -38 L8 0 Z" fill={c.paper} />
          <path d="M-7.3 -10 L-6.6 -20 L6.6 -20 L7.3 -10 Z" fill={c.clay} />
          <path d="M-6.2 -28 L-5.9 -33 L5.9 -33 L6.2 -28 Z" fill={c.clay} />
          <rect x="-7" y="-40" width="14" height="2.5" rx="1" fill={c.metal} />
          <rect x="-4.5" y="-47" width="9" height="7" rx="1" fill={lit ? "var(--sun)" : c.metal} />
          <path d="M-5 -47 Q0 -52 5 -47 Z" fill={c.metal} />
          <rect x="-3" y="-8" width="6" height="8" rx="2.5" fill={c.metal} />
        </g>
      );
    case "horizon":
      // The lookout: a raised deck and a telescope aimed past the map.
      return (
        <g>
          <line x1="-10" y1="0" x2="-10" y2="-18" stroke={c.woodDark} strokeWidth="2" />
          <line x1="10" y1="0" x2="10" y2="-18" stroke={c.woodDark} strokeWidth="2" />
          <line x1="-10" y1="-4" x2="10" y2="-14" stroke={c.woodDark} strokeWidth="1.2" />
          <rect x="-15" y="-21" width="30" height="3" rx="1.5" fill={c.wood} />
          <g stroke={c.woodDark} strokeWidth="1.3">
            <line x1="-13" y1="-21" x2="-13" y2="-29" />
            <line x1="0" y1="-21" x2="0" y2="-29" />
            <line x1="13" y1="-21" x2="13" y2="-29" />
            <line x1="-15" y1="-29" x2="15" y2="-29" />
          </g>
          <line x1="4" y1="-30" x2="14" y2="-40" stroke={c.metal} strokeWidth="3" strokeLinecap="round" />
          <circle cx="15" cy="-41" r="2.2" fill={lit ? "var(--sun)" : c.metal} />
          <line x1="4" y1="-30" x2="4" y2="-26" stroke={c.metal} strokeWidth="1.6" />
        </g>
      );
  }
}

/* A small island under each stop: sand, a foam ring, and its landmark. */
function Island({ stop, reached, current }: { stop: Stop; reached: boolean; current: boolean }) {
  return (
    <g opacity={reached ? 1 : 0.5}>
      {/* foam ring on the water */}
      <ellipse cx={stop.x} cy={stop.y + 8} rx="40" ry="13" fill="none" stroke="#ffffffcc" strokeWidth="2" />
      {/* the sand */}
      <ellipse cx={stop.x} cy={stop.y + 6} rx="33" ry="10" fill={reached ? "#e0cfa4" : "#ccccbd"} />
      <ellipse cx={stop.x} cy={stop.y + 3.5} rx="26" ry="7" fill={reached ? "#eee0bd" : "#dcdccf"} />
      {/* warm ground light where you are standing */}
      {current && (
        <ellipse
          cx={stop.x}
          cy={stop.y + 4}
          rx="26"
          ry="8"
          fill="var(--sun)"
          opacity="0.22"
          className="anim-lampglow"
        />
      )}
      {/* a tuft of dune grass */}
      <g stroke={reached ? "#7f9f7c" : "#9aa79c"} strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d={`M ${stop.x - 18} ${stop.y + 4} q -1 -6 -4 -8`} />
        <path d={`M ${stop.x - 16} ${stop.y + 4} q 1 -6 3 -9`} />
      </g>
      {/* the landmark this stop is named for */}
      <g transform={`translate(${stop.x + 6}, ${stop.y + 3})`}>
        <Landmark
          kind={stop.landmark}
          c={reached ? LM_FULL : LM_SILHOUETTE}
          lit={current}
        />
      </g>
    </g>
  );
}

function AdventureView() {
  const { user, refreshUser } = useAuth();

  // Numbers may be stale if a reward landed on another page; refresh once.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    api
      .practiceCards(1)
      .then((cards) => {
        if (cards.length > 0) setHint(cards[0].term);
      })
      .catch(() => {});
  }, []);

  if (!user) return null;

  const level = user.level;
  const reachedIdx = STOPS.reduce(
    (acc, stop, i) => (level >= stop.level ? i : acc),
    0,
  );
  const current = STOPS[reachedIdx];
  const next = STOPS[reachedIdx + 1] ?? null;

  // Fraction of the way from the reached stop to the next one, in XP.
  const reachedXp = (current.level - 1) * LEVEL_STEP_XP;
  const nextXp = next ? (next.level - 1) * LEVEL_STEP_XP : reachedXp;
  const frac = next
    ? Math.min(1, Math.max(0, (user.xp - reachedXp) / (nextXp - reachedXp)))
    : 1;
  const xpToNext = next ? Math.max(0, nextXp - user.xp) : 0;
  const focusedHours = Math.max(1, Math.ceil(xpToNext / 60));

  // Lit portion of the road, as a percent of its full length.
  const progressPct =
    ((reachedIdx + (next ? frac : 0)) / (STOPS.length - 1)) * 100;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl font-medium text-ink">
          The coast road
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full border border-white/60 bg-surface px-3 py-1 font-mono text-xs text-mint">
            lv {level}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/60 bg-surface px-3 py-1 font-mono text-xs text-sun">
            <CoinIcon className="h-3.5 w-3.5" />
            {user.coins}
          </span>
          <span className="font-mono text-xs text-muted">
            {user.xp} xp total
          </span>
        </div>
      </div>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Focused minutes and remembered words carry you from island to island.
      </p>

      {/* the map: a tall pane of glass over the water */}
      <section className="glass relative mt-6 overflow-hidden rounded-3xl">
        <div className="relative">
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            className="block h-auto w-full"
            aria-hidden="true"
          >
            {/* the road, then the part of it you have walked */}
            <path
              d={roadPath()}
              fill="none"
              stroke="#ffffffd9"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="0.35 1"
              pathLength={100}
            />
            <path
              d={roadPath()}
              fill="none"
              stroke="var(--sun)"
              strokeWidth="3.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${progressPct} 100`}
              style={{ transition: "stroke-dasharray 0.7s ease" }}
            />
            {STOPS.map((stop, i) => (
              <Island
                key={stop.name}
                stop={stop}
                reached={i <= reachedIdx}
                current={i === reachedIdx}
              />
            ))}
          </svg>

          {/* your character, standing beside the landmark on your island */}
          <div
            className="absolute -translate-x-1/2 -translate-y-full transition-all duration-700"
            style={{
              left: `${((current.x - 16) / MAP_W) * 100}%`,
              top: `${((current.y + 7) / MAP_H) * 100}%`,
            }}
          >
            <StandingFigure userId={user.id} className="h-14 w-12 sm:h-16 sm:w-14" />
          </div>

          {/* stop labels, beside each island on the open-water side */}
          {STOPS.map((stop, i) => {
            const reached = i <= reachedIdx;
            const isCurrent = i === reachedIdx;
            const isNext = i === reachedIdx + 1;
            const onLeft = stop.x > MAP_W / 2;
            return (
              <div
                key={stop.name}
                className={`absolute w-[38%] sm:w-[40%] ${onLeft ? "text-right" : "text-left"}`}
                style={{
                  top: `${((stop.y - 26) / MAP_H) * 100}%`,
                  ...(onLeft
                    ? { right: `${((MAP_W - stop.x + 52) / MAP_W) * 100}%` }
                    : { left: `${((stop.x + 52) / MAP_W) * 100}%` }),
                }}
              >
                <p
                  className={`font-display text-sm leading-tight sm:text-base ${
                    reached ? "text-ink" : "text-muted/80"
                  }`}
                >
                  {stop.name}
                </p>
                <p className="font-mono text-[10px] text-muted">lv {stop.level}</p>
                {isCurrent && (
                  <span className="mt-1 inline-block rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium text-white">
                    you are here
                  </span>
                )}
                {isNext && (
                  <span className="mt-1 inline-block rounded-full border border-white/60 bg-surface px-2 py-0.5 font-mono text-[10px] text-sun">
                    {xpToNext} xp to go
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* where you stand, in words */}
      <section className="glass mt-5 rounded-2xl p-5">
        {next ? (
          <>
            <p className="text-sm text-ink">
              <span className="font-semibold">{current.name}.</span>{" "}
              <span className="text-muted">{current.blurb}</span>
            </p>
            <p className="mt-2 text-sm text-ink">
              <span className="font-semibold text-sun">{xpToNext} xp</span> to{" "}
              {next.name}: about {focusedHours} focused{" "}
              {focusedHours === 1 ? "hour" : "hours"}, fewer with word cards.
            </p>
          </>
        ) : (
          <p className="text-sm text-mint">
            You reached the horizon. We are as surprised as you are. New roads
            soon.
          </p>
        )}
        {hint && (
          <p className="mt-2 text-sm text-muted">
            A card is waiting for you:{" "}
            <span className="font-medium text-sun">{hint}</span>. Start a
            session in any room to practice it.
          </p>
        )}
      </section>
    </main>
  );
}

export default function AdventurePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <RequireAuth>
        <AdventureView />
      </RequireAuth>
    </div>
  );
}
