"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavContext } from "@/lib/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export function PageNavigation() {
  const pathname = usePathname();
  const { prev, next } = getNavContext(pathname);

  if (!prev && !next) return null;

  return (
    <nav className="mt-12 flex items-stretch gap-4 border-t border-border/40 pt-6">
      {prev ? (
        <Link
          href={prev.url}
          className="group flex flex-1 flex-col items-start gap-1.5 rounded-lg border border-border/50 p-4 text-sm transition-colors hover:border-border hover:bg-muted/30"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeftIcon className="size-3 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </span>
          <span className="font-heading font-medium">{prev.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={next.url}
          className="group flex flex-1 flex-col items-end gap-1.5 rounded-lg border border-border/50 p-4 text-right text-sm transition-colors hover:border-border hover:bg-muted/30"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Next
            <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="font-heading font-medium">{next.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
