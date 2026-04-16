export type PgType = {
  name: string;
  label: string;
  bytes: number;
  category: "numeric" | "text" | "boolean" | "date" | "binary" | "uuid";
};

export const PG_TYPES: PgType[] = [
  // Numeric
  { name: "SMALLINT", label: "SMALLINT (2B)", bytes: 2, category: "numeric" },
  { name: "INTEGER", label: "INTEGER (4B)", bytes: 4, category: "numeric" },
  { name: "BIGINT", label: "BIGINT (8B)", bytes: 8, category: "numeric" },
  { name: "REAL", label: "REAL (4B)", bytes: 4, category: "numeric" },
  { name: "DOUBLE PRECISION", label: "DOUBLE PRECISION (8B)", bytes: 8, category: "numeric" },
  { name: "NUMERIC(10,2)", label: "NUMERIC(10,2) (8B)", bytes: 8, category: "numeric" },
  { name: "SERIAL", label: "SERIAL (4B)", bytes: 4, category: "numeric" },

  // Text
  { name: "CHAR(10)", label: "CHAR(10) (10B)", bytes: 10, category: "text" },
  { name: "CHAR(20)", label: "CHAR(20) (20B)", bytes: 20, category: "text" },
  { name: "CHAR(50)", label: "CHAR(50) (50B)", bytes: 50, category: "text" },
  { name: "VARCHAR(32)", label: "VARCHAR(32) (33B)", bytes: 33, category: "text" },
  { name: "VARCHAR(64)", label: "VARCHAR(64) (65B)", bytes: 65, category: "text" },
  { name: "VARCHAR(128)", label: "VARCHAR(128) (129B)", bytes: 129, category: "text" },
  { name: "VARCHAR(255)", label: "VARCHAR(255) (256B)", bytes: 256, category: "text" },
  { name: "TEXT", label: "TEXT (var, ~256B avg)", bytes: 256, category: "text" },

  // Boolean
  { name: "BOOLEAN", label: "BOOLEAN (1B)", bytes: 1, category: "boolean" },

  // Date/Time
  { name: "DATE", label: "DATE (4B)", bytes: 4, category: "date" },
  { name: "TIMESTAMP", label: "TIMESTAMP (8B)", bytes: 8, category: "date" },
  { name: "TIMESTAMPTZ", label: "TIMESTAMPTZ (8B)", bytes: 8, category: "date" },
  { name: "INTERVAL", label: "INTERVAL (16B)", bytes: 16, category: "date" },

  // Binary
  { name: "BYTEA(64)", label: "BYTEA(64) (64B)", bytes: 64, category: "binary" },
  { name: "BYTEA(256)", label: "BYTEA(256) (256B)", bytes: 256, category: "binary" },

  // UUID
  { name: "UUID", label: "UUID (16B)", bytes: 16, category: "uuid" },
];

export const PG_TYPE_MAP = new Map(PG_TYPES.map((t) => [t.name, t]));

/** Common block sizes for modern systems */
export const BLOCK_SIZES = [512, 1024, 2048, 4096, 8192, 16384, 32768] as const;
export type BlockSize = (typeof BLOCK_SIZES)[number];

/** Default PostgreSQL block size */
export const DEFAULT_BLOCK_SIZE: BlockSize = 8192;

/** Calculate blocking factor: how many whole records fit in one block */
export function blockingFactor(blockSize: number, recordSize: number): number {
  if (recordSize <= 0) return 0;
  return Math.floor(blockSize / recordSize);
}

/** Calculate total blocks needed for a file */
export function totalBlocks(recordCount: number, bfr: number): number {
  if (bfr <= 0) return 0;
  return Math.ceil(recordCount / bfr);
}

/** Wasted bytes per block */
export function wastedBytesPerBlock(blockSize: number, recordSize: number, bfr: number): number {
  return blockSize - bfr * recordSize;
}

/** Average block accesses for linear search (unordered file) */
export function linearSearchAvg(totalBlockCount: number): number {
  return totalBlockCount / 2;
}

/** Block accesses for binary search (ordered file) */
export function binarySearchAccesses(totalBlockCount: number): number {
  if (totalBlockCount <= 0) return 0;
  return Math.ceil(Math.log2(totalBlockCount));
}
