import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type PgTypeTagProps = {
  name: string;
  bytes?: number;
  className?: string;
};

export function PgTypeTag({ name, bytes, className }: PgTypeTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[11px] font-normal tracking-tight",
        className
      )}
    >
      {name}
      {bytes !== undefined && (
        <span className="ml-1 text-muted-foreground">{bytes}B</span>
      )}
    </Badge>
  );
}
