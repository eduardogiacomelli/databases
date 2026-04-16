"use client";

import { useSchemaBuilder, useSchemaMetrics } from "./schema-builder-store";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function BlockLayoutPreview() {
  const columns = useSchemaBuilder((s) => s.columns);
  const blockSize = useSchemaBuilder((s) => s.blockSize);
  const { recordSize, bfr, wasted } = useSchemaMetrics();

  if (recordSize === 0) {
    return (
      <Card className="border-border/50 bg-muted/10">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Add at least one column to see the block layout.
        </CardContent>
      </Card>
    );
  }

  if (recordSize > blockSize) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-center text-sm text-destructive">
          Record size ({recordSize}B) exceeds block size ({blockSize}B). Either
          shrink the record or use a larger block.
        </CardContent>
      </Card>
    );
  }

  const previewRecords = Math.min(bfr, 30);

  const colorFor = (idx: number) =>
    [
      "bg-chart-1/40",
      "bg-chart-2/40",
      "bg-chart-3/40",
      "bg-chart-4/40",
      "bg-chart-5/40",
    ][idx % 5];

  return (
    <Card className="border-border/50 bg-muted/10 overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">
            Block = {blockSize}B · Record = {recordSize}B · bfr = {bfr}
          </span>
          <span className="font-mono">
            {previewRecords < bfr ? `showing ${previewRecords}/${bfr}` : "full block"}
          </span>
        </div>

        <motion.div
          layout
          className="relative rounded-lg border border-border/50 bg-background/40 overflow-hidden"
        >
          <div className="space-y-1 p-2">
            {Array.from({ length: previewRecords }).map((_, ri) => (
              <motion.div
                key={ri}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ri * 0.015, duration: 0.2 }}
                className="flex items-stretch gap-px rounded overflow-hidden"
              >
                <span className="w-8 shrink-0 text-center font-mono text-[10px] text-muted-foreground self-center">
                  R{ri + 1}
                </span>
                <div className="flex flex-1 items-stretch gap-px">
                  {columns.map((c, ci) => (
                    <div
                      key={c.id}
                      style={{ flexGrow: c.bytes, flexBasis: 0 }}
                      className={`${colorFor(ci)} border-y border-border/30 flex items-center justify-center py-1.5 font-mono text-[9px] text-foreground/80 overflow-hidden`}
                      title={`${c.name} · ${c.bytes}B`}
                    >
                      <span className="truncate px-1">{c.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          {wasted > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center border-t border-dashed border-border/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--muted)_6px,var(--muted)_8px)] py-3 text-[10px] font-mono text-muted-foreground"
            >
              wasted · {wasted}B
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
