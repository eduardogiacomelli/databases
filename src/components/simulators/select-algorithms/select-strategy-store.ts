import { create } from "zustand";

export type IndexKind = "primary" | "clustering" | "secondary" | "hash";

export type ConditionKind =
  | "eq_pk" // WHERE pk = ?
  | "eq_cluster" // WHERE nonKey = ? (with clustering index)
  | "eq_secondary" // WHERE nonKey = ? (with secondary index, few matches)
  | "range_order" // WHERE ordering_key > ?
  | "conjunction"; // WHERE a = ? AND b = ?

export type StrategyCode =
  | "S1"
  | "S2"
  | "S3a"
  | "S3b"
  | "S4"
  | "S5"
  | "S6a"
  | "S6b"
  | "S7"
  | "S8"
  | "S9";

export type Strategy = {
  code: StrategyCode;
  name: string;
  /** Applicable for this condition given these indexes? */
  applicable: (c: ConditionKind, idx: Set<IndexKind>) => boolean;
  /** Script of block reads (as block indices in the file) */
  script: (ctx: StrategyContext) => AccessEvent[];
  formula: string;
  describeFormula: (ctx: StrategyContext) => {
    terms: { name: string; value: number | string; hint?: string }[];
    result: number;
  };
  costHint: string;
};

export type AccessEvent = {
  kind: "index" | "data" | "scan" | "hash";
  label: string; // human-readable log line
  blockIdx?: number; // block index being read
  indexLevel?: number; // for index visualization
  key?: string;
  note?: string;
};

export type StrategyContext = {
  b: number; // data blocks
  bfr: number; // records per block
  hi: number; // index levels
  s: number; // selection cardinality (matching records)
  matchBlocks: number[]; // physical data blocks containing matches
  hasPrimary: boolean;
  hasClustering: boolean;
  hasSecondary: boolean;
  hasHash: boolean;
};

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export const STRATEGIES: Record<StrategyCode, Strategy> = {
  S1: {
    code: "S1",
    name: "Linear search",
    applicable: () => true,
    script: (ctx) => {
      // Scan from start; for key-equality stop at match; otherwise scan all
      const events: AccessEvent[] = [];
      const stopAt =
        ctx.matchBlocks.length === 0
          ? ctx.b - 1
          : ctx.matchBlocks[ctx.matchBlocks.length - 1];
      const limit = Math.min(ctx.b, stopAt + 1);
      for (let i = 0; i < limit; i++) {
        events.push({
          kind: "scan",
          label: `Read block ${i}`,
          blockIdx: i,
        });
      }
      return events;
    },
    formula: "b (worst) · b/2 (avg, key equality)",
    describeFormula: (ctx) => ({
      terms: [{ name: "b", value: ctx.b, hint: "file blocks" }],
      result: ctx.b,
    }),
    costHint: "Always works; never a best choice when any index fits.",
  },
  S2: {
    code: "S2",
    name: "Binary search",
    applicable: (c) => c === "eq_pk" || c === "range_order",
    script: (ctx) => {
      const events: AccessEvent[] = [];
      let lo = 0;
      let hi = ctx.b - 1;
      const target = ctx.matchBlocks[0] ?? -1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        events.push({
          kind: "scan",
          label: `Read block ${mid} [lo=${lo}, hi=${hi}]`,
          blockIdx: mid,
        });
        if (mid === target) break;
        if (mid < target) lo = mid + 1;
        else hi = mid - 1;
      }
      return events;
    },
    formula: "⌈log₂(b)⌉",
    describeFormula: (ctx) => ({
      terms: [{ name: "b", value: ctx.b, hint: "file blocks" }],
      result: Math.ceil(Math.log2(Math.max(2, ctx.b))),
    }),
    costHint: "Only on physically ordered files; beaten by any real index.",
  },
  S3a: {
    code: "S3a",
    name: "Primary index, equality",
    applicable: (c, i) => c === "eq_pk" && i.has("primary"),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++) {
        events.push({
          kind: "index",
          label: `Index level ${lvl} → descend`,
          indexLevel: lvl,
        });
      }
      const tgt = ctx.matchBlocks[0] ?? 0;
      events.push({
        kind: "data",
        label: `Fetch data block ${tgt}`,
        blockIdx: tgt,
      });
      return events;
    },
    formula: "h_i + 1",
    describeFormula: (ctx) => ({
      terms: [
        { name: "h_i", value: ctx.hi, hint: "index levels" },
        { name: "1", value: 1, hint: "leaf block hit" },
      ],
      result: ctx.hi + 1,
    }),
    costHint: "Classic primary-key lookup. Fast, predictable.",
  },
  S3b: {
    code: "S3b",
    name: "Hash lookup, equality",
    applicable: (c, i) => c === "eq_pk" && i.has("hash"),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      events.push({ kind: "hash", label: "Hash the search key → bucket #" });
      const tgt = ctx.matchBlocks[0] ?? 0;
      events.push({
        kind: "data",
        label: `Read bucket → block ${tgt}`,
        blockIdx: tgt,
      });
      return events;
    },
    formula: "1 (best case, no overflow)",
    describeFormula: () => ({
      terms: [{ name: "1", value: 1, hint: "direct bucket" }],
      result: 1,
    }),
    costHint: "Unbeatable for equality on the hash key.",
  },
  S4: {
    code: "S4",
    name: "Primary index, range",
    applicable: (c, i) => c === "range_order" && i.has("primary"),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++) {
        events.push({
          kind: "index",
          label: `Descend to first matching block`,
          indexLevel: lvl,
        });
      }
      for (const b of ctx.matchBlocks) {
        events.push({
          kind: "data",
          label: `Scan block ${b}`,
          blockIdx: b,
        });
      }
      return events;
    },
    formula: "h_i + ⌈b/2⌉ (worst)",
    describeFormula: (ctx) => ({
      terms: [
        { name: "h_i", value: ctx.hi, hint: "levels" },
        {
          name: "runlen",
          value: ctx.matchBlocks.length,
          hint: "contiguous matching blocks",
        },
      ],
      result: ctx.hi + ctx.matchBlocks.length,
    }),
    costHint:
      "Descend once, then a sequential scan of the matching key range.",
  },
  S5: {
    code: "S5",
    name: "Clustering index, equality",
    applicable: (c, i) => c === "eq_cluster" && i.has("clustering"),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++) {
        events.push({
          kind: "index",
          label: `Clustering index level ${lvl}`,
          indexLevel: lvl,
        });
      }
      for (const b of ctx.matchBlocks) {
        events.push({
          kind: "data",
          label: `Read contiguous block ${b}`,
          blockIdx: b,
        });
      }
      return events;
    },
    formula: "h_i + ⌈s/bfr⌉",
    describeFormula: (ctx) => ({
      terms: [
        { name: "h_i", value: ctx.hi, hint: "levels" },
        { name: "s", value: ctx.s, hint: "matching records" },
        { name: "bfr", value: ctx.bfr, hint: "records per block" },
      ],
      result: ctx.hi + Math.ceil(ctx.s / ctx.bfr),
    }),
    costHint:
      "Matching rows are physically adjacent → small run of sequential I/Os.",
  },
  S6a: {
    code: "S6a",
    name: "Secondary B+ tree, equality (key)",
    applicable: (c, i) => c === "eq_pk" && i.has("secondary"),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++)
        events.push({
          kind: "index",
          label: `Secondary index level ${lvl}`,
          indexLevel: lvl,
        });
      events.push({
        kind: "data",
        label: `Fetch record block ${ctx.matchBlocks[0] ?? 0}`,
        blockIdx: ctx.matchBlocks[0] ?? 0,
      });
      return events;
    },
    formula: "h_i + 1",
    describeFormula: (ctx) => ({
      terms: [{ name: "h_i", value: ctx.hi }],
      result: ctx.hi + 1,
    }),
    costHint: "Still fast; one pointer per tree leaf.",
  },
  S6b: {
    code: "S6b",
    name: "Secondary B+ tree, equality (non-key)",
    applicable: (c, i) => c === "eq_secondary" && i.has("secondary"),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++)
        events.push({
          kind: "index",
          label: `Secondary index level ${lvl}`,
          indexLevel: lvl,
        });
      // one data I/O per match (worst: each match is on its own block)
      for (const b of ctx.matchBlocks) {
        events.push({
          kind: "data",
          label: `Fetch record block ${b} (scattered)`,
          blockIdx: b,
        });
      }
      return events;
    },
    formula: "h_i + s (scattered)",
    describeFormula: (ctx) => ({
      terms: [
        { name: "h_i", value: ctx.hi },
        { name: "s", value: ctx.s, hint: "matches" },
      ],
      result: ctx.hi + ctx.s,
    }),
    costHint:
      "One random I/O per match — cheap if s is small, ruinous when s grows.",
  },
  S7: {
    code: "S7",
    name: "Conjunctive — best index + filter",
    applicable: (c, i) =>
      c === "conjunction" && (i.has("secondary") || i.has("primary")),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++)
        events.push({
          kind: "index",
          label: `Index on most selective cond. — level ${lvl}`,
          indexLevel: lvl,
        });
      for (const b of ctx.matchBlocks) {
        events.push({
          kind: "data",
          label: `Fetch block ${b}; check remaining predicate in memory`,
          blockIdx: b,
        });
      }
      return events;
    },
    formula: "cost(most-selective) + 0  (extra filter is CPU, not I/O)",
    describeFormula: (ctx) => ({
      terms: [
        { name: "h_i", value: ctx.hi },
        { name: "s", value: ctx.s, hint: "records from picked index" },
      ],
      result: ctx.hi + ctx.s,
    }),
    costHint:
      "Pick the single most selective condition that has an index; filter the rest in memory.",
  },
  S8: {
    code: "S8",
    name: "Conjunctive — composite index",
    applicable: (c, i) =>
      c === "conjunction" &&
      (i.has("primary") || i.has("clustering") || i.has("secondary")),
    script: (ctx) => {
      const events: AccessEvent[] = [];
      for (let lvl = 0; lvl < ctx.hi; lvl++)
        events.push({
          kind: "index",
          label: `Composite index level ${lvl}`,
          indexLevel: lvl,
        });
      const tgt = ctx.matchBlocks[0] ?? 0;
      events.push({
        kind: "data",
        label: `Fetch block ${tgt}`,
        blockIdx: tgt,
      });
      return events;
    },
    formula: "h_i + 1",
    describeFormula: (ctx) => ({
      terms: [{ name: "h_i", value: ctx.hi }],
      result: ctx.hi + 1,
    }),
    costHint: "Only if the composite key exactly matches the conjunction.",
  },
  S9: {
    code: "S9",
    name: "Conjunctive — intersect RID sets",
    applicable: (c, i) => c === "conjunction" && i.size >= 2,
    script: (ctx) => {
      const events: AccessEvent[] = [];
      events.push({ kind: "index", label: "Scan index A → RID bitmap" });
      events.push({ kind: "index", label: "Scan index B → RID bitmap" });
      events.push({ kind: "hash", label: "AND the two bitmaps" });
      for (const b of ctx.matchBlocks) {
        events.push({
          kind: "data",
          label: `Fetch qualifying block ${b}`,
          blockIdx: b,
        });
      }
      return events;
    },
    formula: "2·h_i + s  (bitmap-index AND)",
    describeFormula: (ctx) => ({
      terms: [
        { name: "h_i", value: ctx.hi },
        { name: "s", value: ctx.s, hint: "surviving records" },
      ],
      result: 2 * ctx.hi + ctx.s,
    }),
    costHint:
      "PostgreSQL&apos;s &ldquo;BitmapAnd&rdquo; plan: two index scans → AND → fetch.",
  },
};

type State = {
  b: number;
  bfr: number;
  hi: number;
  s: number;
  condition: ConditionKind;
  indexes: Record<IndexKind, boolean>;
  selected: StrategyCode[];
  step: number;
  isPlaying: boolean;
  speedMs: number;

  setB: (v: number) => void;
  setBfr: (v: number) => void;
  setS: (v: number) => void;
  setCondition: (c: ConditionKind) => void;
  toggleIndex: (k: IndexKind) => void;
  setSelected: (codes: StrategyCode[]) => void;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (ms: number) => void;
};

export const useSelectSim = create<State>((set, get) => ({
  b: 24,
  bfr: 10,
  hi: 2,
  s: 6,
  condition: "eq_pk",
  indexes: {
    primary: true,
    clustering: false,
    secondary: true,
    hash: false,
  },
  selected: ["S1", "S3a"],
  step: 0,
  isPlaying: false,
  speedMs: 450,

  setB: (v) => set({ b: Math.max(8, Math.min(128, v)), step: 0 }),
  setBfr: (v) => set({ bfr: Math.max(4, Math.min(32, v)), step: 0 }),
  setS: (v) => set({ s: Math.max(1, Math.min(get().b * get().bfr, v)), step: 0 }),
  setCondition: (c) => {
    set({ condition: c, step: 0 });
    // reset strategies to applicables
    const idx = new Set(
      Object.entries(get().indexes)
        .filter(([, v]) => v)
        .map(([k]) => k as IndexKind)
    );
    const applicable = Object.values(STRATEGIES)
      .filter((s) => s.applicable(c, idx))
      .map((s) => s.code);
    set({ selected: applicable.slice(0, 3) });
  },
  toggleIndex: (k) => {
    const indexes = { ...get().indexes, [k]: !get().indexes[k] };
    set({ indexes, step: 0 });
  },
  setSelected: (codes) => set({ selected: codes, step: 0 }),
  setStep: (step) => set({ step }),
  next: () => set({ step: get().step + 1 }),
  prev: () => set({ step: Math.max(0, get().step - 1) }),
  reset: () => set({ step: 0, isPlaying: false }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (ms) => set({ speedMs: ms }),
}));

export function buildContext(
  state: Pick<
    State,
    "b" | "bfr" | "hi" | "s" | "indexes" | "condition"
  >
): StrategyContext {
  const { b, bfr, hi, s, indexes, condition } = state;
  // Build matchBlocks deterministically based on condition
  let matchBlocks: number[] = [];
  if (condition === "eq_pk") {
    matchBlocks = [Math.floor(b / 2)];
  } else if (condition === "eq_cluster") {
    const start = Math.floor(b * 0.35);
    const count = Math.max(1, Math.ceil(s / bfr));
    matchBlocks = range(count).map((i) => start + i);
  } else if (condition === "eq_secondary") {
    // scattered
    matchBlocks = range(s).map((i) => Math.min(b - 1, (i * 17 + 3) % b));
  } else if (condition === "range_order") {
    const start = Math.floor(b * 0.4);
    const count = Math.max(1, Math.ceil(b / 2));
    matchBlocks = range(count).map((i) => start + i).filter((x) => x < b);
  } else if (condition === "conjunction") {
    const start = Math.floor(b * 0.3);
    const count = Math.max(1, Math.ceil(s / bfr));
    matchBlocks = range(count).map((i) => start + i);
  }
  return {
    b,
    bfr,
    hi,
    s,
    matchBlocks,
    hasPrimary: indexes.primary,
    hasClustering: indexes.clustering,
    hasSecondary: indexes.secondary,
    hasHash: indexes.hash,
  };
}
