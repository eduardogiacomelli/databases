import { cn } from "@/lib/utils";

export function StatPill({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning";
  className?: string;
}) {
  const toneCls: Record<string, string> = {
    default: "bg-muted/20 border-border/40 text-foreground",
    primary: "bg-primary/10 border-primary/30 text-primary",
    success:
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    warning:
      "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  };
  return (
    <div
      className={cn("rounded-md border px-3 py-2", toneCls[tone], className)}
    >
      <div className="text-[10px] uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
