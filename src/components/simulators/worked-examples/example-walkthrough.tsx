"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, ChevronRightIcon, ListTreeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrerenderedCode } from "@/components/content/prerendered-code";
import { MathInline } from "@/components/content/math-block";
import { InfoCallout } from "@/components/content/info-callout";

type StepKind = "leaf" | "select" | "project" | "join" | "group" | "having" | "sort";

const KIND_GLYPH: Record<StepKind, string> = {
  leaf: "📄",
  select: "σ",
  project: "π",
  join: "⋈",
  group: "𝒢",
  having: "σ",
  sort: "τ",
};

const KIND_TONE: Record<StepKind, string> = {
  leaf: "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  select: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  project: "border-violet-500/40 bg-violet-500/5 text-violet-700 dark:text-violet-300",
  join: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  group: "border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300",
  having: "border-orange-500/40 bg-orange-500/5 text-orange-700 dark:text-orange-300",
  sort: "border-teal-500/40 bg-teal-500/5 text-teal-700 dark:text-teal-300",
};

export type WalkthroughStep = {
  id: string;
  kind: StepKind;
  /** What the operator looks like, e.g. σ_{D.SIGLA = 'INE5616'} */
  expr: string;
  /** Short title shown on the step row */
  title: string;
  /** Why this happens here, in plain English */
  reasoning: string;
  /** Big-O for THIS step in isolation */
  bigO: string;
  /** Algorithm or access method chosen */
  algorithm?: string;
  /** Optional warning / interesting observation */
  note?: string;
};

export type WorkedExample = {
  id: string;
  title: string;
  shortTitle: string;
  /** SQL source */
  sql: string;
  /** Plain English description of the question */
  question: string;
  /** Tables involved with brief description */
  schema: { name: string; description: string }[];
  /** Indexes / data assumptions */
  assumptions: string[];
  /** Key insight that drives the optimization */
  keyInsight: string;
  /** Steps in execution order, leaf-first */
  steps: WalkthroughStep[];
  /** Final composed Big-O */
  totalBigO: string;
  /** Why this final cost is acceptable */
  totalReasoning: string;
  /** Link to the full ReactFlow diagram */
  visualUrl: string;
};

export function ExampleWalkthrough({
  examples,
  sqlHtml,
}: {
  examples: WorkedExample[];
  /** Pre-highlighted SQL HTML, indexed by example id. */
  sqlHtml?: Record<string, string>;
}) {
  const [active, setActive] = useState(examples[0].id);
  const [openStep, setOpenStep] = useState<string | null>(null);

  return (
    <Tabs value={active} onValueChange={(v) => { setActive(v); setOpenStep(null); }}>
      <TabsList className="w-full">
        {examples.map((e) => (
          <TabsTrigger key={e.id} value={e.id} className="gap-1.5">
            <span className="font-mono text-[11px] opacity-70">{e.shortTitle}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {examples.map((e) => (
        <TabsContent key={e.id} value={e.id} className="space-y-4 pt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <Badge variant="outline" className="font-mono">
                    {e.shortTitle}
                  </Badge>
                  <CardTitle className="font-heading">{e.title}</CardTitle>
                  <p className="text-muted-foreground">{e.question}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={e.visualUrl} target="_blank" rel="noreferrer" className="gap-1.5">
                    <ExternalLinkIcon className="size-3.5" />
                    Full tree diagram
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {sqlHtml?.[e.id] ? (
                <PrerenderedCode html={sqlHtml[e.id]} title="query" />
              ) : (
                <pre className="overflow-x-auto rounded-lg border border-border/50 bg-muted/20 p-4 font-mono text-xs leading-relaxed">
                  {e.sql}
                </pre>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tables involved
                  </div>
                  <ul className="space-y-1">
                    {e.schema.map((t) => (
                      <li key={t.name} className="flex items-start gap-2">
                        <Badge variant="secondary" className="font-mono shrink-0">
                          {t.name}
                        </Badge>
                        <span className="text-muted-foreground">
                          {t.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Indexes &amp; data assumptions
                  </div>
                  <ul className="space-y-1">
                    {e.assumptions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <ChevronRightIcon className="size-3.5 mt-1 shrink-0 text-primary" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <InfoCallout variant="tip" title="Key optimization insight">
                {e.keyInsight}
              </InfoCallout>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading flex items-center gap-2">
                <ListTreeIcon className="size-4 text-primary" />
                Execution plan, step by step
              </CardTitle>
              <p className="text-muted-foreground">
                Read bottom-up: leaves first, then each operator consumes its
                children&apos;s output. Click a step to read the reasoning.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {e.steps.map((s, i) => {
                const open = openStep === s.id;
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => setOpenStep(open ? null : s.id)}
                    layout
                    className={cn(
                      "w-full text-left rounded-lg border transition-colors",
                      KIND_TONE[s.kind],
                      open ? "shadow-sm" : "hover:bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <span className="font-mono text-sm font-bold w-6 text-center">
                        {i + 1}
                      </span>
                      <span className="font-mono text-xl font-bold w-7 text-center">
                        {KIND_GLYPH[s.kind]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-heading font-semibold">
                            {s.title}
                          </span>
                          <code className="font-mono text-xs opacity-80 truncate">
                            {s.expr}
                          </code>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono shrink-0"
                        title="Big-O for this step"
                      >
                        <MathInline expression={s.bigO} />
                      </Badge>
                      <ChevronRightIcon
                        className={cn(
                          "size-4 transition-transform shrink-0",
                          open && "rotate-90"
                        )}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 border-t border-current/15 px-3 py-3">
                            {s.algorithm && (
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                                  Algorithm
                                </span>
                                <div className="font-mono">{s.algorithm}</div>
                              </div>
                            )}
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                                Reasoning
                              </span>
                              <p className="leading-relaxed">{s.reasoning}</p>
                            </div>
                            {s.note && (
                              <p className="rounded-md bg-current/10 px-3 py-2 italic">
                                {s.note}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/40 bg-emerald-500/4">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-emerald-700 dark:text-emerald-400">
                Total cost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-md bg-background/60 border border-emerald-500/30 px-4 py-3">
                <div className="font-mono">
                  <MathInline expression={e.totalBigO} />
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {e.totalReasoning}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
