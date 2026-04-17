"use client";

import { cn } from "@/lib/utils";
import { Fragment } from "react";

export type CostTerm = {
  name: string;
  value: number | string;
  hint?: string;
};

export type CostFormulaProps = {
  label?: string;
  template: string; // e.g. "bR + ⌈bR/(nB-2)⌉ × bS"
  terms: CostTerm[];
  result: number | string;
  resultUnit?: string;
  highlight?: boolean;
  className?: string;
};

export function CostFormula({
  label,
  template,
  terms,
  result,
  resultUnit = "block I/Os",
  highlight,
  className,
}: CostFormulaProps) {
  let rendered = template;
  for (const t of terms) {
    rendered = rendered.replaceAll(t.name, `⟦${t.name}=${t.value}⟧`);
  }
  const parts = rendered.split(/(⟦[^⟧]+⟧)/);

  return (
    <div
      className={cn(
        "space-y-2 rounded-md border px-4 py-3",
        highlight
          ? "border-emerald-500/40 bg-emerald-500/[0.05]"
          : "border-border/50 bg-muted/10",
        className
      )}
    >
      {label && (
        <div className="font-heading text-sm font-medium text-foreground/90">
          {label}
        </div>
      )}
      <div className="font-mono text-sm leading-relaxed">
        {parts.map((p, i) => {
          if (p.startsWith("⟦") && p.endsWith("⟧")) {
            const inner = p.slice(1, -1);
            const eq = inner.indexOf("=");
            const name = inner.slice(0, eq);
            const value = inner.slice(eq + 1);
            return (
              <Fragment key={i}>
                <span className="whitespace-nowrap">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="mx-0.5 text-muted-foreground/60">=</span>
                  <span className="text-primary font-semibold">{value}</span>
                </span>
              </Fragment>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
        <span className="text-xs text-muted-foreground">=</span>
        <span
          className={cn(
            "font-mono text-lg font-bold",
            highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
          )}
        >
          {result}
        </span>
        <span className="text-xs text-muted-foreground">{resultUnit}</span>
      </div>
      {terms.some((t) => t.hint) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1">
          {terms
            .filter((t) => t.hint)
            .map((t) => (
              <span key={t.name} className="font-mono">
                <span className="text-foreground/80">{t.name}</span>:{" "}
                <span className="opacity-80">{t.hint}</span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
