"use client";

import { useFileAccess } from "./file-access-store";
import { cn } from "@/lib/utils";

const linearLines = [
  "function linearScan(blocks, K) {",
  "  for (let i = 0; i < blocks.length; i++) {",
  "    const b = readBlock(i);",
  "    if (b.contains(K)) return i;",
  "  }",
  "  return -1;",
  "}",
];

const binaryLines = [
  "function binarySearch(blocks, K) {",
  "  let low = 0, high = blocks.length - 1;",
  "  while (low <= high) {",
  "    const mid = Math.floor((low + high) / 2);",
  "    const b = readBlock(mid);",
  "    if      (K < b.minKey) high = mid - 1;",
  "    else if (K > b.maxKey) low  = mid + 1;",
  "    else return mid;",
  "  }",
  "  return -1;",
  "}",
];

export function BinarySearchViz() {
  const mode = useFileAccess((s) => s.mode);
  const currentStep = useFileAccess((s) => s.currentStep);
  const steps = useFileAccess((s) => s.steps);

  const lines = mode === "linear" ? linearLines : binaryLines;
  const step = currentStep >= 0 ? steps[currentStep] : undefined;

  // Highlight line heuristic based on step
  const activeLineIdx =
    mode === "linear"
      ? step
        ? step.found
          ? 3
          : 2
        : -1
      : step
      ? step.note.startsWith("Read block") && step.note.includes("< ")
        ? 6
        : step.note.includes("> ")
        ? 7
        : step.note.includes("in range")
        ? 8
        : 3
      : -1;

  return (
    <div className="rounded-lg border border-border/50 bg-card/60 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {mode === "linear" ? "linear-scan.ts" : "binary-search.ts"}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-4 transition-colors",
              i === activeLineIdx && "bg-primary/10"
            )}
          >
            <span className="w-5 shrink-0 select-none text-right text-muted-foreground/50">
              {i + 1}
            </span>
            <code
              className={cn(
                "text-muted-foreground/90",
                i === activeLineIdx && "text-primary"
              )}
            >
              {line}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}
