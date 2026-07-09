"use client";

// The adventure map: your character walks a night road from the dorm desk to
// the summit, powered entirely by XP (focused minutes + word reviews).
// Progress is server-derived; this page just draws where you are.

import { useEffect, useState } from "react";

import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import CoinIcon from "../../components/CoinIcon";
import { characterLook } from "../../lib/character";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";

// Mirrors backend app/services/rewards.py.
const LEVEL_STEP_XP = 120;

interface Stop {
  level: number;
  name: string;
  blurb: string;
}

const STOPS: Stop[] = [
  { level: 1, name: "Dorm Desk", blurb: "Where every journey starts." },
  { level: 2, name: "Campus Library", blurb: "Two focused hours got you here." },
  { level: 3, name: "Midnight Cafe", blurb: "The regulars nod. You belong." },
  { level: 5, name: "City Rooftop", blurb: "The town looks small from up here." },
  { level: 8, name: "Mountain Trail", blurb: "Thin air, thick vocabulary." },
  { level: 12, name: "The Lighthouse", blurb: "You keep other ships focused now." },
  { level: 20, name: "The Summit", blurb: "Legend of the study hall." },
];

function Traveler({ userId }: { userId: string }) {
  const look = characterLook(userId);
  return (
    <svg viewBox="0 0 40 44" className="anim-walkbob h-11 w-10">
      <path d="M8 40 Q8 24 20 24 Q32 24 32 40 Z" fill={look.body} />
      <circle cx="20" cy="16" r="11" fill={look.body} />
      {look.seed % 3 === 0 && (
        <>
          <circle cx="12" cy="8" r="3.5" fill={look.body} />
          <circle cx="28" cy="8" r="3.5" fill={look.body} />
        </>
      )}
      {look.seed % 3 === 1 && (
        <>
          <path d="M11 10 l-3 -7 l7 3 Z" fill={look.bodyDark} />
          <path d="M29 10 l3 -7 l-7 3 Z" fill={look.bodyDark} />
        </>
      )}
      <g fill="#3A3050">
        <circle cx="16" cy="16" r="1.7" />
        <circle cx="24" cy="16" r="1.7" />
      </g>
      {/* tiny backpack: an adventurer, not a student, tonight */}
      <rect x="4" y="26" width="7" height="9" rx="2" fill={look.bodyDark} />
    </svg>
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
  const next = STOPS[reachedIdx + 1] ?? null;

  // Fraction of the way from the reached stop to the next one, in XP.
  const reachedXp = (STOPS[reachedIdx].level - 1) * LEVEL_STEP_XP;
  const nextXp = next ? (next.level - 1) * LEVEL_STEP_XP : reachedXp;
  const frac = next
    ? Math.min(1, (user.xp - reachedXp) / (nextXp - reachedXp))
    : 1;
  const xpToNext = next ? nextXp - user.xp : 0;

  // Character position across the whole trail (percent of width).
  const segment = 100 / (STOPS.length - 1);
  const positionPct = (reachedIdx + frac * (next ? 1 : 0)) * segment;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-paper">
        The night road
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-dim">
        Every focused minute and every word you remember moves your character
        down the road. No shortcuts; the server keeps the ledger.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-night-raised px-3 py-1 font-mono text-xs text-mint">
          lv {level}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-night-raised px-3 py-1 font-mono text-xs text-lamp">
          <CoinIcon className="h-3.5 w-3.5" />
          {user.coins}
        </span>
        <span className="font-mono text-xs text-ink-dim">
          {user.xp} xp total
        </span>
      </div>

      {/* the trail */}
      <section className="mt-10 overflow-x-auto pb-4">
        <div className="relative min-w-[720px] px-6 pt-14">
          {/* road */}
          <div className="absolute left-6 right-6 top-[88px] h-1 rounded-full bg-night-line" />
          <div
            className="absolute left-6 top-[88px] h-1 rounded-full bg-lamp transition-all duration-700"
            style={{ width: `calc((100% - 3rem) * ${positionPct / 100})` }}
          />

          {/* traveler */}
          <div
            className="absolute top-6 -translate-x-1/2 transition-all duration-700"
            style={{ left: `calc(1.5rem + (100% - 3rem) * ${positionPct / 100})` }}
          >
            <Traveler userId={user.id} />
          </div>

          {/* stops */}
          <div className="flex justify-between">
            {STOPS.map((stop, i) => {
              const reached = i <= reachedIdx;
              const isNext = i === reachedIdx + 1;
              return (
                <div key={stop.name} className="w-24 text-center">
                  <div
                    className={`mx-auto mt-9 h-3.5 w-3.5 rounded-full border-2 ${
                      reached
                        ? "border-lamp bg-lamp"
                        : isNext
                          ? "border-lamp bg-night"
                          : "border-night-line bg-night"
                    }`}
                  />
                  <p
                    className={`mt-2 text-xs font-bold ${
                      reached ? "text-paper" : "text-ink-dim"
                    }`}
                  >
                    {stop.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-dim">
                    lv {stop.level}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* status card */}
      <section className="mt-6 max-w-xl rounded-2xl border border-night-line bg-night-raised p-6">
        {next ? (
          <>
            <p className="text-sm text-paper">
              <span className="font-bold text-lamp">{xpToNext} xp</span> to{" "}
              <span className="font-bold">{next.name}</span>. That is about{" "}
              {Math.ceil(xpToNext / 60)} focused{" "}
              {Math.ceil(xpToNext / 60) === 1 ? "hour" : "hours"}, or fewer if
              you clear word cards on the way.
            </p>
            <p className="mt-2 text-xs text-ink-dim">
              {STOPS[reachedIdx].blurb}
            </p>
            {hint && (
              <p className="mt-3 text-xs text-ink-dim">
                A card is waiting for you: <span className="text-lamp">{hint}</span>.
                Start a session in any room to practice it.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-mint">
            You reached the summit. We are as surprised as you are. New roads
            soon.
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
