"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: string;
  label: string; // primary operator glyph / table name
  sub?: string; // condition / attributes — shown smaller below label
  kind?:
    | "relation"
    | "project"
    | "select"
    | "join"
    | "cross"
    | "group"
    | "sort"
    | "distinct"
    | "semi"
    | "anti"
    | "union"
    | "intersect"
    | "difference"
    | "rename";
  children?: TreeNode[];
  highlight?: boolean;
  badge?: string; // e.g. cardinality "≈ 2k"
};

type Positioned = TreeNode & {
  x: number;
  y: number;
  depth: number;
  width: number;
};

const LEAF_GAP = 130; // horizontal space between leaves
const LEVEL_HEIGHT = 96;
const NODE_W = 120;
const NODE_H = 58;

function layout(
  node: TreeNode,
  depth: number,
  cursor: { x: number },
  out: Positioned[]
): number {
  if (!node.children || node.children.length === 0) {
    const x = cursor.x;
    cursor.x += LEAF_GAP;
    out.push({ ...node, x, y: depth * LEVEL_HEIGHT, depth, width: LEAF_GAP });
    return x;
  }
  const childXs: number[] = [];
  for (const c of node.children) {
    childXs.push(layout(c, depth + 1, cursor, out));
  }
  const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
  out.push({ ...node, x, y: depth * LEVEL_HEIGHT, depth, width: LEAF_GAP });
  return x;
}

const kindStyles: Record<NonNullable<TreeNode["kind"]>, string> = {
  relation:
    "border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  project:
    "border-violet-500/60 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  select:
    "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  join: "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cross:
    "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  group:
    "border-indigo-500/60 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  sort: "border-teal-500/60 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  distinct:
    "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  semi: "border-lime-500/60 bg-lime-500/10 text-lime-700 dark:text-lime-300",
  anti: "border-orange-500/60 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  union:
    "border-cyan-500/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  intersect:
    "border-purple-500/60 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  difference:
    "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300",
  rename:
    "border-slate-500/60 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export type TreeVizProps = {
  root: TreeNode | null;
  highlightIds?: string[];
  glowIds?: string[]; // stronger pulse
  flowingEdges?: [string, string][]; // [fromChildId, toParentId] — animated tuple flow
  width?: number;
  minHeight?: number;
  className?: string;
  caption?: string;
};

export function TreeViz({
  root,
  highlightIds,
  glowIds,
  flowingEdges,
  width,
  minHeight = 240,
  className,
  caption,
}: TreeVizProps) {
  const { nodes, edges, bounds } = useMemo(() => {
    if (!root) {
      return {
        nodes: [] as Positioned[],
        edges: [] as [Positioned, Positioned][],
        bounds: { w: 0, h: 0 },
      };
    }
    const positioned: Positioned[] = [];
    layout(root, 0, { x: 0 }, positioned);
    // Build edges: for each node with children, create edges to each child
    const byId = new Map(positioned.map((n) => [n.id, n]));
    const edges: [Positioned, Positioned][] = [];
    const walk = (n: TreeNode) => {
      if (!n.children) return;
      for (const c of n.children) {
        const parent = byId.get(n.id);
        const child = byId.get(c.id);
        if (parent && child) edges.push([child, parent]);
        walk(c);
      }
    };
    walk(root);
    const xs = positioned.map((n) => n.x);
    const ys = positioned.map((n) => n.y);
    const minX = Math.min(...xs) - NODE_W / 2 - 20;
    const maxX = Math.max(...xs) + NODE_W / 2 + 20;
    const maxY = Math.max(...ys) + NODE_H + 20;
    // normalize so everything starts at 0
    for (const n of positioned) n.x -= minX;
    for (const e of edges) {
      e[0] = { ...e[0], x: e[0].x - minX };
      e[1] = { ...e[1], x: e[1].x - minX };
    }
    return {
      nodes: positioned,
      edges,
      bounds: { w: maxX - minX, h: Math.max(minHeight, maxY) },
    };
  }, [root, minHeight]);

  if (!root) {
    return (
      <div
        className={cn(
          "flex h-40 items-center justify-center rounded-md border border-dashed border-border/50 text-sm text-muted-foreground",
          className
        )}
      >
        (empty tree)
      </div>
    );
  }

  const highlightSet = new Set(highlightIds ?? []);
  const glowSet = new Set(glowIds ?? []);
  const flowKey = (a: string, b: string) => `${a}→${b}`;
  const flowing = new Set(
    (flowingEdges ?? []).map(([a, b]) => flowKey(a, b))
  );

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <svg
        width={width ?? bounds.w}
        height={bounds.h}
        viewBox={`0 0 ${bounds.w} ${bounds.h}`}
        className="block"
        style={{ minWidth: bounds.w }}
      >
        {edges.map(([child, parent]) => {
          const cx1 = child.x;
          const cy1 = child.y;
          const cx2 = parent.x;
          const cy2 = parent.y + NODE_H;
          const isFlowing = flowing.has(flowKey(child.id, parent.id));
          return (
            <g key={`${child.id}-${parent.id}`}>
              <line
                x1={cx1}
                y1={cy1}
                x2={cx2}
                y2={cy2}
                stroke="currentColor"
                strokeOpacity={isFlowing ? 0.6 : 0.28}
                strokeWidth={isFlowing ? 2 : 1.2}
                className="text-foreground"
              />
              {isFlowing && (
                <motion.circle
                  r={3}
                  fill="oklch(0.723 0.219 149.579)"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    offsetPath: `path('M ${cx1} ${cy1} L ${cx2} ${cy2}')`,
                  }}
                />
              )}
            </g>
          );
        })}

        <AnimatePresence>
          {nodes.map((n) => {
            const kind = n.kind ?? "relation";
            const isHighlight = highlightSet.has(n.id) || n.highlight;
            const isGlow = glowSet.has(n.id);
            return (
              <motion.g
                key={n.id}
                layout
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: isGlow ? 1.06 : 1,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                style={{ transformOrigin: `${n.x}px ${n.y + NODE_H / 2}px` }}
              >
                <foreignObject
                  x={n.x - NODE_W / 2}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                >
                  <div
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center rounded-md border-2 px-2 py-1 text-center transition-all",
                      kindStyles[kind],
                      isHighlight &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      isGlow &&
                        "shadow-[0_0_24px_var(--primary)] ring-2 ring-primary"
                    )}
                  >
                    <div className="font-mono text-base leading-none font-semibold">
                      {n.label}
                    </div>
                    {n.sub && (
                      <div className="mt-1 font-mono text-[10px] opacity-80 leading-tight max-w-full truncate">
                        {n.sub}
                      </div>
                    )}
                    {n.badge && (
                      <div className="mt-0.5 font-mono text-[9px] opacity-60">
                        {n.badge}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
      {caption && (
        <div className="mt-2 text-center font-mono text-xs text-muted-foreground">
          {caption}
        </div>
      )}
    </div>
  );
}
