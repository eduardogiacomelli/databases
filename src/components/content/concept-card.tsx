import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

type ConceptCardProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "highlight";
};

export function ConceptCard({
  icon,
  title,
  children,
  className,
  variant = "default",
}: ConceptCardProps) {
  return (
    <Card
      className={cn(
        "border-border/50 transition-colors hover:border-border",
        variant === "highlight" && "border-primary/30 bg-primary/[0.02]",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 font-heading text-base">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-md [&>svg]:size-4",
              variant === "default" && "bg-muted text-muted-foreground",
              variant === "highlight" && "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
