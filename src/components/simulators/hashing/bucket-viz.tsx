"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useHash } from "./hash-store";
import { cn } from "@/lib/utils";

export function BucketViz() {
  const buckets = useHash((s) => s.buckets);
  const slotsPerBucket = useHash((s) => s.slotsPerBucket);
  const highlightBucket = useHash((s) => s.highlightBucket);
  const highlightKey = useHash((s) => s.highlightKey);
  const collision = useHash((s) => s.collision);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>buckets[{buckets.length}]</span>
        <span>
          {slotsPerBucket} slot{slotsPerBucket > 1 ? "s" : ""} · {collision}
        </span>
      </div>

      <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        {buckets.map((bucket) => {
          const isActive = highlightBucket === bucket.id;
          const fillRatio = bucket.slots.length / slotsPerBucket;
          return (
            <motion.div
              key={bucket.id}
              initial={false}
              animate={{ scale: isActive ? 1.04 : 1 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "rounded-md border bg-card overflow-hidden",
                isActive ? "border-primary shadow-[0_0_0_1px_var(--primary)]" : "border-border/50"
              )}
            >
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-2 py-1">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {String(bucket.id).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    fillRatio === 0 && "bg-muted-foreground/20",
                    fillRatio > 0 && fillRatio < 1 && "bg-amber-500/70",
                    fillRatio >= 1 && "bg-destructive/70"
                  )}
                />
              </div>

              <div className="p-1 space-y-1">
                {Array.from({ length: slotsPerBucket }).map((_, sidx) => {
                  const slot = bucket.slots[sidx];
                  const isHit = slot?.key === highlightKey && isActive;
                  return (
                    <div
                      key={sidx}
                      className={cn(
                        "flex h-6 items-center justify-center rounded font-mono text-[11px] border",
                        !slot && "border-dashed border-border/40 text-muted-foreground/30",
                        slot && !isHit && "border-border/60 bg-muted/40",
                        isHit && "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {slot ? (
                          <motion.span
                            key={slot.key}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            {slot.key}
                          </motion.span>
                        ) : (
                          <span>·</span>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {bucket.overflow.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-dashed border-border/40">
                    <div className="text-[9px] text-muted-foreground/70 mb-0.5">
                      overflow
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {bucket.overflow.map((s) => (
                        <motion.span
                          key={s.key}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "rounded px-1 py-0.5 font-mono text-[10px] border",
                            s.key === highlightKey
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                          )}
                        >
                          {s.key}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
