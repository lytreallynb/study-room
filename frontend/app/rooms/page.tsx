"use client";

// The hallway: every room card is a little window into the room itself.
// Each room has a stable persona derived from its id (the hour in its
// window, how the desks sit, one object someone left behind), so five
// quiet rooms read as five different rooms. Occupied rooms still lead:
// they sort first and get the warm lamp wash and a live headcount.

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import Nav from "../../components/Nav";
import RequireAuth from "../../components/RequireAuth";
import { MiniEmptyDesk, RoomPropSprite, RoomVignette } from "../../components/scene";
import * as api from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { roomPersona, type Daypart, type RoomPersona } from "../../lib/persona";
import type { Room } from "../../lib/types";

/* The room's window on the card, holding its own hour of the day.
   Brightens slightly while the card is hovered. */
function RoomWindow({ daypart }: { daypart: Daypart }) {
  return (
    <div
      className="pointer-events-none absolute right-4 top-3 h-9 w-14 overflow-hidden rounded-md border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      aria-hidden="true"
    >
      <div className={`absolute inset-0 pane-${daypart}`} />
      <div className="absolute inset-x-0 top-[55%] h-px bg-white/70" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/70" />
      <div className="pane-sheen absolute inset-0" />
    </div>
  );
}

/* A glimpse through the door: the room's own furniture and light, plus
   whoever is really inside (the headcount is real, the crowd decorative). */
function RoomPreview({ room, persona }: { room: Room; persona: RoomPersona }) {
  const count = Math.min(room.occupancy ?? 0, persona.slots);
  const lampOn = count > 0;
  return (
    <div className="relative h-24 overflow-hidden rounded-t-[15px] border-b border-white/50">
      {/* the room's light: warm lamp when someone is in, its own hour when quiet */}
      <div
        className={`absolute inset-0 ${
          lampOn ? "tile-light-focus" : `tile-${persona.daypart}`
        }`}
        aria-hidden="true"
      />
      <span
        className={`absolute left-1/2 top-0 z-10 w-12 -translate-x-1/2 ${
          lampOn ? "lamp-strip anim-lampglow" : "lamp-strip-off"
        }`}
        aria-hidden="true"
      />
      {/* floor line */}
      <div
        className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#b99b7222] to-transparent"
        aria-hidden="true"
      />
      <RoomWindow daypart={persona.daypart} />
      <RoomPropSprite prop={persona.prop} />
      {/* the nook desk slides toward its window; other layouts sit centered */}
      <div
        className={`absolute inset-x-0 bottom-0 flex ${
          persona.layout === "nook" ? "justify-end pr-4" : "justify-center"
        }`}
      >
        <RoomVignette
          roomId={room.id}
          layout={persona.layout}
          count={count}
          className="h-24 w-60"
        />
      </div>
    </div>
  );
}

function OccupancyLabel({
  count,
  welcome,
}: {
  count: number;
  welcome: string;
}) {
  if (count <= 0) {
    return (
      <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
        {welcome}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className="status-lamp h-1.5 w-1.5 rounded-full bg-sun" aria-hidden="true" />
      <span className="font-mono text-[11px] text-sun">{count} inside</span>
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

  // Rooms with people in them lead the hallway; ties keep API order.
  const sorted =
    rooms === null
      ? null
      : [...rooms].sort((a, b) => (b.occupancy ?? 0) - (a.occupancy ?? 0));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
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
        className="glass mt-5 flex flex-wrap items-center gap-2 rounded-2xl p-2.5"
      >
        <input
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink placeholder:text-muted/60"
          placeholder="New room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
        <label className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2">
          <input
            className="w-10 bg-transparent text-sm text-ink outline-none"
            type="number"
            min={1}
            max={500}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            aria-label="Seats"
          />
          <span className="font-mono text-[11px] text-muted">seats</span>
        </label>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-full bg-mint px-4 py-2 text-sm font-semibold text-white enabled:hover:brightness-110 disabled:bg-mint/50"
        >
          Open a room
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      {sorted === null ? (
        <p className="mt-10 text-muted">Looking down the hallway...</p>
      ) : sorted.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-white/70 py-12 text-center text-muted">
          <MiniEmptyDesk className="h-14 w-16" />
          <p className="mt-4 text-sm">
            Every room is quiet. Open the first one and take a seat.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {sorted.map((room) => {
            const persona = roomPersona(room.id);
            const count = room.occupancy ?? 0;
            return (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="glass glass-lift group block overflow-hidden rounded-2xl"
                >
                  <RoomPreview room={room} persona={persona} />
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg leading-6 text-ink group-hover:text-mint">
                        {room.name}
                      </span>
                      <span className="block font-mono text-[11px] text-muted">
                        seats {room.capacity}
                        {room.owner_id === user?.id ? " · yours" : ""}
                        {count > persona.slots
                          ? ` · +${count - persona.slots} more inside`
                          : ""}
                      </span>
                    </span>
                    <OccupancyLabel count={count} welcome={persona.welcome} />
                  </div>
                </Link>
              </li>
            );
          })}
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
