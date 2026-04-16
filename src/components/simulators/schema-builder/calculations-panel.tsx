"use client";

import { useSchemaBuilder, useSchemaMetrics } from "./schema-builder-store";
import { BLOCK_SIZES, type BlockSize } from "@/lib/pg-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathBlock } from "@/components/content/math-block";
import {
  DatabaseIcon,
  BoxesIcon,
  TrashIcon,
  SearchIcon,
  ZapIcon,
  GaugeIcon,
  type LucideIcon,
} from "lucide-react";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`border-border/50 ${
        accent ? "border-primary/30 bg-primary/[0.03]" : ""
      }`}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
            accent
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </div>
          <div className="font-mono text-lg font-semibold truncate">
            {value}
          </div>
          {hint && (
            <div className="text-[11px] text-muted-foreground font-mono truncate">
              {hint}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CalculationsPanel() {
  const blockSize = useSchemaBuilder((s) => s.blockSize);
  const setBlockSize = useSchemaBuilder((s) => s.setBlockSize);
  const recordCount = useSchemaBuilder((s) => s.recordCount);
  const setRecordCount = useSchemaBuilder((s) => s.setRecordCount);

  const m = useSchemaMetrics();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Block size (B)
          </Label>
          <Select
            value={String(blockSize)}
            onValueChange={(v) => setBlockSize(Number(v) as BlockSize)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  <span className="font-mono">{s} bytes</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Record count (r)
          </Label>
          <Input
            type="number"
            min={1}
            value={recordCount}
            onChange={(e) => setRecordCount(Number(e.target.value))}
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          icon={DatabaseIcon}
          label="Record size (R)"
          value={`${m.recordSize} B`}
          hint="sum of column sizes"
        />
        <Metric
          icon={BoxesIcon}
          label="Blocking factor"
          value={m.bfr.toString()}
          hint={`⌊${blockSize} / ${m.recordSize || "·"}⌋`}
          accent
        />
        <Metric
          icon={BoxesIcon}
          label="Total blocks (b)"
          value={m.blocks.toLocaleString()}
          hint={`⌈${recordCount.toLocaleString()} / ${m.bfr || "·"}⌉`}
        />
        <Metric
          icon={TrashIcon}
          label="Wasted per block"
          value={`${m.wasted} B`}
          hint={`${((m.wasted / blockSize) * 100).toFixed(1)}% of block`}
        />
        <Metric
          icon={GaugeIcon}
          label="Storage efficiency"
          value={`${m.efficiency.toFixed(1)}%`}
          hint={`${formatBytes(m.usefulBytes)} of ${formatBytes(m.totalBytes)}`}
        />
        <Metric
          icon={DatabaseIcon}
          label="File size on disk"
          value={formatBytes(m.totalBytes)}
          hint={`${m.blocks.toLocaleString()} blocks`}
        />
        <Metric
          icon={SearchIcon}
          label="Linear search avg"
          value={`${Math.ceil(m.linearAvg).toLocaleString()} reads`}
          hint="heap: b/2 block reads"
        />
        <Metric
          icon={ZapIcon}
          label="Binary search"
          value={`${m.binaryReads} reads`}
          hint="ordered: ⌈log₂ b⌉"
          accent
        />
      </div>

      <Card className="border-border/50 bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            The math, in one place
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MathBlock
            expression={`\\begin{aligned}
            R &= ${m.recordSize} \\;\\text{bytes} \\\\
            \\text{bfr} &= \\left\\lfloor \\tfrac{B}{R} \\right\\rfloor = \\left\\lfloor \\tfrac{${blockSize}}{${m.recordSize || 1}} \\right\\rfloor = ${m.bfr} \\\\
            b &= \\left\\lceil \\tfrac{r}{\\text{bfr}} \\right\\rceil = \\left\\lceil \\tfrac{${recordCount}}{${m.bfr || 1}} \\right\\rceil = ${m.blocks}
            \\end{aligned}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
