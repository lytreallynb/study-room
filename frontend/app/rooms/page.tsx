"use client";

// Room directory: every room is a door you can walk through.

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import Nav from "../../components/Nav";
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
          <h1 className="font-display text-3xl font-semibold text-paper">
            Pick a room
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Walk in quietly. Someone is probably mid-pomodoro.
          </p>
        </div>

        <form onSubmit={onCreate} className="flex items-center gap-2">
          <input
            className="w-44 rounded-lg border border-night-line bg-night-raised px-3 py-2 text-sm text-paper placeholder:text-ink-dim/60"
            placeholder="New room name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
          <input
            className="w-20 rounded-lg border border-night-line bg-night-raised px-3 py-2 text-sm text-paper"
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
            className="rounded-lg bg-lamp px-4 py-2 text-sm font-bold text-night hover:brightness-110 disabled:opacity-50"
          >
            Open a room
          </button>
        </form>
      </div>

      {error && <p className="mt-6 text-sm text-coral">{error}</p>}

      {rooms === null ? (
        <p className="mt-10 text-ink-dim">Looking down the hallway...</p>
      ) : rooms.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-night-line p-10 text-center text-ink-dim">
          Every room is dark. Open the first one and turn a lamp on.
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-night-line bg-night-raised p-5 transition-colors hover:border-lamp/60"
              >
                {/* door plate */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-night font-mono text-sm text-lamp">
                  {room.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-lg text-paper group-hover:text-lamp">
                    {room.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-dim">
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
