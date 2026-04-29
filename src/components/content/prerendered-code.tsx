import { cn } from "@/lib/utils";

type PrerenderedCodeProps = {
  html: string;
  title?: string;
  className?: string;
};

/**
 * Client-safe code block. Receives already-highlighted HTML
 * (typically produced by `shiki.codeToHtml` in a server component).
 */
export function PrerenderedCode({
  html,
  title,
  className,
}: PrerenderedCodeProps) {
  return (
    <div
      className={cn(
        "code-block overflow-hidden rounded-lg border border-border/50",
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {title}
          </span>
        </div>
      )}
      <div
        className="[&_.shiki]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
