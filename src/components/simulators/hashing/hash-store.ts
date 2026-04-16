import { create } from "zustand";

export type HashFn = "mod" | "mult" | "mid-square";
export type CollisionMethod = "chaining" | "linear-probing" | "double-hashing";

export type BucketSlot = {
  key: number;
  probeSteps?: number;
};

export type Bucket = {
  id: number;
  slots: BucketSlot[];
  overflow: BucketSlot[];
};

export type HashEvent = {
  key: number;
  homeBucket: number;
  finalBucket: number;
  probes: number;
  collided: boolean;
  overflowed: boolean;
  note: string;
};

type HashState = {
  bucketCount: number;
  slotsPerBucket: number;
  hashFn: HashFn;
  collision: CollisionMethod;
  buckets: Bucket[];
  events: HashEvent[];
  highlightBucket: number | null;
  highlightKey: number | null;

  setBucketCount: (n: number) => void;
  setSlotsPerBucket: (n: number) => void;
  setHashFn: (fn: HashFn) => void;
  setCollision: (m: CollisionMethod) => void;

  insert: (key: number) => void;
  lookup: (key: number) => void;
  remove: (key: number) => void;
  reset: () => void;
  seed: (keys: number[]) => void;
};

function emptyBuckets(n: number): Bucket[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, slots: [], overflow: [] }));
}

export function hashValue(key: number, fn: HashFn, m: number): number {
  if (m <= 0) return 0;
  switch (fn) {
    case "mod":
      return ((key % m) + m) % m;
    case "mult": {
      const A = 0.6180339887;
      const frac = (key * A) % 1;
      return Math.floor(m * frac);
    }
    case "mid-square": {
      const sq = key * key;
      const s = String(sq);
      const mid = Math.max(0, Math.floor(s.length / 2) - 1);
      const slice = s.slice(mid, mid + 2) || s;
      return parseInt(slice, 10) % m;
    }
  }
}

function hash2(key: number, m: number): number {
  const r = Math.max(3, m - 1);
  return 1 + (Math.abs(key) % r);
}

export const useHash = create<HashState>((set, get) => ({
  bucketCount: 8,
  slotsPerBucket: 2,
  hashFn: "mod",
  collision: "chaining",
  buckets: emptyBuckets(8),
  events: [],
  highlightBucket: null,
  highlightKey: null,

  setBucketCount: (n) => {
    const bc = Math.max(2, Math.min(32, n));
    set({ bucketCount: bc, buckets: emptyBuckets(bc), events: [], highlightBucket: null, highlightKey: null });
  },
  setSlotsPerBucket: (n) => {
    const s = Math.max(1, Math.min(4, n));
    set({ slotsPerBucket: s, buckets: emptyBuckets(get().bucketCount), events: [], highlightBucket: null, highlightKey: null });
  },
  setHashFn: (fn) =>
    set({ hashFn: fn, buckets: emptyBuckets(get().bucketCount), events: [], highlightBucket: null, highlightKey: null }),
  setCollision: (m) =>
    set({ collision: m, buckets: emptyBuckets(get().bucketCount), events: [], highlightBucket: null, highlightKey: null }),

  insert: (key) => {
    const { bucketCount, slotsPerBucket, hashFn, collision, buckets, events } = get();
    const home = hashValue(key, hashFn, bucketCount);
    const next = buckets.map((b) => ({ ...b, slots: [...b.slots], overflow: [...b.overflow] }));
    let finalBucket = home;
    let probes = 1;
    let collided = false;
    let overflowed = false;
    let note = "";

    const exists = next.some(
      (b) => b.slots.some((s) => s.key === key) || b.overflow.some((s) => s.key === key)
    );
    if (exists) {
      set({
        events: [
          ...events,
          { key, homeBucket: home, finalBucket: home, probes: 1, collided: false, overflowed: false, note: `Key ${key} already present` },
        ],
        highlightBucket: home,
        highlightKey: key,
      });
      return;
    }

    if (collision === "chaining") {
      const b = next[home];
      if (b.slots.length < slotsPerBucket) {
        b.slots.push({ key });
        note = `h(${key}) = ${home} → slot free`;
      } else {
        b.overflow.push({ key });
        collided = true;
        overflowed = true;
        note = `h(${key}) = ${home} full → overflow chain (len ${b.overflow.length})`;
      }
    } else if (collision === "linear-probing") {
      let i = home;
      for (let step = 0; step < bucketCount; step++) {
        const b = next[i];
        if (b.slots.length < slotsPerBucket) {
          b.slots.push({ key, probeSteps: step });
          finalBucket = i;
          probes = step + 1;
          if (step > 0) {
            collided = true;
            note = `h(${key}) = ${home}, probed ${step} step${step > 1 ? "s" : ""} → bucket ${i}`;
          } else {
            note = `h(${key}) = ${home} → slot free`;
          }
          break;
        }
        i = (i + 1) % bucketCount;
        if (i === home) {
          overflowed = true;
          note = `Table full — key ${key} dropped`;
          break;
        }
      }
    } else {
      const step = hash2(key, bucketCount);
      let i = home;
      for (let s = 0; s < bucketCount; s++) {
        const b = next[i];
        if (b.slots.length < slotsPerBucket) {
          b.slots.push({ key, probeSteps: s });
          finalBucket = i;
          probes = s + 1;
          if (s > 0) {
            collided = true;
            note = `h₁=${home}, h₂=${step}, probed ${s} → bucket ${i}`;
          } else {
            note = `h(${key}) = ${home} → slot free`;
          }
          break;
        }
        i = (i + step) % bucketCount;
        if (s === bucketCount - 1) {
          overflowed = true;
          note = `Probe sequence exhausted — key ${key} dropped`;
        }
      }
    }

    set({
      buckets: next,
      events: [...events, { key, homeBucket: home, finalBucket, probes, collided, overflowed, note }],
      highlightBucket: finalBucket,
      highlightKey: key,
    });
  },

  lookup: (key) => {
    const { bucketCount, hashFn, collision, buckets, events } = get();
    const home = hashValue(key, hashFn, bucketCount);
    let finalBucket = home;
    let probes = 0;
    let found = false;

    if (collision === "chaining") {
      probes = 1;
      const b = buckets[home];
      found = b.slots.some((s) => s.key === key) || b.overflow.some((s) => s.key === key);
    } else {
      const step = collision === "double-hashing" ? hash2(key, bucketCount) : 1;
      let i = home;
      for (let s = 0; s < bucketCount; s++) {
        probes = s + 1;
        const b = buckets[i];
        if (b.slots.some((x) => x.key === key)) {
          finalBucket = i;
          found = true;
          break;
        }
        if (b.slots.length === 0) break;
        i = (i + step) % bucketCount;
      }
    }

    set({
      events: [
        ...events,
        {
          key,
          homeBucket: home,
          finalBucket,
          probes,
          collided: probes > 1,
          overflowed: false,
          note: found
            ? `Lookup ${key}: found in bucket ${finalBucket} after ${probes} probe${probes > 1 ? "s" : ""}`
            : `Lookup ${key}: not present (${probes} probe${probes > 1 ? "s" : ""})`,
        },
      ],
      highlightBucket: finalBucket,
      highlightKey: found ? key : null,
    });
  },

  remove: (key) => {
    const { buckets, events } = get();
    const next = buckets.map((b) => ({
      ...b,
      slots: b.slots.filter((s) => s.key !== key),
      overflow: b.overflow.filter((s) => s.key !== key),
    }));
    set({
      buckets: next,
      events: [...events, { key, homeBucket: 0, finalBucket: 0, probes: 0, collided: false, overflowed: false, note: `Remove key ${key}` }],
      highlightBucket: null,
      highlightKey: null,
    });
  },

  reset: () =>
    set({
      buckets: emptyBuckets(get().bucketCount),
      events: [],
      highlightBucket: null,
      highlightKey: null,
    }),

  seed: (keys) => {
    get().reset();
    for (const k of keys) get().insert(k);
  },
}));
