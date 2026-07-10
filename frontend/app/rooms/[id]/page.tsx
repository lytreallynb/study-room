"use client";

// The room itself: a study hall seen from inside. Everyone present sits at
// a desk doing their own thing (reading, coding, gaming, writing), live
// over Socket.IO; people who arrive while you watch walk in through the
// door. Your session timer runs alongside. This page is the product.

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import Character from "../../../components/Character";
import Nav from "../../../components/Nav";
import RequireAuth from "../../../components/RequireAuth";
import SessionTimer from "../../../components/SessionTimer";
import WordPractice from "../../../components/WordPractice";
import * as api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { PresenceStatus, Room } from "../../../lib/types";
import { useRoomPresence } from "../../../lib/useRoomPresence";

/* A quiet wall clock keeping real time; hands move, nothing ticks loudly. */
function WallClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const minuteDeg = now.getMinutes() * 6;
  const hourDeg = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
      <circle cx="20" cy="20" r="16.5" fill="#ffffff99" stroke="#b99b72" strokeWidth="2.5" />
      <g stroke="#8f745c" strokeWidth="1.4" strokeLinecap="round">
        <line x1="20" y1="6.5" x2="20" y2="9" />
        <line x1="33.5" y1="20" x2="31" y2="20" />
        <line x1="20" y1="33.5" x2="20" y2="31" />
        <line x1="6.5" y1="20" x2="9" y2="20" />
      </g>
      <line
        x1="20"
        y1="20"
        x2="20"
        y2="13"
        stroke="#3e6472"
        strokeWidth="2.2"
        strokeLinecap="round"
        transform={`rotate(${hourDeg} 20 20)`}
      />
      <line
        x1="20"
        y1="20"
        x2="20"
        y2="10"
        stroke="#3e6472"
        strokeWidth="1.4"
        strokeLinecap="round"
        transform={`rotate(${minuteDeg} 20 20)`}
      />
      <circle cx="20" cy="20" r="1.6" fill="#3e6472" />
    </svg>
  );
}

/* A potted plant in the corner, leaning toward the window light. */
function CornerPlant() {
  return (
    <svg viewBox="0 0 60 84" className="h-20 w-14" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        <path d="M30 58 Q28 40 16 30" stroke="#6f8f6c" strokeWidth="2" />
        <path d="M30 58 Q32 36 30 22" stroke="#8fae8c" strokeWidth="2" />
        <path d="M30 58 Q34 42 45 33" stroke="#7f9f7c" strokeWidth="2" />
      </g>
      <ellipse cx="15" cy="27" rx="6" ry="9" transform="rotate(-38 15 27)" fill="#8fae8c" />
      <ellipse cx="30" cy="18" rx="6" ry="10" fill="#9fbe9c" />
      <ellipse cx="46" cy="30" rx="6" ry="9" transform="rotate(36 46 30)" fill="#7f9f7c" />
      <ellipse cx="22" cy="40" rx="5" ry="7" transform="rotate(-24 22 40)" fill="#7f9f7c" />
      <ellipse cx="39" cy="43" rx="5" ry="7" transform="rotate(22 39 43)" fill="#8fae8c" />
      <path d="M18 58 h24 l-3 24 h-18 Z" fill="#b0793f" />
      <rect x="16" y="56" width="28" height="5" rx="2" fill="#c98a55" />
    </svg>
  );
}

/* The door people walk in through, on the left wall. */
function Door() {
  return (
    <svg
      viewBox="0 0 44 96"
      className="h-24 w-11 shrink-0"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="34" height="90" rx="3" fill="#00000010" />
      <rect x="9" y="7" width="28" height="87" rx="2" fill="#c9a87c" opacity="0.75" />
      <rect x="12" y="12" width="22" height="34" rx="2" fill="#ffffff66" />
      <circle cx="31" cy="58" r="2" fill="#8f745c" />
    </svg>
  );
}

function RoomView({ roomId }: { roomId: string }) {
  const { user, refreshUser } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [myStatus, setMyStatus] = useState<PresenceStatus>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const { members, connState, roomError, setStatus } = useRoomPresence(
    roomId,
    user?.id,
  );

  // Anyone whose join is newer than our arrival walks in; the initial
  // snapshot crowd is already seated.
  const [mountedAt] = useState(() => Date.now() / 1000);

  useEffect(() => {
    api
      .getRoom(roomId)
      .then(setRoom)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Room not found"),
      );
  }, [roomId]);

  const onPresenceChange = useCallback(
    (status: PresenceStatus) => {
      setStatus(status);
      setMyStatus(status);
    },
    [setStatus],
  );

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <p className="text-coral">{loadError}</p>
        <Link href="/rooms" className="mt-4 inline-block text-sun hover:underline">
          Back to the hallway
        </Link>
      </main>
    );
  }

  const focusing = members.filter((m) => m.status === "focusing").length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/rooms" className="text-sm text-muted hover:text-ink">
          &larr; hallway
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {room?.name ?? "..."}
        </h1>
        <span className="font-mono text-xs text-muted">
          {connState === "live" ? (
            <>
              <span className="text-mint">●</span> {members.length} at their
              desks{focusing > 0 ? `, ${focusing} focusing` : ""}
            </>
          ) : connState === "connecting" ? (
            "connecting..."
          ) : (
            <span className="text-coral">connection lost, retrying</span>
          )}
        </span>
      </div>

      {roomError && <p className="mt-3 text-sm text-coral">{roomError}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* the room: window on the sea, a door, desks on the floor */}
        <section
          className="glass relative flex flex-col overflow-hidden rounded-3xl lg:self-start"
          aria-label="People in this room"
        >
          {/* the room's own lamp over the seats */}
          <div
            className={`absolute left-1/2 top-0 z-10 w-16 -translate-x-1/2 ${
              focusing > 0 ? "lamp-strip anim-lampglow" : "lamp-strip-dim"
            }`}
            aria-hidden="true"
          />
          {/* the window: a clearer pane with the sea and horizon in it */}
          <div
            className="pointer-events-none absolute inset-x-6 top-5 h-16 overflow-hidden rounded-xl border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:inset-x-10"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#dcecf2cc] via-[#bcd7e0b8] via-55% to-[#8fb3c2b8]" />
            <div className="absolute inset-x-0 top-[52%] h-px bg-white/70" />
            <div className="absolute left-[18%] top-[68%] h-1 w-8 rounded-full bg-white/40 blur-[1px]" />
            <div className="absolute right-[22%] top-[80%] h-1 w-10 rounded-full bg-white/30 blur-[1px]" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
          </div>
          {/* the floor the desks stand on, with a baseboard where it meets the wall */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#b99b7226] to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[40%] h-px bg-[#b99b7240]"
            aria-hidden="true"
          />
          {/* the clock on the wall, keeping the room's real time */}
          <div
            className="pointer-events-none absolute right-7 top-24 hidden sm:block"
            aria-hidden="true"
          >
            <WallClock />
          </div>
          {/* a plant in the corner by the window */}
          <div
            className="pointer-events-none absolute bottom-3 right-3"
            aria-hidden="true"
          >
            <CornerPlant />
          </div>

          <div className="relative flex min-h-[300px] flex-1 items-end px-3 pb-6 pt-24 sm:px-5">
            {/* the door, always on the left wall */}
            <div className="mb-1 hidden sm:block" aria-hidden="true">
              <Door />
            </div>

            {members.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center pb-10 text-center">
                <p className="text-muted">
                  {connState === "live"
                    ? "The room is empty and dark."
                    : "Finding your desk..."}
                </p>
                {connState === "live" && (
                  <p className="mt-1 text-sm text-muted/70">
                    Start a session below and your lamp will be the first one on.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-wrap items-end justify-center gap-x-2 gap-y-6 sm:gap-x-5">
                {members.map((m) => (
                  <Character
                    key={m.user_id}
                    userId={m.user_id}
                    displayName={m.display_name}
                    status={m.status}
                    isSelf={m.user_id === user?.id}
                    entering={m.joined_at > mountedAt}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* your timer + word practice while the session runs */}
        <div className="flex flex-col gap-4">
          <SessionTimer roomId={roomId} onPresenceChange={onPresenceChange} />
          {myStatus !== "idle" && (
            <WordPractice onReward={() => void refreshUser()} />
          )}
          {room && (
            <p className="px-2 text-xs text-muted">
              Room seats {room.capacity}. Lamps switch off automatically if
              someone loses connection for 45 seconds.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <RequireAuth>
        <RoomView roomId={id} />
      </RequireAuth>
    </div>
  );
}
