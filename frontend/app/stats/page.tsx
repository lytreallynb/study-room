"use client";

// "My desk": the real ledger. Everything on this page is derived from the
// session records and account state the server holds: lifetime and recent
// focus, level and XP, a day-by-day session history, achievements, and
// the hall leaderboard. Nothing is invented client-side.

import { useEffect, useMemo, useState } from "react";

import {
  AchievementBadge,
  computeAchievements,
  computeStreakDays,
} from "../../components/Achievements";
import CoinIcon from "../../components/CoinIcon";
import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import { DeskFigure } from "../../components/scene";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type {
  LeaderboardEntry,
  MyStats,
  Room,
  StudySession,
} from "../../lib/types";

// Mirrors backend app/services/rewards.py.
const LEVEL_STEP_XP = 120;

function fmtHours(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function localDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

function dayLabel(key: string): string {
  const today = localDateKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === today) return "Today";
  if (key === localDateKey(y)) return "Yesterday";
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function startTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DayGroup {
  key: string;
  label: string;
  totalSeconds: number;
  sessions: StudySession[];
}

function groupByDay(sessions: StudySession[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
  for (const s of sorted) {
    const key = localDateKey(new Date(s.started_at));
    let g = groups.get(key);
    if (!g) {
      g = { key, label: dayLabel(key), totalSeconds: 0, sessions: [] };
      groups.set(key, g);
    }
    g.totalSeconds += s.focus_seconds;
    g.sessions.push(s);
  }
  return [...groups.values()];
}

function StatsView() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Coins and level may be stale if a reward landed elsewhere.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    Promise.all([
      api.listSessions(),
      api.listRooms(),
      api.myStats(30),
      api.leaderboard(10),
    ])
      .then(([sess, rms, s, b]) => {
        setSessions(sess);
        setRooms(rms);
        setStats(s);
        setBoard(b);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load your desk"),
      );
  }, []);

  const roomName = useMemo(() => {
    const byId = new Map(rooms.map((r) => [r.id, r.name]));
    return (id: string | null) => (id ? (byId.get(id) ?? "a closed room") : "solo desk");
  }, [rooms]);

  const derived = useMemo(() => {
    if (!sessions) return null;
    const now = new Date();
    const todayKey = localDateKey(now);
    const weekCutoff = new Date(now);
    weekCutoff.setDate(weekCutoff.getDate() - 6);
    weekCutoff.setHours(0, 0, 0, 0);

    let total = 0;
    let today = 0;
    let week = 0;
    for (const s of sessions) {
      total += s.focus_seconds;
      const started = new Date(s.started_at);
      if (localDateKey(started) === todayKey) today += s.focus_seconds;
      if (started >= weekCutoff) week += s.focus_seconds;
    }
    return {
      total,
      today,
      week,
      streak: computeStreakDays(sessions),
      groups: groupByDay(sessions),
    };
  }, [sessions]);

  const achievements = useMemo(
    () => (sessions && user ? computeAchievements(sessions, user) : null),
    [sessions, user],
  );

  if (!user) return null;

  const xpInto = user.xp - (user.level - 1) * LEVEL_STEP_XP;
  const xpPct = Math.min(100, Math.round((xpInto / LEVEL_STEP_XP) * 100));
  const unlockedCount = achievements?.filter((a) => a.done).length ?? 0;

  const tiles = [
    { label: "focus logged", value: derived ? fmtHours(derived.total) : "..." },
    { label: "today", value: derived ? fmtHours(derived.today) : "..." },
    { label: "last 7 days", value: derived ? fmtHours(derived.week) : "..." },
    {
      label: "day streak",
      value: derived ? String(derived.streak) : "...",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">My desk</h1>
      <p className="mt-1 text-sm text-muted">
        Every number below comes from your sessions on the server.
      </p>

      {error && <p className="mt-6 text-sm text-coral">{error}</p>}

      {/* who you are at this desk: level, xp toward the next, coins */}
      <section className="glass relative mt-6 overflow-hidden rounded-3xl">
        <div
          className="lamp-strip anim-lampglow absolute left-10 top-0 w-12"
          aria-hidden="true"
        />
        <div className="lamp-pool pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-7">
          <DeskFigure userId={user.id} status="focusing" className="h-24 w-28" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-ink">{user.display_name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/60 bg-surface px-2.5 py-0.5 font-mono text-mint">
                lv {user.level}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/60 bg-surface px-2.5 py-0.5 font-mono text-sun">
                <CoinIcon className="h-3 w-3" />
                {user.coins}
              </span>
              <span className="font-mono text-muted">{user.xp} xp total</span>
            </div>
            <div className="mt-2.5 max-w-sm">
              <div className="flex justify-between font-mono text-[10px] text-muted">
                <span>
                  {xpInto} / {LEVEL_STEP_XP} xp
                </span>
                <span>lv {user.level + 1}</span>
              </div>
              <div
                className="mt-1 h-2 overflow-hidden rounded-full bg-surface"
                role="progressbar"
                aria-valuenow={xpInto}
                aria-valuemin={0}
                aria-valuemax={LEVEL_STEP_XP}
                aria-label={`XP toward level ${user.level + 1}`}
              >
                <span
                  className="block h-full rounded-full bg-sun transition-[width] duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* the four numbers that matter */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="glass rounded-2xl p-4 sm:p-5">
            <p className="font-mono text-2xl text-sun sm:text-3xl">{t.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted">
              {t.label}
            </p>
          </div>
        ))}
      </section>

      {/* achievements: all real, all earned or honestly in progress */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
            achievements
          </h2>
          {achievements && (
            <span className="font-mono text-xs text-muted">
              {unlockedCount} / {achievements.length} unlocked
            </span>
          )}
        </div>
        {achievements === null ? (
          <p className="mt-4 text-muted">Polishing the medals...</p>
        ) : (
          <>
            {unlockedCount === 0 && (
              <p className="mt-2 text-sm text-muted">
                All still waiting for you. The first one unlocks with a single
                focused session.
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <AchievementBadge key={a.id} a={a} />
              ))}
            </div>
          </>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* session history, day by day */}
        <section className="glass h-fit rounded-2xl p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
            session history
          </h2>
          {sessions === null ? (
            <p className="mt-4 text-muted">Opening the ledger...</p>
          ) : derived && derived.groups.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No sessions yet. Pick a room, start the timer, and your first
              entry lands here the moment you end it.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {derived?.groups.map((g) => (
                <div key={g.key}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold text-ink">{g.label}</h3>
                    <span className="font-mono text-xs text-sun">
                      {fmtHours(g.totalSeconds)}
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-col">
                    {g.sessions.map((s) => (
                      <li
                        key={s.id}
                        className="relative flex items-center gap-3 border-l border-white/60 py-1.5 pl-4 text-sm"
                      >
                        <span
                          className={`absolute -left-[3px] h-[7px] w-[7px] rounded-full ${
                            s.status === "active"
                              ? "status-lamp bg-sun"
                              : s.status === "paused"
                                ? "bg-mint"
                                : "bg-line"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="w-16 shrink-0 font-mono text-xs text-muted">
                          {startTime(s.started_at)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-ink/85">
                          {roomName(s.room_id)}
                        </span>
                        {s.status !== "ended" && (
                          <span
                            className={`font-mono text-[10px] uppercase tracking-widest ${
                              s.status === "active" ? "text-sun" : "text-mint"
                            }`}
                          >
                            {s.status === "active" ? "running" : "paused"}
                          </span>
                        )}
                        <span className="shrink-0 font-mono text-xs text-ink">
                          {fmtHours(s.focus_seconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {/* leaderboard */}
          <section className="glass h-fit rounded-2xl p-6">
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
              <ol className="mt-4 flex flex-col gap-1.5">
                {board.map((entry) => {
                  const isSelf = entry.user_id === user.id;
                  // The podium: amber, then quieter slate and clay medals.
                  const medal =
                    entry.rank === 1
                      ? "bg-sun text-white"
                      : entry.rank === 2
                        ? "bg-[#7f8e97] text-white"
                        : entry.rank === 3
                          ? "bg-[#b0793f] text-white"
                          : "text-muted";
                  return (
                    <li
                      key={entry.user_id}
                      className={`flex items-center gap-3 rounded-lg px-2 py-1 text-sm ${
                        isSelf ? "bg-sun-soft" : ""
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ${medal}`}
                      >
                        {entry.rank}
                      </span>
                      <span
                        className={`flex-1 truncate ${
                          isSelf ? "font-bold text-sun" : "text-ink"
                        }`}
                      >
                        {entry.display_name}
                        {isSelf ? " (you)" : ""}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {fmtHours(entry.focus_seconds)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* the nightly rollup, when it has run */}
          {stats !== null && stats.days.length > 0 && (
            <section className="glass h-fit rounded-2xl p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                nightly tallies
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {stats.days.slice(0, 10).map((d) => {
                  const maxDay = Math.max(
                    1,
                    ...stats.days.map((x) => x.total_focus_seconds),
                  );
                  return (
                    <li
                      key={d.date}
                      className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-sm"
                    >
                      <span className="font-mono text-xs text-muted">{d.date}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-surface">
                        <span
                          className="block h-full rounded-full bg-sun"
                          style={{
                            width: `${Math.max(3, (d.total_focus_seconds / maxDay) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="text-right font-mono text-xs text-ink">
                        {fmtHours(d.total_focus_seconds)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
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
