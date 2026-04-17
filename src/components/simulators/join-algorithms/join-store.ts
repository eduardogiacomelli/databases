import { create } from "zustand";

export type JoinAlgo = "J2" | "J3" | "J4" | "J5";

export type JoinStep = {
  phase: string;
  note: string;
  // R blocks state
  rState: ("idle" | "loaded" | "processed" | "sorted" | "bucketed")[];
  sState: ("idle" | "loaded" | "processed" | "sorted" | "bucketed")[];
  // buckets (hash partitioning)
  rBuckets?: number[][]; // block indices per bucket
  sBuckets?: number[][];
  activeBucket?: number;
  // sort-merge pointers
  rPtr?: number;
  sPtr?: number;
  // outputs produced
  outputs: number;
  reads: number;
  writes: number;
};

type State = {
  algo: JoinAlgo;
  bR: number;
  bS: number;
  nR: number; // records per block of R
  nS: number; // records per block of S
  nB: number; // buffer blocks
  hi: number; // index height on S
  indexOnS: boolean;
  overlap: number; // %

  step: number;
  isPlaying: boolean;
  speedMs: number;

  steps: JoinStep[];

  setAlgo: (a: JoinAlgo) => void;
  setBR: (v: number) => void;
  setBS: (v: number) => void;
  setNB: (v: number) => void;
  setIndexOnS: (on: boolean) => void;
  setHi: (v: number) => void;
  setOverlap: (v: number) => void;

  setStep: (s: number) => void;
  next: () => void;
  prev: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (ms: number) => void;
  reset: () => void;
  skipToEnd: () => void;
  rebuild: () => void;
};

function buildJ2(bR: number, bS: number, nB: number): JoinStep[] {
  const steps: JoinStep[] = [];
  const outer = nB - 2; // frames for outer chunk of R
  const chunks = Math.ceil(bR / Math.max(1, outer));
  let reads = 0;
  let writes = 0;
  let outputs = 0;
  const rState: JoinStep["rState"] = Array(bR).fill("idle");
  const sState: JoinStep["sState"] = Array(bS).fill("idle");

  steps.push({
    phase: "setup",
    note: `Ready. Outer = R (${bR} blocks). Inner = S (${bS} blocks). Chunk size = nB−2 = ${outer}.`,
    rState: [...rState],
    sState: [...sState],
    outputs,
    reads,
    writes,
  });

  for (let c = 0; c < chunks; c++) {
    const start = c * outer;
    const end = Math.min(bR, start + outer);
    for (let i = start; i < end; i++) rState[i] = "loaded";
    reads += end - start;
    steps.push({
      phase: "load-outer",
      note: `Load R[${start}..${end - 1}] into the ${outer}-frame outer buffer.`,
      rState: [...rState],
      sState: [...sState],
      outputs,
      reads,
      writes,
    });
    for (let j = 0; j < bS; j++) {
      const prev = sState[j];
      sState[j] = "loaded";
      reads += 1;
      steps.push({
        phase: "probe-inner",
        note: `Load S[${j}] into the inner frame; probe vs every tuple of R chunk.`,
        rState: [...rState],
        sState: [...sState],
        outputs,
        reads,
        writes,
      });
      sState[j] = "processed";
      // Assume some matches
      const matches = Math.random() < 0.5 ? 1 : 0;
      outputs += matches;
      if (matches) writes += 1;
      // restore prev for visualization: keep "processed"
    }
    for (let i = start; i < end; i++) rState[i] = "processed";
  }
  steps.push({
    phase: "done",
    note: `Join complete. Cost = bR + ⌈bR/(nB−2)⌉ × bS = ${bR} + ${chunks} × ${bS} = ${bR + chunks * bS}.`,
    rState: [...rState],
    sState: [...sState],
    outputs,
    reads,
    writes,
  });
  return steps;
}

function buildJ4(bR: number, bS: number, nB: number): JoinStep[] {
  const steps: JoinStep[] = [];
  let reads = 0;
  let writes = 0;
  const rState: JoinStep["rState"] = Array(bR).fill("idle");
  const sState: JoinStep["sState"] = Array(bS).fill("idle");

  steps.push({
    phase: "setup",
    note: `Ready. Sort R and S on the join attribute, then merge.`,
    rState: [...rState],
    sState: [...sState],
    outputs: 0,
    reads,
    writes,
  });

  // Sort R
  const sortPassesR = Math.max(
    1,
    Math.ceil(Math.log(Math.max(1, Math.ceil(bR / nB))) / Math.log(Math.max(2, nB - 1)))
  );
  reads += bR;
  writes += bR;
  for (let i = 0; i < bR; i++) rState[i] = "sorted";
  steps.push({
    phase: "sort-R",
    note: `Sort R: external sort ≈ 2·bR·(passes+1), ≈ ${2 * bR * (sortPassesR + 1)} I/Os.`,
    rState: [...rState],
    sState: [...sState],
    outputs: 0,
    reads: reads + 2 * bR * sortPassesR,
    writes: writes + 2 * bR * sortPassesR,
  });
  // Sort S
  const sortPassesS = Math.max(
    1,
    Math.ceil(Math.log(Math.max(1, Math.ceil(bS / nB))) / Math.log(Math.max(2, nB - 1)))
  );
  for (let i = 0; i < bS; i++) sState[i] = "sorted";
  steps.push({
    phase: "sort-S",
    note: `Sort S: external sort ≈ ${2 * bS * (sortPassesS + 1)} I/Os.`,
    rState: [...rState],
    sState: [...sState],
    outputs: 0,
    reads: reads + 2 * bR * sortPassesR + 2 * bS * sortPassesS,
    writes: writes + 2 * bR * sortPassesR + 2 * bS * sortPassesS,
  });

  // Merge phase: scan both with pointers
  reads = 2 * bR * (sortPassesR + 1) + 2 * bS * (sortPassesS + 1);
  writes = reads;
  let outputs = 0;
  const mergeSteps = Math.max(bR, bS);
  for (let i = 0; i < mergeSteps; i++) {
    const rPtr = Math.min(i, bR - 1);
    const sPtr = Math.min(i, bS - 1);
    reads += 1;
    if (Math.random() < 0.55) {
      outputs += 1;
    }
    steps.push({
      phase: "merge",
      note: `Merge pointers R@${rPtr}, S@${sPtr}: compare head keys; advance smaller side, output on match.`,
      rState: rState.map((v, idx) => (idx <= rPtr ? "processed" : "sorted")),
      sState: sState.map((v, idx) => (idx <= sPtr ? "processed" : "sorted")),
      rPtr,
      sPtr,
      outputs,
      reads,
      writes,
    });
  }
  steps.push({
    phase: "done",
    note: `Sort-merge complete. Cost ≈ sort(R) + sort(S) + bR + bS.`,
    rState: [...rState],
    sState: [...sState],
    outputs,
    reads,
    writes,
  });
  return steps;
}

function buildJ5(bR: number, bS: number, nB: number): JoinStep[] {
  const steps: JoinStep[] = [];
  const partitions = Math.max(2, Math.min(nB - 1, 6));
  let reads = 0;
  let writes = 0;
  let outputs = 0;

  const rState: JoinStep["rState"] = Array(bR).fill("idle");
  const sState: JoinStep["sState"] = Array(bS).fill("idle");

  steps.push({
    phase: "setup",
    note: `Hash join. Partition both R and S into ${partitions} buckets using h(joinKey) mod ${partitions}.`,
    rState: [...rState],
    sState: [...sState],
    rBuckets: Array.from({ length: partitions }, () => []),
    sBuckets: Array.from({ length: partitions }, () => []),
    outputs,
    reads,
    writes,
  });

  // Partition R
  const rBuckets: number[][] = Array.from({ length: partitions }, () => []);
  const sBuckets: number[][] = Array.from({ length: partitions }, () => []);
  for (let i = 0; i < bR; i++) {
    const b = (i * 2654435761) % partitions;
    rBuckets[b].push(i);
    rState[i] = "bucketed";
    reads += 1;
    writes += 1;
    if (i % Math.max(1, Math.floor(bR / 5)) === 0 || i === bR - 1) {
      steps.push({
        phase: "partition-R",
        note: `Scan R; hash block ${i} → bucket ${b}. Write to the bucket on disk.`,
        rState: [...rState],
        sState: [...sState],
        rBuckets: rBuckets.map((arr) => [...arr]),
        sBuckets: sBuckets.map((arr) => [...arr]),
        outputs,
        reads,
        writes,
      });
    }
  }
  // Partition S
  for (let i = 0; i < bS; i++) {
    const b = (i * 40503) % partitions;
    sBuckets[b].push(i);
    sState[i] = "bucketed";
    reads += 1;
    writes += 1;
    if (i % Math.max(1, Math.floor(bS / 5)) === 0 || i === bS - 1) {
      steps.push({
        phase: "partition-S",
        note: `Scan S; hash block ${i} → bucket ${b}.`,
        rState: [...rState],
        sState: [...sState],
        rBuckets: rBuckets.map((arr) => [...arr]),
        sBuckets: sBuckets.map((arr) => [...arr]),
        outputs,
        reads,
        writes,
      });
    }
  }
  // Probe
  for (let p = 0; p < partitions; p++) {
    reads += rBuckets[p].length + sBuckets[p].length;
    outputs += Math.floor(
      (rBuckets[p].length * sBuckets[p].length) / Math.max(1, partitions)
    );
    steps.push({
      phase: "probe",
      note: `Probe bucket ${p}: load R-bucket (${rBuckets[p].length} blk) into memory hash table; scan S-bucket (${sBuckets[p].length} blk) probing for matches.`,
      rState: rState.map((v, idx) =>
        rBuckets[p].includes(idx) ? "loaded" : v
      ),
      sState: sState.map((v, idx) =>
        sBuckets[p].includes(idx) ? "processed" : v
      ),
      rBuckets: rBuckets.map((arr) => [...arr]),
      sBuckets: sBuckets.map((arr) => [...arr]),
      activeBucket: p,
      outputs,
      reads,
      writes,
    });
  }
  steps.push({
    phase: "done",
    note: `Hash join complete. Cost ≈ 3·(bR + bS) = ${3 * (bR + bS)}.`,
    rState: Array(bR).fill("processed"),
    sState: Array(bS).fill("processed"),
    rBuckets,
    sBuckets,
    outputs,
    reads,
    writes,
  });
  return steps;
}

function buildJ3(bR: number, bS: number, nR: number, hi: number): JoinStep[] {
  const steps: JoinStep[] = [];
  let reads = 0;
  let outputs = 0;
  const writes = 0;
  const rState: JoinStep["rState"] = Array(bR).fill("idle");
  const sState: JoinStep["sState"] = Array(bS).fill("idle");

  steps.push({
    phase: "setup",
    note: `Index nested-loop. For each tuple of R, probe index on S.`,
    rState: [...rState],
    sState: [...sState],
    outputs,
    reads,
    writes,
  });

  const tuplesR = bR * nR;
  const showEvery = Math.max(1, Math.floor(bR / 8));
  for (let i = 0; i < bR; i++) {
    rState[i] = "loaded";
    reads += 1;
    if (i % showEvery === 0 || i === bR - 1) {
      steps.push({
        phase: "scan-R",
        note: `Read R[${i}]; for each of its ${nR} tuples, walk the index on S (height ${hi}).`,
        rState: [...rState],
        sState: [...sState],
        outputs,
        reads,
        writes,
      });
    }
    rState[i] = "processed";
  }

  reads += tuplesR * (hi + 1);
  outputs = Math.floor(tuplesR * 0.4);
  steps.push({
    phase: "done",
    note: `Index nested-loop complete. Cost = bR + |R| · (h_i + 1) = ${bR} + ${tuplesR} × ${hi + 1} = ${bR + tuplesR * (hi + 1)}.`,
    rState: [...rState],
    sState: [...sState],
    outputs,
    reads,
    writes,
  });
  return steps;
}

export const useJoinSim = create<State>((set, get) => {
  const build = (s: Pick<State, "algo" | "bR" | "bS" | "nR" | "nB" | "hi">) => {
    switch (s.algo) {
      case "J2":
        return buildJ2(s.bR, s.bS, s.nB);
      case "J3":
        return buildJ3(s.bR, s.bS, s.nR, s.hi);
      case "J4":
        return buildJ4(s.bR, s.bS, s.nB);
      case "J5":
        return buildJ5(s.bR, s.bS, s.nB);
    }
  };

  const initial = {
    algo: "J5" as JoinAlgo,
    bR: 10,
    bS: 16,
    nR: 4,
    nS: 4,
    nB: 5,
    hi: 2,
    indexOnS: true,
    overlap: 50,
    step: 0,
    isPlaying: false,
    speedMs: 500,
  };

  return {
    ...initial,
    steps: build(initial),

    setAlgo: (a) => {
      const next = { ...get(), algo: a };
      set({ algo: a, steps: build(next), step: 0, isPlaying: false });
    },
    setBR: (v) => {
      const bR = Math.max(2, Math.min(48, v));
      const next = { ...get(), bR };
      set({ bR, steps: build(next), step: 0 });
    },
    setBS: (v) => {
      const bS = Math.max(2, Math.min(48, v));
      const next = { ...get(), bS };
      set({ bS, steps: build(next), step: 0 });
    },
    setNB: (v) => {
      const nB = Math.max(3, Math.min(12, v));
      const next = { ...get(), nB };
      set({ nB, steps: build(next), step: 0 });
    },
    setIndexOnS: (on) => set({ indexOnS: on }),
    setHi: (v) => {
      const hi = Math.max(1, Math.min(5, v));
      const next = { ...get(), hi };
      set({ hi, steps: build(next), step: 0 });
    },
    setOverlap: (v) => set({ overlap: v }),

    setStep: (s) => set({ step: s }),
    next: () => {
      const { step, steps } = get();
      if (step < steps.length - 1) set({ step: step + 1 });
    },
    prev: () => {
      const { step } = get();
      if (step > 0) set({ step: step - 1 });
    },
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    setSpeed: (ms) => set({ speedMs: ms }),
    reset: () => set({ step: 0, isPlaying: false }),
    skipToEnd: () => set({ step: get().steps.length - 1, isPlaying: false }),
    rebuild: () => set({ steps: build(get()), step: 0 }),
  };
});

export function computeCosts(s: {
  bR: number;
  bS: number;
  nR: number;
  nB: number;
  hi: number;
  indexOnS: boolean;
}) {
  const { bR, bS, nR, nB, hi, indexOnS } = s;
  // J2: bR + ⌈bR/(nB-2)⌉ · bS
  const chunks = Math.ceil(bR / Math.max(1, nB - 2));
  const j2 = bR + chunks * bS;
  // J3: bR + |R| · (hi + 1)
  const j3 = indexOnS ? bR + bR * nR * (hi + 1) : Infinity;
  // J4: sort + merge, simplified
  const sortPassesR = Math.ceil(Math.log(Math.max(1, Math.ceil(bR / nB))) / Math.log(Math.max(2, nB - 1)));
  const sortPassesS = Math.ceil(Math.log(Math.max(1, Math.ceil(bS / nB))) / Math.log(Math.max(2, nB - 1)));
  const sortR = 2 * bR * (sortPassesR + 1);
  const sortS = 2 * bS * (sortPassesS + 1);
  const j4 = sortR + sortS + bR + bS;
  // J5: 3·(bR+bS)
  const j5 = 3 * (bR + bS);
  return { j2, j3, j4, j5, sortR, sortS, chunks };
}
