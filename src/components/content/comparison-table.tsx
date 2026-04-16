import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ComparisonTableProps = {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  caption?: string;
  className?: string;
};

export function ComparisonTable({
  headers,
  rows,
  caption,
  className,
}: ComparisonTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border/50",
        className
      )}
    >
      <Table>
        {caption && (
          <caption className="mt-2 mb-3 text-xs text-muted-foreground">
            {caption}
          </caption>
        )}
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            {headers.map((header) => (
              <TableHead
                key={header}
                className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} className="border-border/30">
              {row.map((cell, j) => (
                <TableCell key={j} className="text-sm">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
