// Every room on the hallway page gets a small, stable personality derived
// from its id: the hour its window seems to hold, how its desks are
// arranged, and one object someone left behind. Same idea as character
// looks in character.ts: deterministic, zero coordination, so the hallway
// looks the same to everyone on every visit.

import { fnv1a } from "./character";

/* The light in the room's window: coordinates with the seascape outside. */
export type Daypart = "dawn" | "noon" | "dusk";

/* How the furniture sits. slots is how many preview seats the layout has;
   headcount beyond that is told in text ("+N more inside"). */
export type RoomLayout = "hall" | "pairs" | "nook";

/* The one thing that makes the room feel lived in while empty. */
export type RoomProp = "plant" | "shelf" | "lamp" | "art";

export interface RoomPersona {
  daypart: Daypart;
  layout: RoomLayout;
  slots: number;
  prop: RoomProp;
  welcome: string;
}

const DAYPARTS: Daypart[] = ["dawn", "noon", "dusk"];
const LAYOUTS: Array<{ layout: RoomLayout; slots: number }> = [
  { layout: "hall", slots: 4 },
  { layout: "pairs", slots: 4 },
  { layout: "nook", slots: 2 },
];
const PROPS: RoomProp[] = ["plant", "shelf", "lamp", "art"];

/* Quiet room captions: an invitation, not a vacancy notice. */
const WELCOMES = [
  "take any seat",
  "be the first one in",
  "quiet, door is open",
  "no one here yet",
];

export function roomPersona(roomId: string): RoomPersona {
  // One salted hash per dimension: bit-shifting a single seed left the
  // dimensions correlated and a hallway could come out with three rooms
  // in a row sharing a layout. Independent seeds spread the personas.
  const { layout, slots } =
    LAYOUTS[fnv1a(`seating:${roomId}`) % LAYOUTS.length];
  return {
    daypart: DAYPARTS[fnv1a(`daypart:${roomId}`) % DAYPARTS.length],
    layout,
    slots,
    prop: PROPS[fnv1a(`object:${roomId}`) % PROPS.length],
    welcome: WELCOMES[fnv1a(`welcome:${roomId}`) % WELCOMES.length],
  };
}
