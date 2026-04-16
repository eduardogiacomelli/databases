import { create } from "zustand";
import {
  PG_TYPES,
  DEFAULT_BLOCK_SIZE,
  blockingFactor,
  totalBlocks,
  wastedBytesPerBlock,
  linearSearchAvg,
  binarySearchAccesses,
  type BlockSize,
} from "@/lib/pg-types";

export type Column = {
  id: string;
  name: string;
  pgType: string;
  bytes: number;
};

type SchemaBuilderState = {
  tableName: string;
  columns: Column[];
  blockSize: BlockSize;
  recordCount: number;

  setTableName: (name: string) => void;
  addColumn: (name: string, pgType: string) => void;
  removeColumn: (id: string) => void;
  updateColumn: (id: string, patch: Partial<Column>) => void;
  setBlockSize: (size: BlockSize) => void;
  setRecordCount: (count: number) => void;
  reset: () => void;
};

const initialColumns: Column[] = [
  { id: "c1", name: "emp_id", pgType: "INTEGER", bytes: 4 },
  { id: "c2", name: "first_name", pgType: "CHAR(20)", bytes: 20 },
  { id: "c3", name: "last_name", pgType: "CHAR(30)", bytes: 30 },
  { id: "c4", name: "salary", pgType: "NUMERIC(10,2)", bytes: 8 },
  { id: "c5", name: "hire_date", pgType: "DATE", bytes: 4 },
  { id: "c6", name: "dept_id", pgType: "SMALLINT", bytes: 2 },
];

let idCounter = 100;
const nextId = () => `c${++idCounter}`;

export const useSchemaBuilder = create<SchemaBuilderState>((set) => ({
  tableName: "employee",
  columns: initialColumns,
  blockSize: DEFAULT_BLOCK_SIZE,
  recordCount: 10000,

  setTableName: (name) => set({ tableName: name }),
  addColumn: (name, pgType) => {
    const type = PG_TYPES.find((t) => t.name === pgType);
    if (!type) return;
    set((state) => ({
      columns: [
        ...state.columns,
        { id: nextId(), name, pgType, bytes: type.bytes },
      ],
    }));
  },
  removeColumn: (id) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== id),
    })),
  updateColumn: (id, patch) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === id
          ? {
              ...c,
              ...patch,
              bytes:
                patch.pgType !== undefined
                  ? PG_TYPES.find((t) => t.name === patch.pgType)?.bytes ??
                    c.bytes
                  : (patch.bytes ?? c.bytes),
            }
          : c
      ),
    })),
  setBlockSize: (size) => set({ blockSize: size }),
  setRecordCount: (count) => set({ recordCount: Math.max(1, count) }),
  reset: () =>
    set({
      tableName: "employee",
      columns: initialColumns,
      blockSize: DEFAULT_BLOCK_SIZE,
      recordCount: 10000,
    }),
}));

export function useSchemaMetrics() {
  const { columns, blockSize, recordCount } = useSchemaBuilder();
  const recordSize = columns.reduce((sum, c) => sum + c.bytes, 0);
  const bfr = blockingFactor(blockSize, recordSize);
  const blocks = totalBlocks(recordCount, bfr);
  const wasted = wastedBytesPerBlock(blockSize, recordSize, bfr);
  const totalBytes = blocks * blockSize;
  const usefulBytes = recordCount * recordSize;
  const efficiency = totalBytes > 0 ? (usefulBytes / totalBytes) * 100 : 0;
  const linearAvg = linearSearchAvg(blocks);
  const binaryReads = binarySearchAccesses(blocks);

  return {
    recordSize,
    bfr,
    blocks,
    wasted,
    totalBytes,
    usefulBytes,
    efficiency,
    linearAvg,
    binaryReads,
  };
}
