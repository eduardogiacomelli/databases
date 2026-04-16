"use client";

import { motion } from "framer-motion";
import { useFileAccess, getBlocksFromStore } from "./file-access-store";
import { cn } from "@/lib/utils";

export function BlockGrid() {
  const blockCount = useFileAccess((s) => s.blockCount);
  const recordsPerBlock = useFileAccess((s) => s.recordsPerBlock);
  const mode = useFileAccess((s) => s.mode);
  const steps = useFileAccess((s) => s.steps);
  const currentStep = useFileAccess((s) => s.currentStep);
  const searchKey = useFileAccess((s) => s.searchKey);

  const blocks = getBlocksFromStore(blockCount, recordsPerBlock);

  const activeStep = currentStep >= 0 ? steps[currentStep] : undefined;
  const visited = new Set(
    steps.slice(0, Math.max(0, currentStep)).map((s) => s.blockIdx)
  );

  const low = activeStep?.low ?? 0;
  const high = activeStep?.high ?? blocks.length - 1;

  return (
    <div className="space-y-3">
      {mode === "binary" && activeStep && (
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>
            low = <span className="text-foreground">{low}</span>
          </span>
          <span>
            mid = <span className="text-primary">{activeStep.blockIdx}</span>
          </span>
          <span>
            high = <span className="text-foreground">{high}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12 md:grid-cols-16">
        {blocks.map((b, i) => {
          const inWindow =
            mode === "binary" && activeStep ? i >= low && i <= high : true;
          const isActive = activeStep?.blockIdx === i;
          const isHit = activeStep?.blockIdx === i && activeStep.found;
          const wasVisited = visited.has(i);

          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: isActive ? 1.08 : 1,
                opacity: inWindow ? 1 : 0.25,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className={cn(
                "relative aspect-square rounded-md border flex flex-col items-center justify-center font-mono text-[10px] transition-colors",
                "border-border/50 bg-card",
                wasVisited &&
                  !isActive &&
                  "border-primary/30 bg-primary/[0.08] text-primary",
                isActive &&
                  !isHit &&
                  "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_var(--primary)]",
                isHit &&
                  "border-emerald-500 bg-emerald-500/20 text-emerald-500 shadow-[0_0_0_1px_oklch(0.723_0.219_149.579)]"
              )}
            >
              <span className="text-[9px] text-muted-foreground">
                {String(i).padStart(2, "0")}
              </span>
              <span className="font-medium">
                {b.minKey}–{b.maxKey}
              </span>
              {isActive && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground"
                >
                  ↯
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {activeStep?.found && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-emerald-500"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Key <span className="font-mono font-semibold">{searchKey}</span>{" "}
          found in block {activeStep.blockIdx}
        </motion.div>
      )}
    </div>
  );
}
