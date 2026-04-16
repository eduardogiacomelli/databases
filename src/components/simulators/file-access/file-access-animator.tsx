"use client";

import { useEffect, useRef } from "react";
import { useFileAccess } from "./file-access-store";
import { BlockGrid } from "./block-grid";
import { BinarySearchViz } from "./binary-search-viz";
import { TimeComparison } from "./time-comparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  ZapIcon,
  GaugeIcon,
} from "lucide-react";

export function FileAccessAnimator() {
  const {
    mode,
    blockCount,
    searchKey,
    speed,
    status,
    steps,
    currentStep,
    setMode,
    setBlockCount,
    setSearchKey,
    setSpeed,
    run,
    advance,
    reset,
  } = useFileAccess();

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === "running" && currentStep >= 0 && currentStep < steps.length - 1) {
      timerRef.current = window.setTimeout(advance, speed);
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }
    if (status === "running" && currentStep === steps.length - 1) {
      timerRef.current = window.setTimeout(() => {
        const last = steps[steps.length - 1];
        useFileAccess.setState({
          status: last?.found ? "found" : "notfound",
        });
      }, speed);
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }
  }, [status, currentStep, steps, speed, advance]);

  const activeStep = currentStep >= 0 ? steps[currentStep] : undefined;
  const reads = currentStep + 1;

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SearchIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading">
                  File Access Animator
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Watch linear scan vs. binary search play out block-by-block.
                </p>
              </div>
            </div>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(v) => v && setMode(v as "linear" | "binary")}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="linear" className="gap-1.5">
                <GaugeIcon className="size-3.5" />
                Linear (heap)
              </ToggleGroupItem>
              <ToggleGroupItem value="binary" className="gap-1.5">
                <ZapIcon className="size-3.5" />
                Binary (ordered)
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Blocks (b)
              </Label>
              <Slider
                value={[blockCount]}
                min={4}
                max={48}
                step={1}
                onValueChange={(v) => setBlockCount(v[0])}
              />
              <div className="text-xs font-mono text-muted-foreground">
                {blockCount} blocks
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Search key (K)
              </Label>
              <Input
                type="number"
                value={searchKey}
                onChange={(e) => setSearchKey(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Speed
              </Label>
              <Slider
                value={[1000 - speed]}
                min={100}
                max={900}
                step={50}
                onValueChange={(v) => setSpeed(1000 - v[0])}
              />
              <div className="text-xs font-mono text-muted-foreground">
                {speed}ms / step
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={run}
              disabled={status === "running"}
              size="sm"
              className="gap-1.5"
            >
              <PlayIcon className="size-3.5" />
              Run search
            </Button>
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <RotateCcwIcon className="size-3.5" />
              Reset
            </Button>
            <div className="ml-auto flex items-center gap-3 text-xs font-mono">
              <span>
                reads ={" "}
                <span className="text-primary font-semibold">
                  {Math.max(0, reads)}
                </span>
              </span>
              <span className="text-muted-foreground">
                steps: {steps.length}
              </span>
            </div>
          </div>

          <BlockGrid />

          {activeStep && (
            <div className="rounded-md border border-border/40 bg-muted/20 px-4 py-2.5 text-xs font-mono text-muted-foreground">
              {activeStep.note}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading">Algorithm</CardTitle>
          </CardHeader>
          <CardContent>
            <BinarySearchViz />
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <TimeComparison />
        </div>
      </div>
    </div>
  );
}
