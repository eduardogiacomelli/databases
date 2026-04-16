"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathBlock } from "./math-block";
import { CalculatorIcon } from "lucide-react";

type FormulaCardProps = {
  label: string;
  expression: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function FormulaCard({
  label,
  expression,
  description,
  children,
  className,
}: FormulaCardProps) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-heading text-sm font-medium">
          <CalculatorIcon className="size-3.5 text-primary" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MathBlock expression={expression} className="my-0" />
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
