/** Tiny deterministic PRNG so the generated demo catalogue is stable between reloads. */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** rng('teacher:yoruba:3') -> a seeded generator plus a few conveniences. */
export function rng(seedString) {
  const next = mulberry32(hashString(seedString));
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max, dp = 2) => Number((min + next() * (max - min)).toFixed(dp)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    sample: (arr, n) => {
      const pool = [...arr];
      const out = [];
      while (out.length < Math.min(n, arr.length)) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      }
      return out;
    },
    chance: (p) => next() < p,
  };
}
