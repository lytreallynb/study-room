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

const SPECIES_PALETTES: Array<{
  species: Species;
  body: string;
  bodyDark: string;
  belly: string;
}> = [
  { species: "cat", body: "#E8C97C", bodyDark: "#C4A254", belly: "#F7ECD2" },
  { species: "fox", body: "#F0A868", bodyDark: "#D07E3E", belly: "#FBEEDF" },
  { species: "bear", body: "#C89F7B", bodyDark: "#A57C58", belly: "#EBD9C4" },
  { species: "penguin", body: "#5F7A8A", bodyDark: "#46606E", belly: "#F2F6F7" },
  { species: "rabbit", body: "#E3D3C2", bodyDark: "#C4AE97", belly: "#F8F1E8" },
  { species: "frog", body: "#9AD1A0", bodyDark: "#6FAF78", belly: "#DFF2E0" },
  { species: "seal", body: "#B8C4CE", bodyDark: "#93A3B0", belly: "#EDF1F4" },
  { species: "owl", body: "#C9A87C", bodyDark: "#A6855C", belly: "#EFE3CD" },
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
