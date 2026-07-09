"use client";

// The room itself: a desk grid of everyone present, live over Socket.IO,
// with your session timer alongside. This page is the product.

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import Character from "../../../components/Character";
import { EmptyDesk, WindowPane } from "../../../components/art";
import Nav from "../../../components/Nav";
import RequireAuth from "../../../components/RequireAuth";
import SessionTimer from "../../../components/SessionTimer";
import WordPractice from "../../../components/WordPractice";
import * as api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { PresenceStatus, Room } from "../../../lib/types";
import { useRoomPresence } from "../../../lib/useRoomPresence";

function RoomView({ roomId }: { roomId: string }) {
  const { user, refreshUser } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [myStatus, setMyStatus] = useState<PresenceStatus>("idle");
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
        {/* the room: dawn window up top, desks on the floor below */}
        <section
          className="glass flex flex-col overflow-hidden rounded-2xl"
          aria-label="People in this room"
        >
          <WindowPane className="h-24 sm:h-28" />
          <div className="well min-h-[280px] flex-1 px-5 py-6">
          {members.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
              <EmptyDesk />
              <p className="mt-4 text-muted">
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
