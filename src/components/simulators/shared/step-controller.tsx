"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SkipForwardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StepControllerProps = {
  step: number;
  totalSteps: number;
  isPlaying: boolean;
  speedMs: number;
  onPrev: () => void;
  onNext: () => void;
  onPlayToggle: () => void;
  onReset: () => void;
  onSkipToEnd?: () => void;
  onSpeedChange: (ms: number) => void;
  className?: string;
  label?: string;
};

export function StepController({
  step,
  totalSteps,
  isPlaying,
  speedMs,
  onPrev,
  onNext,
  onPlayToggle,
  onReset,
  onSkipToEnd,
  onSpeedChange,
  className,
  label,
}: StepControllerProps) {
  const atStart = step <= 0;
  const atEnd = step >= totalSteps - 1;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2",
        className
      )}
    >
      <Button
        size="sm"
        variant="outline"
        onClick={onReset}
        className="gap-1.5"
      >
        <RotateCcwIcon className="size-3.5" />
        Reset
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onPrev}
        disabled={atStart}
        className="size-8 p-0"
        aria-label="Previous step"
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <Button
        size="sm"
        variant={isPlaying ? "secondary" : "default"}
        onClick={onPlayToggle}
        disabled={atEnd && !isPlaying}
        className="gap-1.5"
      >
        {isPlaying ? (
          <>
            <PauseIcon className="size-3.5" /> Pause
          </>
        ) : (
          <>
            <PlayIcon className="size-3.5" /> Play
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onNext}
        disabled={atEnd}
        className="size-8 p-0"
        aria-label="Next step"
      >
        <ChevronRightIcon className="size-4" />
      </Button>
      {onSkipToEnd && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSkipToEnd}
          disabled={atEnd}
          className="size-8 p-0"
          aria-label="Skip to end"
        >
          <SkipForwardIcon className="size-4" />
        </Button>
      )}

      <div className="flex items-center gap-2 ml-2">
        <span className="font-mono text-xs text-muted-foreground">
          {Math.max(0, step + 1)} / {totalSteps}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto min-w-40">
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {speedMs}ms
        </span>
        <Slider
          value={[1200 - speedMs]}
          min={100}
          max={1100}
          step={50}
          onValueChange={(v) => onSpeedChange(1200 - v[0])}
          className="w-28"
          aria-label="Playback speed"
        />
      </div>
      {label && (
        <div className="basis-full mt-1 text-xs font-mono text-muted-foreground">
          {label}
        </div>
      )}
    </div>
  );
}
