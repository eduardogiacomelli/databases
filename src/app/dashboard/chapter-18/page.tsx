import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { navigation } from "@/lib/navigation";
import {
  CogIcon,
  ArrowRightIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chapter = navigation.find((g) => g.url === "/dashboard/chapter-18")!;

export default function Chapter18Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 18"
        title="Strategies for Query Processing"
        description="How a SQL string becomes a sequence of physical algorithms. Parse, translate, sort, select, join, pipeline — the execution engine's playbook with the I/O cost behind every move."
        icon={<CogIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The execution pipeline</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Chapter 18 answers a single question: given a SQL query, what physical
          algorithms does the DBMS use to execute each operation, and what does
          each one cost in block I/Os? This chapter is the bridge from the
          logical operators you know (σ, π, ⋈) to the concrete algorithms the
          engine actually runs — nested loops, sort-merge, hash partition —
          each with its own cost formula and sweet spot.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Start reading</SectionHeading>
        <div className="grid gap-2">
          {chapter.items.map((item, i) => (
            <Link
              key={item.url}
              href={item.url}
              className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/40 px-4 py-3 text-sm transition-colors hover:border-border hover:bg-card"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.icon && (
                  <item.icon className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium">{item.title}</span>
                {item.isSimulator && (
                  <Badge
                    variant="secondary"
                    className="gap-0.5 px-1.5 py-0 text-[10px]"
                  >
                    <ZapIcon className="size-2.5" />
                    Simulator
                  </Badge>
                )}
              </span>
              <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </AnimatedSection>

      <InfoCallout variant="tip" title="Scaffolding in place">
        These pages exist as placeholders so the sidebar and breadcrumb navigation
        resolve correctly. Content and simulators land page by page; the JOIN
        Algorithms simulator is the crown jewel and will be built first.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
