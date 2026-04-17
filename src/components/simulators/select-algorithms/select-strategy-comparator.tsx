"use client";

import { useEffect, useMemo } from "react";
import {
  buildContext,
  STRATEGIES,
  useSelectSim,
  type ConditionKind,
  type IndexKind,
  type StrategyCode,
} from "./select-strategy-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { BlockRow, type BlockDatum } from "@/components/simulators/shared/block-row";
import { StepController } from "@/components/simulators/shared/step-controller";
import { CostFormula } from "@/components/simulators/shared/cost-formula";
import { StatPill } from "@/components/simulators/shared/stat-pill";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CONDITIONS: { value: ConditionKind; label: string; sql: string }[] = [
  { value: "eq_pk", label: "Equality on primary key", sql: "WHERE ssn = '123'" },
  {
    value: "eq_cluster",
    label: "Equality on clustering attribute",
    sql: "WHERE dno = 5",
  },
  {
    value: "eq_secondary",
    label: "Equality on secondary attribute",
    sql: "WHERE city = 'NYC'",
  },
  { value: "range_order", label: "Range on ordering attribute", sql: "WHERE salary > 50000" },
  {
    value: "conjunction",
    label: "Conjunction (A = x AND B = y)",
    sql: "WHERE dno = 5 AND salary > 50000",
  },
];

const INDEX_OPTIONS: { key: IndexKind; label: string }[] = [
  { key: "primary", label: "Primary index" },
  { key: "clustering", label: "Clustering index" },
  { key: "secondary", label: "Secondary B+ index" },
  { key: "hash", label: "Hash index" },
];

export function SelectStrategyComparator() {
  const {
    b,
    bfr,
    hi,
    s,
    condition,
    indexes,
    selected,
    step,
    isPlaying,
    speedMs,
    setB,
    setBfr,
    setS,
    setCondition,
    toggleIndex,
    setSelected,
    next,
    prev,
    reset,
    play,
    pause,
    setSpeed,
  } = useSelectSim();

  const ctx = useMemo(
    () => buildContext({ b, bfr, hi, s, condition, indexes }),
    [b, bfr, hi, s, condition, indexes]
  );

  const activeIdx = new Set(
    Object.entries(indexes)
      .filter(([, v]) => v)
      .map(([k]) => k as IndexKind)
  );

  const applicable = Object.values(STRATEGIES).filter((st) =>
    st.applicable(condition, activeIdx)
  );

  // Scripts for each selected strategy — padded to same length so we can step through
  const scripts = useMemo(() => {
    return selected.map((code) => {
      const strat = STRATEGIES[code];
      return { code, events: strat.script(ctx), strat };
    });
  }, [selected, ctx]);

  const maxSteps = Math.max(1, ...scripts.map((s) => s.events.length));

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= maxSteps) {
      pause();
      return;
    }
    const t = window.setTimeout(next, speedMs);
    return () => window.clearTimeout(t);
  }, [isPlaying, step, maxSteps, speedMs, next, pause]);

  const toggleSelected = (code: StrategyCode) => {
    if (selected.includes(code)) {
      setSelected(selected.filter((c) => c !== code));
    } else if (selected.length < 3) {
      setSelected([...selected, code]);
    }
  };

  const conditionMeta = CONDITIONS.find((c) => c.value === condition)!;

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SearchIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading">
                SELECT Strategy Comparator
              </CardTitle>
              <p className="text-muted-foreground mt-0.5">
                Pick a predicate and the indexes you have; watch up to three
                strategies race on the same block-level data.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Selection condition
              </Label>
              <Select
                value={condition}
                onValueChange={(v) => setCondition(v as ConditionKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <code className="block font-mono text-xs text-muted-foreground">
                {conditionMeta.sql}
              </code>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Available indexes
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {INDEX_OPTIONS.map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={indexes[opt.key] ? "default" : "outline"}
                    onClick={() => toggleIndex(opt.key)}
                    className="h-7 px-2.5 text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Blocks b
              </Label>
              <Slider
                value={[b]}
                min={8}
                max={64}
                step={1}
                onValueChange={(v) => setB(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">
                {b}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Records/block (bfr)
              </Label>
              <Slider
                value={[bfr]}
                min={4}
                max={32}
                step={1}
                onValueChange={(v) => setBfr(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">
                {bfr}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Matches (s)
              </Label>
              <Slider
                value={[s]}
                min={1}
                max={Math.max(2, b * bfr)}
                step={1}
                onValueChange={(v) => setS(v[0])}
              />
              <div className="font-mono text-xs text-muted-foreground">
                {s}
              </div>
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
                onValueChange={(v) =>
                  useSelectSim.setState({ hi: v[0], step: 0 })
                }
              />
              <div className="font-mono text-xs text-muted-foreground">
                {hi}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Strategies to compare (pick up to 3)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {applicable.map((st) => {
                const on = selected.includes(st.code);
                return (
                  <Button
                    key={st.code}
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => toggleSelected(st.code)}
                    className="h-7 gap-1.5 px-2.5 text-xs"
                  >
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 font-mono text-[9px]"
                    >
                      {st.code}
                    </Badge>
                    {st.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <StepController
            step={step}
            totalSteps={maxSteps}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onPrev={prev}
            onNext={next}
            onReset={reset}
            onPlayToggle={() => (isPlaying ? pause() : play())}
            onSpeedChange={setSpeed}
          />
        </CardContent>
      </Card>

      <div
        className={cn(
          "grid gap-3",
          scripts.length === 1 && "grid-cols-1",
          scripts.length === 2 && "grid-cols-1 lg:grid-cols-2",
          scripts.length >= 3 && "grid-cols-1 lg:grid-cols-3"
        )}
      >
        {scripts.map(({ code, events, strat }) => {
          const visible = events.slice(0, step);
          const current = events[Math.min(step, events.length - 1)];
          const isDone = step >= events.length;
          const { terms, result } = strat.describeFormula(ctx);
          const ioCount = visible.filter(
            (e) => e.kind === "data" || e.kind === "scan"
          ).length;
          const readBlocks = new Set<number>();
          for (const e of visible) {
            if (e.blockIdx !== undefined) readBlocks.add(e.blockIdx);
          }
          const activeBlock =
            step < events.length && current?.blockIdx !== undefined
              ? current.blockIdx
              : null;

          const blocks: BlockDatum[] = Array.from({ length: b }).map((_, i) => {
            const isMatch = ctx.matchBlocks.includes(i);
            const wasRead = readBlocks.has(i);
            const isActive = activeBlock === i;
            const state = isActive
              ? "active"
              : wasRead && isMatch
              ? "match"
              : wasRead
              ? "read"
              : isMatch && isDone
              ? "match"
              : "idle";
            return { id: i, label: `B${i}`, state };
          });

          const indexLevels = Math.max(
            0,
            visible.filter((e) => e.kind === "index").length
          );

          return (
            <Card key={code} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {code}
                    </Badge>
                    <CardTitle className="text-sm font-heading">
                      {strat.name}
                    </CardTitle>
                  </div>
                  <StatPill
                    label="I/O"
                    value={ioCount}
                    tone={isDone ? "success" : "primary"}
                    className="py-1"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {indexLevels > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Index descent
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: ctx.hi }).map((_, lvl) => (
                        <motion.div
                          key={lvl}
                          animate={{
                            opacity: lvl < indexLevels ? 1 : 0.25,
                            scale: lvl === indexLevels - 1 ? 1.05 : 1,
                          }}
                          className={cn(
                            "h-6 flex-1 rounded border font-mono text-[10px] flex items-center justify-center",
                            lvl < indexLevels
                              ? "border-primary/60 bg-primary/10 text-primary"
                              : "border-border/30 bg-muted/10 text-muted-foreground/50"
                          )}
                        >
                          L{lvl}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <BlockRow label="Data file" blocks={blocks} size="sm" />

                <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2 font-mono text-[11px] text-muted-foreground min-h-8">
                  {current ? current.label : "(idle)"}
                </div>

                <CostFormula
                  label={`Formula · ${strat.formula}`}
                  template={strat.formula
                    .replace(/h_i/g, "h_i")
                    .replace(/\bs\b/g, "s")
                    .replace(/\bb\b/g, "b")}
                  terms={terms}
                  result={result}
                  highlight={isDone}
                />
                <p className="text-xs text-muted-foreground">
                  {strat.costHint}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
