"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

type PageHeaderProps = {
  badge?: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

export function PageHeader({ badge, title, description, icon }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="space-y-4"
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:size-5">
            {icon}
          </div>
        )}
        <div className="space-y-1.5">
          {badge && (
            <Badge variant="outline" className="text-xs">
              {badge}
            </Badge>
          )}
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
      <Separator className="opacity-50" />
    </motion.div>
  );
}
