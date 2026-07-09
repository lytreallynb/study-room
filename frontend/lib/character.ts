// Deterministic character appearance derived from user_id, so the same user
// looks the same on every client with zero coordination. Same idea as the
// backend's SHA-256 experiment bucketing, cheap FNV-1a is enough here.
//
// Each user is one of eight seaside-pastel animals; the species drives the
// ears/beak/markings drawn in components/Character.tsx.

export type Species =
  | "cat"
  | "fox"
  | "bear"
  | "penguin"
  | "rabbit"
  | "frog"
  | "seal"
  | "owl";

export interface CharacterLook {
  species: Species;
  body: string; // main fur/feather color
  bodyDark: string; // ear inners, tails, shading
  belly: string; // muzzle/belly patch
  seed: number;
}

// Muted, interior tones: presence avatars, not stickers.
const SPECIES_PALETTES: Array<{
  species: Species;
  body: string;
  bodyDark: string;
  belly: string;
}> = [
  { species: "cat", body: "#C8AE7E", bodyDark: "#A78F60", belly: "#EDE3CE" },
  { species: "fox", body: "#C98F63", bodyDark: "#A96F42", belly: "#EFE1D2" },
  { species: "bear", body: "#AE9179", bodyDark: "#8F745C", belly: "#E4D6C6" },
  { species: "penguin", body: "#657882", bodyDark: "#4D5F68", belly: "#F0EEE6" },
  { species: "rabbit", body: "#C9BCA9", bodyDark: "#A79A85", belly: "#EFE8DC" },
  { species: "frog", body: "#8FAE8C", bodyDark: "#6F8F6C", belly: "#DCE7D8" },
  { species: "seal", body: "#9FACB4", bodyDark: "#7F8E97", belly: "#E7EBED" },
  { species: "owl", body: "#B09876", bodyDark: "#8F7856", belly: "#E7DCC6" },
];

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function characterLook(userId: string): CharacterLook {
  const seed = fnv1a(userId);
  const palette = SPECIES_PALETTES[seed % SPECIES_PALETTES.length];
  return { ...palette, seed };
}
