"use client";

// Study session panel. Drives the REST session lifecycle and mirrors it into
// room presence: studying = lamp on (focusing), paused = break, ended = idle.
//
// Time shown = server-confirmed focus_seconds + the current active stretch
// measured from last_resumed_at. The server is the only authority on totals
// (anti-cheat); this is display only.

import { useCallback, useEffect, useState } from "react";

import * as api from "../lib/api";
import type { PresenceStatus, StudySession } from "../lib/types";

function elapsedSeconds(session: StudySession, now: number): number {
  let total = session.focus_seconds;
  if (session.status === "active" && session.last_resumed_at) {
    const since = (now - new Date(session.last_resumed_at).getTime()) / 1000;
    if (since > 0) total += Math.floor(since);
  }
  return total;
}

function fmt(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface Props {
  roomId: string;
  onPresenceChange: (status: PresenceStatus) => void;
}

export default function SessionTimer({ roomId, onPresenceChange }: Props) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const [openElsewhere, setOpenElsewhere] = useState(false);

  // Pick up an in-progress session after a reload (start is 409 otherwise).
  // Only adopt a session that belongs to THIS room; one running elsewhere
  // must not light our lamp here or get mutated from the wrong room.
  useEffect(() => {
    api
      .listSessions()
      .then((sessions) => {
        const open = sessions.find((s) => s.status !== "ended");
        if (open && open.room_id === roomId) {
          setSession(open);
          onPresenceChange(open.status === "active" ? "focusing" : "break");
        } else if (open) {
          setOpenElsewhere(true);
        }
      })
      .catch(() => {
        // history is non-critical; Start will surface any real problem
      })
      .finally(() => setRestored(true));
  }, [onPresenceChange, roomId]);

  // The display derives from (session, now); only the clock lives in state.
  useEffect(() => {
    if (!session || session.status !== "active") return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [session]);

  const display = session ? elapsedSeconds(session, now) : 0;

  const act = useCallback(
    async (
      fn: () => Promise<StudySession>,
      presence: PresenceStatus,
    ): Promise<void> => {
      setBusy(true);
      setError(null);
      try {
        const next = await fn();
        setSession(next);
        onPresenceChange(presence);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [onPresenceChange],
  );

  const running = session !== null && session.status !== "ended";
  const paused = session?.status === "paused";

  const btn =
    "rounded-full px-5 py-2 text-sm font-bold disabled:opacity-50 transition-colors";

  return (
    <section className="rounded-2xl border border-night-line bg-night-raised p-6">
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-dim">
        {running
          ? paused
            ? "paused, stretch your legs"
            : "lamp is on"
          : "your desk"}
      </h2>

      <p
        className={`mt-3 font-mono text-5xl tabular-nums ${
          running && !paused ? "text-lamp" : "text-paper"
        }`}
        aria-live="off"
      >
        {fmt(display)}
      </p>
      {session?.status === "ended" && (
        <p className="mt-2 text-sm text-mint">
          Logged {fmt(session.focus_seconds)} of focus. It counts.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {openElsewhere ? (
          <p className="text-sm text-ink-dim">
            You have a session running at another desk. End it there before
            starting one here.
          </p>
        ) : !running ? (
          <button
            className={`${btn} bg-lamp text-night hover:brightness-110`}
            disabled={busy || !restored}
            onClick={() =>
              act(() => api.startSession(roomId), "focusing")
            }
          >
            Start studying
          </button>
        ) : (
          <>
            {paused ? (
              <button
                className={`${btn} bg-lamp text-night hover:brightness-110`}
                disabled={busy}
                onClick={() =>
                  act(() => api.resumeSession(session.id), "focusing")
                }
              >
                Back to it
              </button>
            ) : (
              <button
                className={`${btn} bg-mint text-night hover:brightness-110`}
                disabled={busy}
                onClick={() =>
                  act(() => api.pauseSession(session.id), "break")
                }
              >
                Take a break
              </button>
            )}
            <button
              className={`${btn} border border-night-line text-paper hover:border-ink-dim`}
              disabled={busy}
              onClick={() => act(() => api.endSession(session.id), "idle")}
            >
              End session
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-coral">{error}</p>}

      <p className="mt-4 text-xs leading-relaxed text-ink-dim">
        Focus time is measured by the server, not your browser. Pausing dims
        your lamp for everyone in the room.
      </p>
    </section>
  );
}
