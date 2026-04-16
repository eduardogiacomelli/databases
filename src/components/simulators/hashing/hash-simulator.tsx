"use client";

import { useHash } from "./hash-store";
import { BucketViz } from "./bucket-viz";
import { HashControls } from "./hash-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HashIcon } from "lucide-react";

export function HashSimulator() {
  const events = useHash((s) => s.events);
  const buckets = useHash((s) => s.buckets);
  const slotsPerBucket = useHash((s) => s.slotsPerBucket);

  const totalKeys = buckets.reduce((acc, b) => acc + b.slots.length + b.overflow.length, 0);
  const capacity = buckets.length * slotsPerBucket;
  const loadFactor = capacity > 0 ? totalKeys / capacity : 0;
  const overflowCount = buckets.reduce((acc, b) => acc + b.overflow.length, 0);
  const totalProbes = events
    .filter((e) => e.probes > 0)
    .reduce((acc, e) => acc + e.probes, 0);
  const opCount = events.filter((e) => e.probes > 0).length;
  const avgProbes = opCount > 0 ? totalProbes / opCount : 0;

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HashIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading">Hash Simulator</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Insert, look up, and watch how collisions resolve across strategies.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <HashControls />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <Stat label="load α" value={loadFactor.toFixed(2)} />
            <Stat label="keys" value={`${totalKeys} / ${capacity}`} />
            <Stat label="overflow" value={String(overflowCount)} />
            <Stat label="avg probes" value={avgProbes.toFixed(2)} />
          </div>

          <BucketViz />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading">Operation log</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No operations yet. Insert a key or seed random keys to begin.
            </p>
          ) : (
            <ul className="space-y-1 max-h-56 overflow-y-auto font-mono text-[11px]">
              {events
                .slice()
                .reverse()
                .map((e, i) => (
                  <li
                    key={events.length - i}
                    className="flex gap-2 text-muted-foreground"
                  >
                    <span className="text-muted-foreground/50 w-6 text-right shrink-0">
                      {events.length - i}
                    </span>
                    <span
                      className={
                        e.overflowed
                          ? "text-destructive"
                          : e.collided
                          ? "text-amber-500"
                          : "text-foreground"
                      }
                    >
                      {e.note}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
