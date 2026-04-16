"use client";

import { useState } from "react";
import { useHash, type HashFn, type CollisionMethod } from "./hash-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlusIcon, SearchIcon, TrashIcon, DicesIcon, RotateCcwIcon } from "lucide-react";

export function HashControls() {
  const {
    bucketCount,
    slotsPerBucket,
    hashFn,
    collision,
    setBucketCount,
    setSlotsPerBucket,
    setHashFn,
    setCollision,
    insert,
    lookup,
    remove,
    reset,
    seed,
  } = useHash();

  const [value, setValue] = useState<string>("");

  const submit = (op: "insert" | "lookup" | "remove") => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (op === "insert") insert(n);
    if (op === "lookup") lookup(n);
    if (op === "remove") remove(n);
  };

  const randomSeed = () => {
    const count = Math.floor(bucketCount * slotsPerBucket * 0.7);
    const keys = Array.from({ length: count }, () => Math.floor(Math.random() * 900) + 10);
    seed(keys);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Buckets (M)
          </Label>
          <Slider
            value={[bucketCount]}
            min={4}
            max={16}
            step={1}
            onValueChange={(v) => setBucketCount(v[0])}
          />
          <div className="text-xs font-mono text-muted-foreground">{bucketCount} buckets</div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Slots per bucket
          </Label>
          <Slider
            value={[slotsPerBucket]}
            min={1}
            max={4}
            step={1}
            onValueChange={(v) => setSlotsPerBucket(v[0])}
          />
          <div className="text-xs font-mono text-muted-foreground">
            {slotsPerBucket} slot{slotsPerBucket > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Hash function
          </Label>
          <Select value={hashFn} onValueChange={(v) => setHashFn(v as HashFn)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mod">Division · h(k) = k mod M</SelectItem>
              <SelectItem value="mult">Multiplication · ⌊M · frac(k·φ)⌋</SelectItem>
              <SelectItem value="mid-square">Mid-square</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Collision strategy
          </Label>
          <ToggleGroup
            type="single"
            value={collision}
            onValueChange={(v) => v && setCollision(v as CollisionMethod)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <ToggleGroupItem value="chaining" className="flex-1 text-xs">
              Chaining
            </ToggleGroupItem>
            <ToggleGroupItem value="linear-probing" className="flex-1 text-xs">
              Linear probe
            </ToggleGroupItem>
            <ToggleGroupItem value="double-hashing" className="flex-1 text-xs">
              Double
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Key
        </Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 42"
            className="font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit("insert");
            }}
          />
          <Button onClick={() => submit("insert")} size="sm" className="gap-1.5">
            <PlusIcon className="size-3.5" />
            Insert
          </Button>
          <Button onClick={() => submit("lookup")} size="sm" variant="outline" className="gap-1.5">
            <SearchIcon className="size-3.5" />
            Lookup
          </Button>
          <Button onClick={() => submit("remove")} size="sm" variant="outline" className="gap-1.5">
            <TrashIcon className="size-3.5" />
            Remove
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={randomSeed} size="sm" variant="secondary" className="gap-1.5">
          <DicesIcon className="size-3.5" />
          Seed random keys
        </Button>
        <Button onClick={reset} size="sm" variant="ghost" className="gap-1.5">
          <RotateCcwIcon className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
