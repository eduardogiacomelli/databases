"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { LayersIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function formatInt(n: number): string {
  return n.toLocaleString();
}

export function FanoutCalculator() {
  const [blockSize, setBlockSize] = useState(8192);
  const [entrySize, setEntrySize] = useState(16);
  const [records, setRecords] = useState(10_000_000);
  const [recordSize, setRecordSize] = useState(128);

  const metrics = useMemo(() => {
    const bfrData = Math.floor(blockSize / recordSize);
    const bData = Math.ceil(records / bfrData);
    const fanout = Math.floor(blockSize / entrySize);

    const levels: number[] = [];
    let current = bData;
    levels.push(current);
    while (current > 1) {
      current = Math.ceil(current / fanout);
      levels.push(current);
    }

    const indexLevels = Math.max(0, levels.length - 1);
    const totalReads = indexLevels + 1;

    return { bfrData, bData, fanout, levels, indexLevels, totalReads };
  }, [blockSize, entrySize, records, recordSize]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayersIcon className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading">Fan-out Calculator</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Watch tree depth collapse as fan-out grows.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Block size (bytes)
            </Label>
            <Slider
              value={[blockSize]}
              min={512}
              max={32768}
              step={512}
              onValueChange={(v) => setBlockSize(v[0])}
            />
            <div className="text-xs font-mono text-muted-foreground">
              {formatInt(blockSize)} B
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Index entry size (bytes)
            </Label>
            <Slider
              value={[entrySize]}
              min={8}
              max={64}
              step={1}
              onValueChange={(v) => setEntrySize(v[0])}
            />
            <div className="text-xs font-mono text-muted-foreground">
              {entrySize} B
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Number of records
            </Label>
            <Input
              type="number"
              value={records}
              onChange={(e) => setRecords(Math.max(1, Number(e.target.value)))}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Record size (bytes)
            </Label>
            <Input
              type="number"
              value={recordSize}
              onChange={(e) => setRecordSize(Math.max(1, Number(e.target.value)))}
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <Stat label="data bfr" value={formatInt(metrics.bfrData)} />
          <Stat label="data blocks" value={formatInt(metrics.bData)} />
          <Stat label="fan-out" value={formatInt(metrics.fanout)} />
          <Stat label="lookup I/O" value={String(metrics.totalReads)} highlight />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tree levels (top → leaves → data)
          </div>
          <div className="space-y-1">
            {[...metrics.levels].reverse().map((n, i) => {
              const depth = metrics.levels.length - 1 - i;
              const isRoot = i === 0;
              const widthPct = Math.max(8, Math.min(100, (Math.log10(n + 1) / Math.log10(metrics.bData + 1)) * 100));
              return (
                <LevelBar
                  key={depth}
                  label={isRoot ? "root" : `level ${depth}`}
                  count={n}
                  widthPct={widthPct}
                />
              );
            })}
            <div className="flex items-center justify-center pt-1">
              <ArrowDownIcon className="size-3 text-muted-foreground/60" />
            </div>
            <LevelBar
              label="data file"
              count={metrics.bData}
              widthPct={100}
              variant="data"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {metrics.indexLevels} index level{metrics.indexLevels === 1 ? "" : "s"} +
          1 data read ={" "}
          <span className="font-mono text-foreground font-semibold">
            {metrics.totalReads} block I/O{metrics.totalReads === 1 ? "" : "s"}
          </span>{" "}
          per lookup, regardless of the {formatInt(records)} records stored.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        highlight
          ? "border-primary/40 bg-primary/10"
          : "border-border/40 bg-muted/20"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-semibold",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function LevelBar({
  label,
  count,
  widthPct,
  variant = "index",
}: {
  label: string;
  count: number;
  widthPct: number;
  variant?: "index" | "data";
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="w-16 text-muted-foreground">{label}</span>
      <div className="flex-1 h-6 rounded bg-muted/30 overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
          className={cn(
            "h-full flex items-center px-2",
            variant === "index"
              ? "bg-primary/15 border border-primary/30"
              : "bg-muted border border-border/50"
          )}
        >
          <span className="text-[10px] text-foreground font-semibold">
            {count.toLocaleString()} block{count === 1 ? "" : "s"}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
