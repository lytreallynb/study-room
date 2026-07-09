# StudySync frontend

Next.js 16 (App Router, strict TypeScript, Tailwind v4) client for the
StudySync backend: a late-night study hall where every member of a room is a
character at a desk, live over Socket.IO.

## Pages

| Route         | What it does |
|---------------|--------------|
| `/`           | Landing with three demo desks (focusing / break / idle) |
| `/login` `/register` | JWT auth against the FastAPI backend |
| `/rooms`      | Room directory + create room |
| `/rooms/[id]` | The live room: presence grid + session timer |
| `/stats`      | My totals, last 30 nights, hall leaderboard |

## How the room works

- `lib/useRoomPresence.ts` opens a Socket.IO connection with the JWT,
  emits `join_room`, and reconciles `room_snapshot` (full state on join and
  reconnect) with `presence_update` deltas (join / status / leave). A 20s
  heartbeat keeps the member under the server's 45s staleness TTL.
- `components/SessionTimer.tsx` drives the REST session lifecycle
  (start / pause / resume / end) and mirrors it into presence: studying turns
  your lamp on, pausing switches you to break, ending sets you idle. Focus
  totals are server-computed (anti-cheat); the client only renders
  `focus_seconds` plus the active stretch since `last_resumed_at`.
- `components/Character.tsx` renders a member as an SVG creature at a desk.
  Appearance is derived deterministically from `user_id`
  (`lib/character.ts`), so every client draws the same character with no
  coordination.

## Run

```bash
npm install
npm run dev    # expects API on :8010 and realtime on :8001
```

Configuration (see `.env.example`): `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_REALTIME_URL`. Deploys to Vercel with root directory
`frontend/`.
