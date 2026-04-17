"use client";

import { useEffect, useMemo } from "react";
import { useExternalSort } from "./external-sort-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowDownUpIcon } from "lucide-react";
import { BlockRow, type BlockDatum, type BlockState } from "@/components/simulators/shared/block-row";
import { StepController } from "@/components/simulators/shared/step-controller";
import { StatPill } from "@/components/simulators/shared/stat-pill";
import { CostFormula } from "@/components/simulators/shared/cost-formula";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ExternalSortAnimator() {
  const {
    b,
    nB,
    speedMs,
    steps,
    step,
    isPlaying,
    setB,
    setNB,
    setSpeed,
    next,
    prev,
    reset,
    play,
    pause,
    skipToEnd,
  } = useExternalSort();

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= steps.length - 1) {
      pause();
      return;
    }
    const t = window.setTimeout(next, speedMs);
    return () => window.clearTimeout(t);
  }, [isPlaying, step, steps.length, speedMs, next, pause]);

  const current = steps[step];

  // Compute formula values
  const nR = Math.ceil(b / nB);
  const logBase = Math.max(2, nB - 1);
  const passCount = nR <= 1 ? 0 : Math.ceil(Math.log(nR) / Math.log(logBase));
  const totalCost = 2 * b * (passCount + 1);

  // Build file row representation
  const fileBlocks: BlockDatum[] = useMemo(() => {
    const arr: BlockDatum[] = [];
    for (let i = 0; i < b; i++) {
      const state: BlockState = current?.activeFileBlocks?.includes(i)
        ? "active"
        : current && current.phase !== "initial"
        ? "visited"
        : "idle";
      arr.push({
        id: i,
        label: `B${i}`,
        state,
      });
    }
    return arr;
  }, [b, current]);

  const consumingSet = new Set(current?.consuming ?? []);

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowDownUpIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading">
                External Sort Animator
              </CardTitle>
              <p className="text-muted-foreground mt-0.5">
                Watch the initial run creation and (nB−1)-way merge passes play
                out block by block.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                File size (b blocks)
              </Label>
              <Slider
                value={[b]}
                min={4}
                max={48}
                step={1}
                onValueChange={(v) => setB(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">
                {b} blocks
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Buffer (nB frames)
              </Label>
              <Slider
                value={[nB]}
                min={3}
                max={8}
                step={1}
                onValueChange={(v) => setNB(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">
                {nB} buffer blocks · fan-in = {Math.max(2, nB - 1)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill label="initial runs" value={`⌈${b}/${nB}⌉ = ${nR}`} />
            <StatPill
              label="merge passes"
              value={nR <= 1 ? 0 : `⌈log_${logBase}(${nR})⌉ = ${passCount}`}
            />
            <StatPill
              label="reads so far"
              value={current?.reads ?? 0}
              tone="primary"
            />
            <StatPill
              label="writes so far"
              value={current?.writes ?? 0}
              tone="primary"
            />
          </div>

          <StepController
            step={step}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onPrev={prev}
            onNext={next}
            onReset={reset}
            onSkipToEnd={skipToEnd}
            onPlayToggle={() => (isPlaying ? pause() : play())}
            onSpeedChange={setSpeed}
          />

          <div className="rounded-md border border-border/40 bg-muted/10 px-4 py-3 font-mono text-xs text-muted-foreground">
            <span className="mr-2 text-primary">
              [{current?.phase.toUpperCase()}]
            </span>
            {current?.note}
          </div>

          <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-4">
            <BlockRow
              label="Input file on disk"
              blocks={fileBlocks}
              size="sm"
            />

            {current?.phase === "initial" && current.activeFileBlocks && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Buffer (memory · nB = {nB})
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: nB }).map((_, i) => {
                    const used = i < current.activeFileBlocks!.length;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md border font-mono text-[10px]",
                          used
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-dashed border-border/50 bg-muted/10 text-muted-foreground/50"
                        )}
                      >
                        {used ? "●" : "·"}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {current?.runsByPass.map((pass, i) => {
              if (pass.length === 0) return null;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {i === 0
                        ? "Initial runs"
                        : `Pass ${i} · merged runs`}
                    </span>
                    <span className="rounded-full bg-muted/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {pass.length} run{pass.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {pass.map((run) => {
                      const state: BlockState = consumingSet.has(run.id)
                        ? "active"
                        : current.producing === run.id
                        ? "output"
                        : "sorted";
                      return (
                        <motion.div
                          key={run.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-1"
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {run.id}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground/50">
                              · {run.blocks.length}b
                            </span>
                          </div>
                          <BlockRow
                            blocks={run.blocks.map((keys, bi) => ({
                              id: `${run.id}-${bi}`,
                              label: keys[0].toString(),
                              sub: keys[keys.length - 1].toString(),
                              state,
                              tint: run.tint,
                            }))}
                            size="sm"
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <CostFormula
            label="Total I/O cost"
            template="2 × b × (passes + 1)"
            terms={[
              { name: "b", value: b, hint: "file size in blocks" },
              {
                name: "passes",
                value: passCount,
                hint: `⌈log_${logBase}(${nR})⌉`,
              },
            ]}
            result={totalCost}
            highlight
          />
        </CardContent>
      </Card>
    </div>
  );
}
