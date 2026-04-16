"use client";

import { useFileAccess } from "./file-access-store";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function TimeComparison() {
  const blockCount = useFileAccess((s) => s.blockCount);

  const linearAvg = blockCount / 2;
  const linearWorst = blockCount;
  const binaryWorst = Math.ceil(Math.log2(blockCount));

  const max = Math.max(linearWorst, binaryWorst, 1);

  const bars: { label: string; value: number; tone: "linear" | "binary" }[] = [
    { label: "Linear · avg (b/2)", value: linearAvg, tone: "linear" },
    { label: "Linear · worst (b)", value: linearWorst, tone: "linear" },
    { label: "Binary · ⌈log₂ b⌉", value: binaryWorst, tone: "binary" },
  ];

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Block reads · b = {blockCount}
        </div>
        <div className="space-y-2.5">
          {bars.map((bar) => {
            const pct = (bar.value / max) * 100;
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="font-semibold">
                    {bar.value.toFixed(bar.value < 10 ? 0 : 0)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                    className={
                      bar.tone === "linear"
                        ? "h-full bg-destructive/70"
                        : "h-full bg-emerald-500"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
