"use client";

import { useEffect, useMemo } from "react";
import {
  useJoinSim,
  computeCosts,
  type JoinAlgo,
} from "./join-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShuffleIcon } from "lucide-react";
import { BlockRow, type BlockDatum, type BlockState } from "@/components/simulators/shared/block-row";
import { StepController } from "@/components/simulators/shared/step-controller";
import { StatPill } from "@/components/simulators/shared/stat-pill";
import { CostFormula } from "@/components/simulators/shared/cost-formula";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ALGO_LABELS: Record<JoinAlgo, string> = {
  J2: "Block nested-loop",
  J3: "Index nested-loop",
  J4: "Sort-merge",
  J5: "Hash join",
};

function phaseState(s: "idle" | "loaded" | "processed" | "sorted" | "bucketed"): BlockState {
  switch (s) {
    case "idle":
      return "idle";
    case "loaded":
      return "active";
    case "processed":
      return "visited";
    case "sorted":
      return "sorted";
    case "bucketed":
      return "partition";
  }
}

export function JoinAnimator() {
  const {
    algo,
    bR,
    bS,
    nB,
    nR,
    hi,
    indexOnS,
    steps,
    step,
    isPlaying,
    speedMs,
    setAlgo,
    setBR,
    setBS,
    setNB,
    setHi,
    setIndexOnS,
    next,
    prev,
    reset,
    play,
    pause,
    setSpeed,
    skipToEnd,
  } = useJoinSim();

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= steps.length - 1) {
      pause();
      return;
    }
    const t = window.setTimeout(next, speedMs);
    return () => window.clearTimeout(t);
  }, [isPlaying, step, steps.length, speedMs, next, pause]);

  const costs = useMemo(
    () => computeCosts({ bR, bS, nR, nB, hi, indexOnS }),
    [bR, bS, nR, nB, hi, indexOnS]
  );

  const current = steps[Math.min(step, steps.length - 1)];

  const rBlocks: BlockDatum[] = current.rState.map((s, i) => ({
    id: `R${i}`,
    label: `R${i}`,
    state: phaseState(s),
    tint: current.rBuckets?.findIndex((arr) => arr.includes(i)),
  }));
  const sBlocks: BlockDatum[] = current.sState.map((s, i) => ({
    id: `S${i}`,
    label: `S${i}`,
    state: phaseState(s),
    tint: current.sBuckets?.findIndex((arr) => arr.includes(i)),
  }));

  const winner = Object.entries({ J2: costs.j2, J3: costs.j3, J4: costs.j4, J5: costs.j5 })
    .filter(([, v]) => Number.isFinite(v))
    .sort((a, b) => (a[1] as number) - (b[1] as number))[0]?.[0] as JoinAlgo;

  const swapOuter = () => {
    setBR(bS);
    setBS(bR);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShuffleIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading">Join Algorithm Animator</CardTitle>
              <p className="text-muted-foreground mt-0.5">
                Configure two relations and a buffer; see each algorithm execute, or
                compare their block-I/O costs side by side.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Outer R (bR)
              </Label>
              <Slider
                value={[bR]}
                min={2}
                max={48}
                step={1}
                onValueChange={(v) => setBR(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">{bR} blk</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Inner S (bS)
              </Label>
              <Slider
                value={[bS]}
                min={2}
                max={48}
                step={1}
                onValueChange={(v) => setBS(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">{bS} blk</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Buffer (nB)
              </Label>
              <Slider
                value={[nB]}
                min={3}
                max={12}
                step={1}
                onValueChange={(v) => setNB(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">{nB} frames</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Index height h_i
              </Label>
              <Slider
                value={[hi]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) => setHi(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">{hi}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={indexOnS ? "default" : "outline"}
              onClick={() => setIndexOnS(!indexOnS)}
              className="h-7 text-xs"
            >
              {indexOnS ? "Index on S ✓" : "No index on S"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={swapOuter}
              className="h-7 text-xs"
            >
              Swap outer ⇄ inner
            </Button>
            {winner && (
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                Cheapest here:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {winner} · {ALGO_LABELS[winner as JoinAlgo]}
                </span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill
              label="J2 block-NL"
              value={costs.j2}
              tone={winner === "J2" ? "success" : "default"}
            />
            <StatPill
              label="J3 index-NL"
              value={Number.isFinite(costs.j3) ? costs.j3 : "—"}
              tone={winner === "J3" ? "success" : "default"}
            />
            <StatPill
              label="J4 sort-merge"
              value={costs.j4}
              tone={winner === "J4" ? "success" : "default"}
            />
            <StatPill
              label="J5 hash"
              value={costs.j5}
              tone={winner === "J5" ? "success" : "default"}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Tabs
            value={algo}
            onValueChange={(v) => setAlgo(v as JoinAlgo)}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger value="J2">J2 · Block nested-loop</TabsTrigger>
              <TabsTrigger value="J3">J3 · Index NL</TabsTrigger>
              <TabsTrigger value="J4">J4 · Sort-merge</TabsTrigger>
              <TabsTrigger value="J5">J5 · Hash</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepController
            step={step}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onPrev={prev}
            onNext={next}
            onPlayToggle={() => (isPlaying ? pause() : play())}
            onReset={reset}
            onSkipToEnd={skipToEnd}
            onSpeedChange={setSpeed}
          />

          <div className="rounded-md border border-border/40 bg-muted/10 px-4 py-3 font-mono text-xs text-muted-foreground">
            <span className="mr-2 text-primary">[{current.phase}]</span>
            {current.note}
          </div>

          <div className="grid gap-4 rounded-lg border border-border/40 bg-card/30 p-4">
            <BlockRow label="Outer R" blocks={rBlocks} size="sm" />
            <BlockRow label="Inner S" blocks={sBlocks} size="sm" />

            {algo === "J5" && current.rBuckets && current.sBuckets && (
              <div className="space-y-2">
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Partitions on disk
                </div>
                <div className="grid gap-2"
                     style={{ gridTemplateColumns: `repeat(${current.rBuckets.length}, minmax(0, 1fr))` }}>
                  {current.rBuckets.map((rb, i) => {
                    const sb = current.sBuckets![i];
                    const active = current.activeBucket === i;
                    return (
                      <motion.div
                        key={i}
                        animate={{ scale: active ? 1.03 : 1 }}
                        className={cn(
                          "rounded-md border p-2 space-y-1",
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border/40 bg-muted/10"
                        )}
                      >
                        <div className="font-mono text-[10px] text-muted-foreground">
                          bucket {i}
                        </div>
                        <div className="text-[10px] font-mono">
                          R: <span className="text-primary font-semibold">{rb.length}</span>
                        </div>
                        <div className="text-[10px] font-mono">
                          S: <span className="text-primary font-semibold">{sb.length}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4 text-xs">
              <StatPill
                label="output"
                value={current.outputs}
                tone="success"
                className="min-w-24"
              />
              <StatPill label="reads" value={current.reads} tone="primary" className="min-w-24" />
              <StatPill label="writes" value={current.writes} tone="primary" className="min-w-24" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {algo === "J2" && (
              <CostFormula
                label="Block nested-loop"
                template="bR + ⌈bR/(nB−2)⌉ × bS"
                terms={[
                  { name: "bR", value: bR },
                  { name: "nB−2", value: nB - 2 },
                  { name: "bS", value: bS },
                ]}
                result={costs.j2}
                highlight={winner === "J2"}
              />
            )}
            {algo === "J3" && (
              <CostFormula
                label="Index nested-loop"
                template="bR + |R| × (h_i + 1)"
                terms={[
                  { name: "bR", value: bR },
                  { name: "|R|", value: bR * nR },
                  { name: "h_i", value: hi },
                ]}
                result={Number.isFinite(costs.j3) ? costs.j3 : "n/a"}
                highlight={winner === "J3"}
              />
            )}
            {algo === "J4" && (
              <CostFormula
                label="Sort-merge"
                template="sort(R) + sort(S) + bR + bS"
                terms={[
                  { name: "sort(R)", value: costs.sortR },
                  { name: "sort(S)", value: costs.sortS },
                  { name: "bR", value: bR },
                  { name: "bS", value: bS },
                ]}
                result={costs.j4}
                highlight={winner === "J4"}
              />
            )}
            {algo === "J5" && (
              <CostFormula
                label="Hash join"
                template="3 × (bR + bS)"
                terms={[
                  { name: "bR", value: bR },
                  { name: "bS", value: bS },
                ]}
                result={costs.j5}
                highlight={winner === "J5"}
              />
            )}
            <div className="rounded-md border border-border/40 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-heading text-sm font-medium text-foreground mb-1">
                When {algo} wins
              </p>
              {algo === "J2" && (
                <p>
                  Works everywhere, cheap only when the outer is small or nB is
                  big enough to load most of R at once. Always use the smaller
                  relation as outer.
                </p>
              )}
              {algo === "J3" && (
                <p>
                  Requires an index on the inner&apos;s join attribute. Great
                  when R is small and the index on S is tight (small h_i,
                  uniform distribution).
                </p>
              )}
              {algo === "J4" && (
                <p>
                  Pays for two external sorts up-front; wins when both relations
                  are large and fit neither the outer-chunk trick nor a hash
                  table. Produces sorted output — useful for downstream ORDER
                  BY.
                </p>
              )}
              {algo === "J5" && (
                <p>
                  Equi-joins only. Wins when there&apos;s enough memory for the
                  partition phase so each bucket of the build side fits in RAM.
                  Postgres&apos; default for big equi-joins.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
