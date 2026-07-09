"use client";

// Room directory: every room is a door you can walk through.

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import Nav from "../../components/Nav";
import { EmptyBeach } from "../../components/art";
import RequireAuth from "../../components/RequireAuth";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Room } from "../../lib/types";

function RoomsList() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .listRooms()
      .then(setRooms)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load rooms"));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const room = await api.createRoom(name.trim(), capacity, true);
      setRooms((r) => [room, ...(r ?? [])]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Pick a room
          </h1>
          <p className="mt-1 text-sm text-muted">
            Walk in quietly. Someone is probably mid-pomodoro.
          </p>
        </div>

        <form onSubmit={onCreate} className="flex items-center gap-2">
          <input
            className="w-44 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink placeholder:text-muted/60"
            placeholder="New room name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
          <input
            className="w-20 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink"
            type="number"
            min={1}
            max={500}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            aria-label="Capacity"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="rounded-lg bg-sun px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
          >
            Open a room
          </button>
        </form>
      </div>

      {error && <p className="mt-6 text-sm text-coral">{error}</p>}

      {rooms === null ? (
        <p className="mt-10 text-muted">Looking down the hallway...</p>
      ) : rooms.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-line p-10 text-center text-muted">
          <EmptyBeach />
          <p className="mt-4">Every room is quiet. Open the first one and take a seat.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="group flex flex-col gap-3 glass rounded-3xl p-5 transition-colors hover:border-sun/60"
              >
                {/* door plate */}
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 font-mono text-sm text-sun">
                    {room.name.slice(0, 2).toUpperCase()}
                  </div>
                  {(room.occupancy ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 font-mono text-xs text-sun">
                      <span className="h-1.5 w-1.5 rounded-full bg-sun" />
                      {room.occupancy} inside
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg text-ink group-hover:text-sun">
                    {room.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    seats {room.capacity}
                    {room.owner_id === user?.id ? " · your room" : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function RoomsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <RequireAuth>
        <RoomsList />
      </RequireAuth>
    </div>
  );
}
