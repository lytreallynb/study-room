"use client";

// The room itself: a desk grid of everyone present, live over Socket.IO,
// with your session timer alongside. This page is the product.

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import Character from "../../../components/Character";
import Nav from "../../../components/Nav";
import RequireAuth from "../../../components/RequireAuth";
import SessionTimer from "../../../components/SessionTimer";
import * as api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { PresenceStatus, Room } from "../../../lib/types";
import { useRoomPresence } from "../../../lib/useRoomPresence";

function RoomView({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { members, connState, roomError, setStatus } = useRoomPresence(
    roomId,
    user?.id,
  );

  useEffect(() => {
    api
      .getRoom(roomId)
      .then(setRoom)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Room not found"),
      );
  }, [roomId]);

  const onPresenceChange = useCallback(
    (status: PresenceStatus) => setStatus(status),
    [setStatus],
  );

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <p className="text-coral">{loadError}</p>
        <Link href="/rooms" className="mt-4 inline-block text-lamp hover:underline">
          Back to the hallway
        </Link>
      </main>
    );
  }

  const focusing = members.filter((m) => m.status === "focusing").length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/rooms" className="text-sm text-ink-dim hover:text-paper">
          &larr; hallway
        </Link>
        <h1 className="font-display text-2xl font-semibold text-paper">
          {room?.name ?? "..."}
        </h1>
        <span className="font-mono text-xs text-ink-dim">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* the study hall floor */}
        <section
          className="min-h-[320px] rounded-2xl border border-night-line bg-night-raised/50 p-6"
          aria-label="People in this room"
        >
          {members.length === 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <p className="text-ink-dim">
                {connState === "live"
                  ? "The room is empty and dark."
                  : "Finding your desk..."}
              </p>
              {connState === "live" && (
                <p className="mt-1 text-sm text-ink-dim/70">
                  Start a session below and your lamp will be the first one on.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-6 sm:justify-start">
              {members.map((m) => (
                <Character
                  key={m.user_id}
                  userId={m.user_id}
                  displayName={m.display_name}
                  status={m.status}
                  isSelf={m.user_id === user?.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* your timer */}
        <div className="flex flex-col gap-4">
          <SessionTimer roomId={roomId} onPresenceChange={onPresenceChange} />
          {room && (
            <p className="px-2 text-xs text-ink-dim">
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
