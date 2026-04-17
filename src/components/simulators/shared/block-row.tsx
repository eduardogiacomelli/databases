"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type BlockState =
  | "idle"
  | "active"
  | "read"
  | "visited"
  | "output"
  | "partition"
  | "sorted"
  | "match"
  | "dimmed";

export type BlockDatum = {
  id: string | number;
  label?: string;
  sub?: string | number;
  state?: BlockState;
  tint?: string | number; // used to color-match a partition / key range
};

export type BlockRowProps = {
  blocks: BlockDatum[];
  label?: string;
  columns?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  pointerAt?: number;
  pointerLabel?: string;
};

const stateStyles: Record<BlockState, string> = {
  idle: "border-border/50 bg-card text-muted-foreground",
  active:
    "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_var(--primary)]",
  read: "border-primary/60 bg-primary/15 text-primary",
  visited: "border-primary/30 bg-primary/[0.08] text-primary/90",
  output:
    "border-emerald-500/80 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  partition:
    "border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  sorted:
    "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  match:
    "border-emerald-500 bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 shadow-[0_0_0_1px_oklch(0.723_0.219_149.579)]",
  dimmed: "border-border/30 bg-muted/20 text-muted-foreground/50 opacity-40",
};

const sizeStyles = {
  sm: "h-10 w-10 text-[9px]",
  md: "h-14 w-14 text-[10px]",
  lg: "h-16 w-20 text-xs",
};

const tintColors = [
  "oklch(0.66 0.17 250)",
  "oklch(0.70 0.17 150)",
  "oklch(0.70 0.19 60)",
  "oklch(0.68 0.20 20)",
  "oklch(0.62 0.22 300)",
  "oklch(0.70 0.14 200)",
  "oklch(0.72 0.18 100)",
  "oklch(0.65 0.20 0)",
];

export function tintOf(seed: string | number | undefined): string | undefined {
  if (seed === undefined || seed === null) return undefined;
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return tintColors[h % tintColors.length];
}

export function BlockRow({
  blocks,
  label,
  columns,
  size = "md",
  className,
  pointerAt,
  pointerLabel,
}: BlockRowProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
          </span>
        </div>
      )}
      <div
        className="flex flex-wrap gap-1.5"
        style={
          columns
            ? {
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }
            : undefined
        }
      >
        {blocks.map((b, i) => {
          const st = b.state ?? "idle";
          const tint = tintOf(b.tint);
          return (
            <motion.div
              key={b.id}
              layout
              initial={false}
              animate={{
                scale: st === "active" || st === "match" ? 1.08 : 1,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              style={
                tint
                  ? {
                      borderColor: tint,
                      boxShadow: `inset 0 0 0 1px ${tint}30`,
                    }
                  : undefined
              }
              className={cn(
                "relative flex shrink-0 flex-col items-center justify-center rounded-md border font-mono transition-colors",
                sizeStyles[size],
                stateStyles[st]
              )}
            >
              {b.label !== undefined && (
                <span className="font-semibold leading-tight">{b.label}</span>
              )}
              {b.sub !== undefined && (
                <span className="opacity-70 leading-tight">{b.sub}</span>
              )}
              {pointerAt === i && (
                <motion.span
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute -top-4 text-primary text-[10px]"
                  aria-hidden
                >
                  ▼ {pointerLabel}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
