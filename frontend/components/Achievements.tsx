// Personal achievements, every one derived from real session and account
// data. Nothing here is invented: if a badge is lit, the sessions on the
// server say so. Locked badges show honest progress toward the rule.

import type { StudySession, User } from "../lib/types";

export interface AchievementState {
  id: string;
  name: string;
  desc: string;
  done: boolean;
  /* Honest progress toward the rule, e.g. "42m / 60m". Null when the rule
     is a single event rather than an accumulation. */
  progress: string | null;
  icon: React.ReactNode;
}

/* --- facts derived from the raw session list --- */

interface Facts {
  focusedSessions: number;
  totalFocusSeconds: number;
  longestSessionSeconds: number;
  streakDays: number;
  hasEarlyStart: boolean;
  hasLateStart: boolean;
}

function localDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

export function computeStreakDays(sessions: StudySession[]): number {
  const days = new Set(
    sessions.filter((s) => s.focus_seconds > 0).map((s) => localDateKey(s.started_at)),
  );
  if (days.size === 0) return 0;
  // Count back from today; a streak that ends yesterday still counts.
  const cursor = new Date();
  if (!days.has(cursor.toLocaleDateString("en-CA"))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(cursor.toLocaleDateString("en-CA"))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function deriveFacts(sessions: StudySession[]): Facts {
  let total = 0;
  let longest = 0;
  let focused = 0;
  let early = false;
  let late = false;
  for (const s of sessions) {
    total += s.focus_seconds;
    if (s.focus_seconds > longest) longest = s.focus_seconds;
    if (s.focus_seconds > 0) {
      focused += 1;
      const hour = new Date(s.started_at).getHours();
      if (hour < 8) early = true;
      if (hour >= 22) late = true;
    }
  }
  return {
    focusedSessions: focused,
    totalFocusSeconds: total,
    longestSessionSeconds: longest,
    streakDays: computeStreakDays(sessions),
    hasEarlyStart: early,
    hasLateStart: late,
  };
}

/* --- badge glyphs: small line drawings, stroke follows text color --- */

const G = "none";
const SW = 1.7;

function glyph(children: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={G}
      stroke="currentColor"
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  lamp: glyph(
    <>
      <path d="M6 20h9M10.5 20v-8L15 8.5" />
      <circle cx="15.5" cy="7.5" r="2.4" fill="currentColor" stroke="none" />
    </>,
  ),
  clock: glyph(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
  ),
  books: glyph(
    <>
      <path d="M5 19.5h14M6.5 19.5v-4.5h8v4.5M8 15v-4.5h8V15M9.5 10.5V6h6v4.5" />
    </>,
  ),
  wave: glyph(
    <>
      <path d="M3 14c2.5-4 5-4 7 0s4.5 4 7 0" />
      <path d="M3 18.5c2.5-3 5-3 7 0s4.5 3 7 0" opacity="0.5" />
    </>,
  ),
  spark: glyph(
    <>
      <circle cx="6" cy="16" r="2" />
      <circle cx="12" cy="10" r="2" />
      <circle cx="18" cy="14" r="2" />
      <path d="M7.6 14.6l2.8-3M13.7 11l2.7 1.8" />
    </>,
  ),
  calendar: glyph(
    <>
      <rect x="4.5" y="6" width="15" height="13" rx="2" />
      <path d="M4.5 10h15M8.5 4v3.5M15.5 4v3.5M9 14.5l2 2 4-4" />
    </>,
  ),
  sunrise: glyph(
    <>
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M3 20h18M12 5v2.5M5.5 8.5l1.8 1.8M18.5 8.5l-1.8 1.8" />
    </>,
  ),
  moon: glyph(<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5Z" />),
  diamond: glyph(
    <rect x="7.5" y="7.5" width="9" height="9" transform="rotate(45 12 12)" />,
  ),
  coin: glyph(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </>,
  ),
};

function fmtShort(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

/* All badges, evaluated against real data. Order: easy to legendary. */
export function computeAchievements(
  sessions: StudySession[],
  user: User,
): AchievementState[] {
  const f = deriveFacts(sessions);
  const cap = (v: number, max: number) => Math.min(v, max);

  return [
    {
      id: "first-light",
      name: "First Light",
      desc: "Finish one focused session",
      done: f.focusedSessions >= 1,
      progress: null,
      icon: ICONS.lamp,
    },
    {
      id: "hour-one",
      name: "The First Hour",
      desc: "Log one hour of focus in total",
      done: f.totalFocusSeconds >= 3600,
      progress: `${fmtShort(cap(f.totalFocusSeconds, 3600))} / 1h`,
      icon: ICONS.clock,
    },
    {
      id: "marathon",
      name: "Deep Water",
      desc: "Focus two hours in one sitting",
      done: f.longestSessionSeconds >= 7200,
      progress: `${fmtShort(cap(f.longestSessionSeconds, 7200))} / 2h`,
      icon: ICONS.wave,
    },
    {
      id: "ten-hours",
      name: "Ten Hours In",
      desc: "Log ten hours of focus in total",
      done: f.totalFocusSeconds >= 36000,
      progress: `${fmtShort(cap(f.totalFocusSeconds, 36000))} / 10h`,
      icon: ICONS.books,
    },
    {
      id: "streak-3",
      name: "Three Tides",
      desc: "Study three days in a row",
      done: f.streakDays >= 3,
      progress: `${cap(f.streakDays, 3)} / 3 days`,
      icon: ICONS.spark,
    },
    {
      id: "streak-7",
      name: "Week of Waves",
      desc: "Study seven days in a row",
      done: f.streakDays >= 7,
      progress: `${cap(f.streakDays, 7)} / 7 days`,
      icon: ICONS.calendar,
    },
    {
      id: "early-tide",
      name: "Early Tide",
      desc: "Start a session before 8 am",
      done: f.hasEarlyStart,
      progress: null,
      icon: ICONS.sunrise,
    },
    {
      id: "night-watch",
      name: "Night Watch",
      desc: "Start a session after 10 pm",
      done: f.hasLateStart,
      progress: null,
      icon: ICONS.moon,
    },
    {
      id: "regular",
      name: "The Regular",
      desc: "Reach level 5",
      done: user.level >= 5,
      progress: `lv ${cap(user.level, 5)} / 5`,
      icon: ICONS.diamond,
    },
    {
      id: "hundred-coins",
      name: "Hundred Coins",
      desc: "Hold one hundred coins",
      done: user.coins >= 100,
      progress: `${cap(user.coins, 100)} / 100`,
      icon: ICONS.coin,
    },
  ];
}

/* One badge: a lit medallion when earned, waiting in the haze when not. */
export function AchievementBadge({ a }: { a: AchievementState }) {
  return (
    <div
      className={`glass flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
        a.done ? "" : "opacity-60 grayscale"
      }`}
      title={a.desc}
    >
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
          a.done
            ? "medal-gloss border-sun/60 bg-sun-soft text-sun"
            : "border-dashed border-line bg-white/30 text-muted"
        }`}
      >
        {a.icon}
        {a.done && (
          <span
            className="lamp-strip absolute -top-px left-1/2 w-5 -translate-x-1/2"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate text-[13px] font-semibold ${
            a.done ? "text-ink" : "text-muted"
          }`}
        >
          {a.name}
        </span>
        <span className="block truncate text-xs text-muted">{a.desc}</span>
        <span className="block font-mono text-[10px] text-muted/80">
          {a.done ? "unlocked" : (a.progress ?? "locked")}
        </span>
      </span>
    </div>
  );
}
