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

/* Desk lamps seen through the door glass: one per person inside. */
function DoorGlass({ count }: { count: number }) {
  const lamps = Math.min(count, 6);
  const positions = [
    { left: "22%", top: "58%" },
    { left: "58%", top: "64%" },
    { left: "40%", top: "44%" },
    { left: "74%", top: "48%" },
    { left: "28%", top: "34%" },
    { left: "64%", top: "30%" },
  ];
  return (
    <div className="door-glass relative h-24 overflow-hidden rounded-t-lg border border-ink/10" aria-hidden="true">
      {/* the room is lit in proportion to how many are inside */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: count > 0 ? 0.25 + Math.min(count, 5) * 0.1 : 0,
          background:
            "radial-gradient(ellipse 80% 70% at 50% 80%, rgba(245,196,120,0.7), rgba(245,196,120,0) 75%)",
        }}
      />
      {Array.from({ length: lamps }, (_, i) => (
        <span
          key={i}
          className="status-lamp absolute h-1.5 w-1.5 rounded-full bg-sun shadow-[0_0_6px_2px_rgba(245,196,120,0.55)]"
          style={{ ...positions[i], animationDelay: `${i * 0.9}s` }}
        />
      ))}
      {/* muntin */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-ink/10" />
      {count === 0 && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-ink/40">
          quiet
        </span>
      )}
    </div>
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
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="group block rounded-lg"
              >
                {/* small screens: a tappable row with a sliver of door glass */}
                <span className="glass flex items-center gap-3 rounded-lg px-3 py-2.5 sm:hidden">
                  <span className="door-glass relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-ink/10" aria-hidden="true">
                    {(room.occupancy ?? 0) > 0 && (
                      <span
                        className="status-lamp absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sun shadow-[0_0_8px_3px_rgba(245,196,120,0.6)]"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base text-ink">
                      {room.name}
                    </span>
                    <span className="block font-mono text-[11px] text-muted">
                      seats {room.capacity}
                      {room.owner_id === user?.id ? " · yours" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {(room.occupancy ?? 0) > 0
                      ? `${room.occupancy} inside`
                      : "quiet"}
                  </span>
                </span>
                {/* larger screens: the full door */}
                <span className="hidden sm:block">
                {/* the door: glass above, wood below, plate and handle */}
                <div className="overflow-hidden rounded-lg shadow-[0_10px_24px_-12px_rgba(43,58,62,0.35)] transition-shadow group-hover:shadow-[0_12px_28px_-10px_rgba(184,130,59,0.35)]">
                  <DoorGlass count={room.occupancy ?? 0} />
                  <div className="door-wood relative h-20 border border-t-0 border-ink/10">
                    {/* name plate */}
                    <span className="absolute left-1/2 top-3 w-[80%] -translate-x-1/2 truncate rounded-sm border border-ink/15 bg-surface px-2 py-1 text-center font-display text-sm text-ink transition-colors group-hover:border-sun/60">
                      {room.name}
                    </span>
                    {/* handle */}
                    <span className="absolute right-2.5 top-12 h-3.5 w-1.5 rounded-full bg-ink/45" />
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-ink/50">
                      seats {room.capacity}
                      {room.owner_id === user?.id ? " · yours" : ""}
                    </span>
                  </div>
                </div>
                <span className="mt-1.5 block text-center font-mono text-[11px] text-muted">
                  {(room.occupancy ?? 0) > 0
                    ? `${room.occupancy} inside`
                    : "\u00A0"}
                </span>
                </span>
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
