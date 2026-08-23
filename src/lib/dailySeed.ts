// Deterministic PRNG (mulberry32) seeded from a string, so "today's" pick
// is identical for every player and stable across reloads within the day.
function hashStringToSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Today's date as YYYY-MM-DD in UTC, so the daily challenge rolls over at the same instant worldwide. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministically shuffles `items` using `seed` and returns the first `count`. */
export function seededPick<T>(items: T[], count: number, seed: string): T[] {
  const rand = mulberry32(hashStringToSeed(seed));
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
