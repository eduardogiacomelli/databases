import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { navigation } from "@/lib/navigation";
import { SparklesIcon, ArrowRightIcon, ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chapter = navigation.find((g) => g.url === "/dashboard/chapter-19")!;

export default function Chapter19Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 19"
        title="Query Optimization"
        description="Given many possible execution strategies, how does the optimizer pick the best one? Heuristic rule-based tree transformations, cost estimation from catalog statistics, and dynamic programming for join ordering."
        icon={<SparklesIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Heuristics meet cost models</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Chapter 18 showed <em>how</em> each operator can be executed. Chapter
          19 answers <em>which</em> plan to pick when many are legal. Two
          complementary approaches: heuristic rules transform the query tree
          into a shape that is usually cheap, and cost-based optimization
          estimates the I/Os for each candidate plan using catalog statistics,
          picking the cheapest. The interesting cases are when the heuristic
          rule is wrong — for example, when pushing a selection below a join
          would cost <em>more</em> than leaving it above, because a selective
          peer relation already restricts the intermediate via an index-nested
          loop. The worked examples at the end of this chapter are exactly
          those cases.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Start reading</SectionHeading>
        <div className="grid gap-2">
          {chapter.items.map((item, i) => (
            <Link
              key={item.url}
              href={item.url}
              className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/40 px-4 py-3 transition-colors hover:border-border hover:bg-card"
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

      <InfoCallout variant="tip" title="The worked examples already exist">
        The three Worked Example pages (originally under the
        <code className="mx-1 font-mono text-xs">/otimizacao-fisica</code> paths)
        are the real payoff of this chapter — they show concrete query plans
        with the non-obvious σ placement that motivates the whole cost-based
        story. Read the conceptual sections first, then study the examples.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
