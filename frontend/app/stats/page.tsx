"use client";

// "My desk": lifetime focus totals, a daily log, and the hall leaderboard.
// Aggregates come from the nightly Celery rollup; the leaderboard is the
// worker-maintained Redis sorted set. Both can be empty on a fresh install.

import { useEffect, useState } from "react";

import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { LeaderboardEntry, MyStats } from "../../lib/types";

function fmtHours(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function StatsView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.myStats(30), api.leaderboard(10)])
      .then(([s, b]) => {
        setStats(s);
        setBoard(b);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load stats"),
      );
  }, []);

  const maxDay = stats
    ? Math.max(1, ...stats.days.map((d) => d.total_focus_seconds))
    : 1;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">
        My desk
      </h1>
      <p className="mt-1 text-sm text-muted">
        Totals are tallied overnight, so today shows up tomorrow.
      </p>

      {error && <p className="mt-6 text-sm text-coral">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* lifetime numbers */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              {
                label: "focus logged",
                value: stats ? fmtHours(stats.total_focus_seconds) : "...",
              },
              {
                label: "sessions",
                value: stats ? String(stats.total_sessions) : "...",
              },
              {
                label: "level",
                value: user ? String(user.level) : "...",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="glass rounded-3xl p-5"
              >
                <p className="font-mono text-3xl text-sun">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </section>

          {/* daily log */}
          <section className="glass rounded-3xl p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
              last 30 nights
            </h2>
            {stats === null ? (
              <p className="mt-4 text-muted">Opening the ledger...</p>
            ) : stats.days.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Nothing tallied yet. Finish a session tonight and it lands
                here after the nightly rollup.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2.5">
                {stats.days.map((d) => (
                  <li
                    key={d.date}
                    className="grid grid-cols-[6.5rem_1fr_4rem] items-center gap-3 text-sm"
                  >
                    <span className="font-mono text-xs text-muted">
                      {d.date}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-white/70">
                      <span
                        className="block h-full rounded-full bg-sun"
                        style={{
                          width: `${Math.max(
                            3,
                            (d.total_focus_seconds / maxDay) * 100,
                          )}%`,
                        }}
                      />
                    </span>
                    <span className="text-right font-mono text-xs text-ink">
                      {fmtHours(d.total_focus_seconds)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* leaderboard */}
        <section className="h-fit glass rounded-3xl p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
            hall of focus
          </h2>
          {board === null ? (
            <p className="mt-4 text-muted">...</p>
          ) : board.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No names on the board yet. The first nightly tally writes it.
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {board.map((entry) => (
                <li
                  key={entry.user_id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    className={`w-6 text-right font-mono ${
                      entry.rank === 1 ? "text-sun" : "text-muted"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span
                    className={`flex-1 truncate ${
                      entry.user_id === user?.id
                        ? "font-bold text-sun"
                        : "text-ink"
                    }`}
                  >
                    {entry.display_name}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {fmtHours(entry.focus_seconds)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

export default function StatsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <RequireAuth>
        <StatsView />
      </RequireAuth>
    </div>
  );
}
