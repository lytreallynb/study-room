"use client";

// The coast road as a floor plan: a vertical path through the building,
// one landing per stop. Reached floors are lit; the current one carries
// your marker and the distance to the next. Powered entirely by XP.

import { useEffect, useState } from "react";

import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import CoinIcon from "../../components/CoinIcon";
import { PathNode } from "../../components/art";
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
  { level: 1, name: "Window Desk", blurb: "Where every journey starts." },
  { level: 2, name: "Boardwalk Library", blurb: "Two focused hours got you here." },
  { level: 3, name: "Tide-pool Cafe", blurb: "The regulars nod. You belong." },
  { level: 5, name: "Harbor Rooftop", blurb: "The boats look small from up here." },
  { level: 8, name: "Cliff Trail", blurb: "Salt air, thick vocabulary." },
  { level: 12, name: "The Lighthouse", blurb: "You keep other ships focused now." },
  { level: 20, name: "Horizon Point", blurb: "Legend of the seaside study room." },
];

function YouMarker({ userId, name }: { userId: string; name: string }) {
  const look = characterLook(userId);
  return (
    <span className="anim-walkbob inline-flex items-center gap-2 rounded-lg bg-ink/85 px-2.5 py-1 text-xs font-medium text-paper">
      <span
        className="h-2.5 w-2.5 rounded-full ring-2 ring-paper/60"
        style={{ backgroundColor: look.body }}
      />
      {name}, you are here
    </span>
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
  const nextXp = next ? (next.level - 1) * LEVEL_STEP_XP : user.xp;
  const xpToNext = next ? Math.max(0, nextXp - user.xp) : 0;
  const focusedHours = Math.max(1, Math.ceil(xpToNext / 60));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl font-medium text-ink">
          The coast road
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-mint">
            lv {level}
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-sun">
            <CoinIcon className="h-3.5 w-3.5" />
            {user.coins}
          </span>
          <span className="font-mono text-xs text-muted">
            {user.xp} xp total
          </span>
        </div>
      </div>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Focused minutes and remembered words move you down the road. The
        server keeps the ledger.
      </p>

      {/* the path: floors of one building, ground floor first */}
      <section className="mt-8">
        <ol className="relative flex flex-col gap-0">
          {/* the wall the path climbs */}
          <span
            className="absolute bottom-6 left-[7px] top-6 w-px bg-line"
            aria-hidden="true"
          />
          {STOPS.map((stop, i) => {
            const reached = i <= reachedIdx;
            const isCurrent = i === reachedIdx;
            const isNext = i === reachedIdx + 1;
            return (
              <li key={stop.name} className="relative flex gap-5 pb-2 pl-0">
                <span className="z-10 mt-5 shrink-0">
                  <PathNode reached={reached} current={isCurrent} />
                </span>
                <div
                  className={`mb-2 flex-1 rounded-xl px-4 py-3.5 ${
                    isCurrent
                      ? "glass lamp-pool"
                      : reached
                        ? "bg-surface/50"
                        : ""
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span
                      className={`font-display text-lg ${
                        reached ? "text-ink" : "text-muted"
                      }`}
                    >
                      {stop.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      lv {stop.level}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 text-sm ${
                      reached ? "text-muted" : "text-muted/60"
                    }`}
                  >
                    {stop.blurb}
                  </p>
                  {isCurrent && (
                    <div className="mt-3">
                      <YouMarker userId={user.id} name={user.display_name} />
                    </div>
                  )}
                  {isNext && next && (
                    <p className="mt-2 text-sm text-ink">
                      <span className="font-semibold text-sun">
                        {xpToNext} xp
                      </span>{" "}
                      to go, about {focusedHours} focused{" "}
                      {focusedHours === 1 ? "hour" : "hours"}, fewer with word
                      cards.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {!next && (
        <p className="mt-4 text-sm text-mint">
          You reached the horizon. We are as surprised as you are. New roads
          soon.
        </p>
      )}

      {hint && (
        <p className="mt-6 text-sm text-muted">
          A card is waiting for you:{" "}
          <span className="font-medium text-sun">{hint}</span>. Start a
          session in any room to practice it.
        </p>
      )}
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
