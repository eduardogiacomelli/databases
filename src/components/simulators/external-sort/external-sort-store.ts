import { create } from "zustand";

export type RunDescriptor = {
  id: string;
  pass: number;
  /** block indices of the sorted keys inside this run (monotonic) */
  blocks: number[][];
  /** stable integer key to tint this run */
  tint: number;
};

export type SortStep = {
  phase: "initial" | "merge" | "done";
  pass: number;
  note: string;
  runsByPass: RunDescriptor[][]; // index = pass (0 = initial runs; 1..k = merge outputs)
  // which runs are "being consumed" right now
  consuming?: string[];
  producing?: string; // id of run currently being built
  activeFileBlocks?: number[]; // blocks being read in Phase 1
  reads: number;
  writes: number;
};

type State = {
  b: number; // file size in blocks
  nB: number; // buffer size
  speedMs: number;
  steps: SortStep[];
  step: number;
  isPlaying: boolean;

  setB: (v: number) => void;
  setNB: (v: number) => void;
  setSpeed: (v: number) => void;
  setStep: (v: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  skipToEnd: () => void;
};

function buildSteps(b: number, nB: number): SortStep[] {
  if (nB < 3) nB = 3;
  const steps: SortStep[] = [];
  // Generate `b` blocks of random-looking integer keys for presentation.
  // For the simulator, each block just needs a small integer array; the
  // specifics don't matter since we're visualizing the algorithm shape.
  const keysPerBlock = 3;
  const allKeys: number[] = [];
  let k = 10;
  for (let i = 0; i < b * keysPerBlock; i++) {
    k += ((i * 13 + 7) % 9) + 1;
    allKeys.push(k);
  }
  // Randomize the file order (pseudo-random seed for determinism)
  const shuffled = [...allKeys];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (i * 2654435761) % (i + 1);
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  const fileBlocks: number[][] = [];
  for (let i = 0; i < b; i++) {
    fileBlocks.push(shuffled.slice(i * keysPerBlock, (i + 1) * keysPerBlock));
  }

  let reads = 0;
  let writes = 0;
  const runsByPass: RunDescriptor[][] = [[]];

  // Initial state
  steps.push({
    phase: "initial",
    pass: 0,
    note: `Ready. File has ${b} blocks; buffer has ${nB} frames. Each initial run covers ${nB} blocks.`,
    runsByPass: [[]],
    reads: 0,
    writes: 0,
  });

  // Phase 1: initial runs.
  let runCount = 0;
  for (let i = 0; i < b; i += nB) {
    const end = Math.min(i + nB, b);
    const chunk = fileBlocks.slice(i, end);
    const activeIdx = Array.from({ length: end - i }, (_, k) => i + k);
    // Read into buffer
    reads += chunk.length;
    steps.push({
      phase: "initial",
      pass: 0,
      note: `Read ${chunk.length} block${chunk.length === 1 ? "" : "s"} into the buffer (blocks ${i}..${end - 1}).`,
      runsByPass: runsByPass.map((p) => [...p]),
      activeFileBlocks: activeIdx,
      reads,
      writes,
    });
    // Sort in memory
    const sortedKeys = chunk.flat().slice().sort((a, b) => a - b);
    const sortedBlocks: number[][] = [];
    for (let j = 0; j < sortedKeys.length; j += keysPerBlock) {
      sortedBlocks.push(sortedKeys.slice(j, j + keysPerBlock));
    }
    steps.push({
      phase: "initial",
      pass: 0,
      note: `Sort in-memory: ${chunk.flat().length} records become a sorted run of ${sortedBlocks.length} block${sortedBlocks.length === 1 ? "" : "s"}.`,
      runsByPass: runsByPass.map((p) => [...p]),
      activeFileBlocks: activeIdx,
      reads,
      writes,
    });
    // Write run
    writes += sortedBlocks.length;
    const runId = `R0.${runCount}`;
    const newRun: RunDescriptor = {
      id: runId,
      pass: 0,
      blocks: sortedBlocks,
      tint: runCount,
    };
    runsByPass[0].push(newRun);
    runCount++;
    steps.push({
      phase: "initial",
      pass: 0,
      note: `Write sorted run ${runId} (${sortedBlocks.length} block${sortedBlocks.length === 1 ? "" : "s"}) out to disk.`,
      runsByPass: runsByPass.map((p) => [...p]),
      producing: runId,
      reads,
      writes,
    });
  }

  steps.push({
    phase: "initial",
    pass: 0,
    note: `Phase 1 complete: ${runsByPass[0].length} sorted runs of up to ${nB} blocks each.`,
    runsByPass: runsByPass.map((p) => [...p]),
    reads,
    writes,
  });

  // Merge passes
  let pass = 1;
  while (runsByPass[pass - 1].length > 1) {
    const inputRuns = runsByPass[pass - 1];
    const outputRuns: RunDescriptor[] = [];
    const fanIn = Math.max(2, nB - 1);
    for (let i = 0; i < inputRuns.length; i += fanIn) {
      const group = inputRuns.slice(i, i + fanIn);
      const groupIds = group.map((r) => r.id);
      // Read one block of each group run (conceptual), and output merged blocks.
      const merged = group.flatMap((r) => r.blocks.flat()).sort((a, b) => a - b);
      const mergedBlocks: number[][] = [];
      for (let j = 0; j < merged.length; j += keysPerBlock) {
        mergedBlocks.push(merged.slice(j, j + keysPerBlock));
      }
      const runId = `R${pass}.${outputRuns.length}`;
      const blocksIn = group.reduce((acc, r) => acc + r.blocks.length, 0);
      reads += blocksIn;
      writes += mergedBlocks.length;
      steps.push({
        phase: "merge",
        pass,
        note: `Pass ${pass}: merge ${group.length} runs (${blocksIn} blocks in) → run ${runId} (${mergedBlocks.length} blocks out). Fan-in = ${fanIn}.`,
        runsByPass: runsByPass.map((p) => [...p]),
        consuming: groupIds,
        producing: runId,
        reads,
        writes,
      });
      const newRun: RunDescriptor = {
        id: runId,
        pass,
        blocks: mergedBlocks,
        tint: i / fanIn,
      };
      outputRuns.push(newRun);
    }
    runsByPass[pass] = outputRuns;
    pass++;
  }

  steps.push({
    phase: "done",
    pass: pass - 1,
    note: `Done. File fully sorted in ${pass - 1} merge pass${pass - 1 === 1 ? "" : "es"}. Total I/O = ${reads + writes} block transfers.`,
    runsByPass: runsByPass.map((p) => [...p]),
    reads,
    writes,
  });

  return steps;
}

export const useExternalSort = create<State>((set, get) => ({
  b: 12,
  nB: 4,
  speedMs: 700,
  steps: buildSteps(12, 4),
  step: 0,
  isPlaying: false,

  setB: (v) => {
    const b = Math.max(4, Math.min(48, v));
    set({ b, steps: buildSteps(b, get().nB), step: 0, isPlaying: false });
  },
  setNB: (v) => {
    const nB = Math.max(3, Math.min(8, v));
    set({ nB, steps: buildSteps(get().b, nB), step: 0, isPlaying: false });
  },
  setSpeed: (ms) => set({ speedMs: ms }),
  setStep: (step) => set({ step }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  next: () => {
    const { step, steps } = get();
    if (step < steps.length - 1) set({ step: step + 1 });
  },
  prev: () => {
    const { step } = get();
    if (step > 0) set({ step: step - 1 });
  },
  reset: () => set({ step: 0, isPlaying: false }),
  skipToEnd: () => set({ step: get().steps.length - 1, isPlaying: false }),
}));
