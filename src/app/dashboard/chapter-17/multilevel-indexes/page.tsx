import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { Card, CardContent } from "@/components/ui/card";
import { FanoutCalculator } from "@/components/simulators/multilevel/fanout-calculator";
import { LayersIcon, ArrowDownIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §6"
        title="Multilevel Indexes"
        description="When the index itself is too large to binary-search efficiently, build an index on the index. Repeat until the top fits in a single block. What you get is the static precursor to the B-tree."
        icon={<LayersIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Fan-out and depth</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The key quantity is the <strong>fan-out</strong>{" "}
          <MathInline expression="f_o" />: how many index entries fit in one
          block. If the base index has <MathInline expression="b_i" />{" "}
          blocks, the level above it — pointing at each base block — needs{" "}
          <MathInline expression="\\lceil b_i / f_o \\rceil" /> blocks. Keep
          going until the top level fits in one block.
        </p>
        <FormulaCard
          label="Multilevel index depth"
          expression="t = \\lceil \\log_{f_o} b_i \\rceil"
          description="Log base fan-out of the first-level index block count."
        />
        <FormulaCard
          label="Equality search"
          expression="t + 1"
          description="t block reads to walk down the levels, plus one data-block read."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Why logs, not log₂</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Binary search cuts the search space in half per read. A multilevel
          index cuts it by the fan-out — a factor of several hundred — per
          read. The difference is the difference between a 20-step and a
          3-step search, on the same data.
        </p>
        <Card className="border-border/50 bg-muted/10">
          <CardContent className="p-6 space-y-3 text-sm">
            <div className="font-mono text-xs text-muted-foreground text-center">
              Example: b<sub>i</sub> = 1,000,000 index blocks, fan-out 200
            </div>
            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5">level 3 · 1 block</span>
              <ArrowDownIcon className="size-3 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5">level 2 · 25 blocks</span>
              <ArrowDownIcon className="size-3 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5">level 1 · 5,000 blocks</span>
              <ArrowDownIcon className="size-3 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span className="rounded bg-muted border border-border/50 px-3 py-1.5">base index · 1,000,000 blocks</span>
            </div>
            <p className="text-center text-xs text-muted-foreground pt-1">
              Total lookup: 3 index reads + 1 data read = 4 block I/Os.
            </p>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">ISAM: the static version</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Classical <strong>ISAM</strong> is a multilevel index frozen at
          build time. Insertions go into per-leaf overflow chains, and a
          periodic reorganization rebuilds the tree. It works, but the
          overflow chains degrade performance between rebuilds, and rebuilds
          require taking the index offline.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The next two sections fix this: <strong>B-trees</strong> keep the
          tree balanced through node splits on every insertion, and{" "}
          <strong>B+ trees</strong> add linked leaves for fast range scans.
          Both are dynamic versions of exactly this multilevel structure.
        </p>
      </AnimatedSection>

      <FanoutCalculator />

      <InfoCallout variant="tip" title="Simulator coming up">
        The B-tree and B+ tree visualizers on the next two pages let you
        watch this tree grow one insertion at a time. The static
        multilevel picture above is the skeleton — the B-tree is that
        skeleton made dynamic.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
