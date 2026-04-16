"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type StepByStepProps = {
  steps: { title: string; content: React.ReactNode }[];
  className?: string;
};

export function StepByStep({ steps, className }: StepByStepProps) {
  return (
    <motion.ol
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={cn("space-y-4", className)}
    >
      {steps.map((step, i) => (
        <motion.li key={i} variants={fadeInUp} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-xs font-semibold text-primary">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="mt-2 flex-1 w-px bg-border/50" />
            )}
          </div>
          <div className="pb-6 pt-0.5">
            <h4 className="font-heading text-sm font-semibold">{step.title}</h4>
            <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {step.content}
            </div>
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
}
