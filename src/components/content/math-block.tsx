"use client";

import katex from "katex";
import { cn } from "@/lib/utils";

type MathBlockProps = {
  expression: string;
  className?: string;
};

export function MathBlock({ expression, className }: MathBlockProps) {
  const html = katex.renderToString(expression, {
    displayMode: true,
    throwOnError: false,
    trust: true,
  });

  return (
    <div
      className={cn("katex-display", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type MathInlineProps = {
  expression: string;
  className?: string;
};

export function MathInline({ expression, className }: MathInlineProps) {
  const html = katex.renderToString(expression, {
    displayMode: false,
    throwOnError: false,
    trust: true,
  });

  return (
    <span
      className={cn("katex-inline", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
