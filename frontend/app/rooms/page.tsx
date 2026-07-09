"use client";

// The hallway: every room is a door. Occupied rooms show warm lamp dots;
// quiet rooms say so. One inline counter opens a new room.

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import { EmptyDesk } from "../../components/art";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Room } from "../../lib/types";

function OccupancyLamps({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="font-mono text-xs text-muted">quiet</span>;
  }
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-sun" />
        ))}
      </span>
      <span className="font-mono text-xs text-sun">{count} inside</span>
    </span>
  );
}

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
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load rooms"),
      );
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl font-medium text-ink">
          Pick a room
        </h1>
        <p className="text-sm text-muted">
          Walk in quietly. Someone is probably mid-pomodoro.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="glass mt-6 flex flex-wrap items-center gap-2 rounded-xl p-2.5"
      >
        <input
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60"
          placeholder="New room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
        <input
          className="w-20 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
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
          className="rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Open a room
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      {rooms === null ? (
        <p className="mt-10 text-muted">Looking down the hallway...</p>
      ) : rooms.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-line py-12 text-center text-muted">
          <EmptyDesk />
          <p className="mt-4 text-sm">
            Every room is quiet. Open the first one and take a seat.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-2.5">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="glass group flex items-center gap-4 rounded-xl border border-transparent px-4 py-3.5 transition-colors hover:border-mint/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/85 font-mono text-xs tracking-wider text-paper">
                  {room.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg text-ink group-hover:text-mint">
                    {room.name}
                  </span>
                  <span className="block text-xs text-muted">
                    seats {room.capacity}
                    {room.owner_id === user?.id ? " · your room" : ""}
                  </span>
                </span>
                <OccupancyLamps count={room.occupancy ?? 0} />
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
