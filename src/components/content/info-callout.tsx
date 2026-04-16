import { cn } from "@/lib/utils";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  InfoIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  BookOpenIcon,
  type LucideIcon,
} from "lucide-react";

const variants: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  info: {
    icon: InfoIcon,
    className: "border-primary/30 bg-primary/[0.03] [&>svg]:text-primary",
  },
  warning: {
    icon: AlertTriangleIcon,
    className:
      "border-yellow-500/30 bg-yellow-500/[0.03] [&>svg]:text-yellow-500",
  },
  tip: {
    icon: LightbulbIcon,
    className:
      "border-emerald-500/30 bg-emerald-500/[0.03] [&>svg]:text-emerald-500",
  },
  example: {
    icon: BookOpenIcon,
    className: "border-border/50 bg-muted/30 [&>svg]:text-muted-foreground",
  },
};

type InfoCalloutProps = {
  variant?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function InfoCallout({
  variant = "info",
  title,
  children,
  className,
}: InfoCalloutProps) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className="size-4" />
      {title && <AlertTitle className="font-heading">{title}</AlertTitle>}
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </Alert>
  );
}
