// Deterministic character appearance derived from user_id, so the same user
// looks the same on every client with zero coordination. Same idea as the
// backend's SHA-256 experiment bucketing, cheap FNV-1a is enough here.

export interface CharacterLook {
  body: string;
  bodyDark: string;
  blush: string;
  seed: number;
}

const BODY_COLORS: Array<[string, string]> = [
  ["#E8A87C", "#C97F55"], // peach
  ["#9AD1B0", "#6FAF8B"], // sage
  ["#A5B8E8", "#7D93CB"], // periwinkle
  ["#E8C97C", "#C4A254"], // honey
  ["#D9A5C9", "#B57DA4"], // mauve
  ["#8FCBD9", "#65A5B5"], // sky
  ["#C9B8E8", "#A28FCB"], // lilac
  ["#E89C9C", "#C47474"], // coral
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
  const [body, bodyDark] = BODY_COLORS[seed % BODY_COLORS.length];
  return { body, bodyDark, blush: "#00000022", seed };
}
