import { create } from "zustand";

export type AccessMode = "linear" | "binary";
export type AccessStatus = "idle" | "running" | "found" | "notfound";

export type Block = {
  id: number;
  minKey: number;
  maxKey: number;
  keys: number[];
};

export type Step = {
  blockIdx: number;
  low: number;
  high: number;
  note: string;
  found?: boolean;
};

type FileAccessState = {
  mode: AccessMode;
  blockCount: number;
  recordsPerBlock: number;
  searchKey: number;
  speed: number; // ms per step

  status: AccessStatus;
  steps: Step[];
  currentStep: number;

  setMode: (mode: AccessMode) => void;
  setBlockCount: (n: number) => void;
  setRecordsPerBlock: (n: number) => void;
  setSearchKey: (k: number) => void;
  setSpeed: (ms: number) => void;

  run: () => void;
  reset: () => void;
  advance: () => void;
};

function buildBlocks(blockCount: number, recordsPerBlock: number): Block[] {
  const blocks: Block[] = [];
  let key = 10;
  for (let i = 0; i < blockCount; i++) {
    const keys: number[] = [];
    for (let j = 0; j < recordsPerBlock; j++) {
      keys.push(key);
      key += Math.floor(Math.random() * 5) + 1;
    }
    blocks.push({ id: i, minKey: keys[0], maxKey: keys[keys.length - 1], keys });
  }
  return blocks;
}

/** Seeded block layout so linear/binary compare on the same data */
let cachedBlocks: { blockCount: number; recordsPerBlock: number; blocks: Block[] } | null = null;
function getBlocks(blockCount: number, recordsPerBlock: number): Block[] {
  if (
    cachedBlocks &&
    cachedBlocks.blockCount === blockCount &&
    cachedBlocks.recordsPerBlock === recordsPerBlock
  ) {
    return cachedBlocks.blocks;
  }
  const blocks = buildBlocks(blockCount, recordsPerBlock);
  cachedBlocks = { blockCount, recordsPerBlock, blocks };
  return blocks;
}

export const useFileAccess = create<FileAccessState>((set, get) => ({
  mode: "linear",
  blockCount: 16,
  recordsPerBlock: 6,
  searchKey: 100,
  speed: 450,

  status: "idle",
  steps: [],
  currentStep: -1,

  setMode: (mode) => set({ mode, status: "idle", steps: [], currentStep: -1 }),
  setBlockCount: (n) => {
    cachedBlocks = null;
    set({
      blockCount: Math.max(2, Math.min(64, n)),
      status: "idle",
      steps: [],
      currentStep: -1,
    });
  },
  setRecordsPerBlock: (n) => {
    cachedBlocks = null;
    set({
      recordsPerBlock: Math.max(2, Math.min(12, n)),
      status: "idle",
      steps: [],
      currentStep: -1,
    });
  },
  setSearchKey: (k) => set({ searchKey: k, status: "idle", steps: [], currentStep: -1 }),
  setSpeed: (ms) => set({ speed: ms }),

  run: () => {
    const { mode, blockCount, recordsPerBlock, searchKey } = get();
    const blocks = getBlocks(blockCount, recordsPerBlock);
    const steps: Step[] = [];

    if (mode === "linear") {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const found = b.keys.includes(searchKey);
        steps.push({
          blockIdx: i,
          low: 0,
          high: blocks.length - 1,
          note: found
            ? `Found key ${searchKey} in block ${i}`
            : `Scan block ${i} (${b.minKey}..${b.maxKey}) — not here`,
          found,
        });
        if (found) break;
      }
    } else {
      let low = 0;
      let high = blocks.length - 1;
      let found = false;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const b = blocks[mid];
        if (searchKey < b.minKey) {
          steps.push({
            blockIdx: mid,
            low,
            high,
            note: `Read block ${mid} (${b.minKey}..${b.maxKey}): key ${searchKey} < ${b.minKey} → go left`,
          });
          high = mid - 1;
        } else if (searchKey > b.maxKey) {
          steps.push({
            blockIdx: mid,
            low,
            high,
            note: `Read block ${mid} (${b.minKey}..${b.maxKey}): key ${searchKey} > ${b.maxKey} → go right`,
          });
          low = mid + 1;
        } else {
          const hit = b.keys.includes(searchKey);
          steps.push({
            blockIdx: mid,
            low,
            high,
            note: hit
              ? `Read block ${mid}: key ${searchKey} is in range and present`
              : `Read block ${mid}: key ${searchKey} in range but not stored`,
            found: hit,
          });
          found = true;
          break;
        }
      }
      if (!found && steps.length === 0) {
        steps.push({
          blockIdx: 0,
          low: 0,
          high: blocks.length - 1,
          note: `Key ${searchKey} not present in the file`,
        });
      }
    }

    const last = steps[steps.length - 1];
    set({
      steps,
      currentStep: 0,
      status: last?.found ? "found" : "running",
    });
  },

  reset: () => set({ status: "idle", steps: [], currentStep: -1 }),

  advance: () => {
    const { steps, currentStep } = get();
    if (currentStep < 0) return;
    if (currentStep >= steps.length - 1) {
      const last = steps[steps.length - 1];
      set({ status: last?.found ? "found" : "notfound" });
      return;
    }
    set({ currentStep: currentStep + 1 });
  },
}));

export function getBlocksFromStore(
  blockCount: number,
  recordsPerBlock: number
): Block[] {
  return getBlocks(blockCount, recordsPerBlock);
}
