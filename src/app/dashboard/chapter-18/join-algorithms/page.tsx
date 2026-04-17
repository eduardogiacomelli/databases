import {
  ShuffleIcon,
  RepeatIcon,
  TreePineIcon,
  ArrowDownUpIcon,
  HashIcon,
} from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { ComparisonTable } from "@/components/content/comparison-table";
import { MathInline } from "@/components/content/math-block";
import { FormulaCard } from "@/components/content/formula-card";
import { StepByStep } from "@/components/content/step-by-step";
import { JoinAnimator } from "@/components/simulators/join-algorithms/join-animator";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 18 · §4"
        title="Algorithms for JOIN"
        description="Block nested-loop (J2), index nested-loop (J3), sort-merge (J4), and hash (J5) — the four workhorse join algorithms with their exact I/O costs and when each one wins."
        icon={<ShuffleIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Four algorithms, one operator</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          <MathInline expression="R \bowtie_{R.A = S.B} S" /> is the most
          important physical operator in the engine — and the most expensive
          one to run wrong. Four algorithms cover almost every real-world case.
          The optimizer chooses between them by estimating their costs (the
          catalog stats we covered in §17 come back here) and by checking the
          preconditions each one needs.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<RepeatIcon />} title="J2 · Block nested-loop">
            The universal fallback. Uses <MathInline expression="n_B - 2" />{" "}
            frames for the outer, one for the inner probe, one for output.
            Cost: <MathInline expression="b_R + \lceil b_R/(n_B-2)\rceil \cdot b_S" />.
          </ConceptCard>
          <ConceptCard icon={<TreePineIcon />} title="J3 · Index nested-loop">
            If an index exists on the inner&apos;s join attribute, look up each
            outer tuple directly. Cost: <MathInline expression="b_R + |R|(h_i + 1)" />.
          </ConceptCard>
          <ConceptCard icon={<ArrowDownUpIcon />} title="J4 · Sort-merge">
            Sort both on the join attribute, then walk them in lockstep. Cost:
            sort(R) + sort(S) + <MathInline expression="b_R + b_S" /> for the
            merge pass.
          </ConceptCard>
          <ConceptCard icon={<HashIcon />} title="J5 · Hash join">
            Partition both on <MathInline expression="h(\text{joinKey})" />,
            probe bucket-by-bucket. Cost: <MathInline expression="3(b_R + b_S)" />.
            Equi-joins only.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Cost summary</SectionHeading>
        <ComparisonTable
          headers={["Algo", "Formula", "Preconditions", "Typical winner when"]}
          rows={[
            [
              <Badge key="j2" variant="secondary" className="font-mono">J2</Badge>,
              <MathInline key="fj2" expression="b_R + \lceil b_R/(n_B-2)\rceil \cdot b_S" />,
              "none",
              "Outer is tiny (fits in 1 chunk) or nB is generous.",
            ],
            [
              <Badge key="j3" variant="secondary" className="font-mono">J3</Badge>,
              <MathInline key="fj3" expression="b_R + |R|(h_i + 1)" />,
              "Index on S's join attribute",
              "R is small and S is large with a tight index.",
            ],
            [
              <Badge key="j4" variant="secondary" className="font-mono">J4</Badge>,
              <MathInline key="fj4" expression="\text{sort}(R) + \text{sort}(S) + b_R + b_S" />,
              "Enough buffers to sort both",
              "Both relations are big and downstream wants sorted output.",
            ],
            [
              <Badge key="j5" variant="secondary" className="font-mono">J5</Badge>,
              <MathInline key="fj5" expression="3(b_R + b_S)" />,
              "Equi-join; build side fits per bucket",
              "Equi-join on unindexed columns; memory is plentiful.",
            ],
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Interactive animator</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Configure two relations, pick a buffer size, and switch between
          algorithms. Every configuration change recalculates all four costs;
          the tab you&apos;re on runs the animation of that algorithm on the
          same data. Watch how J5 wins when there&apos;s memory and J4 wins when
          there isn&apos;t.
        </p>
        <JoinAnimator />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Block nested-loop in detail</SectionHeading>
        <StepByStep
          steps={[
            {
              title: "Fill the outer buffer",
              content: (
                <>
                  Load <MathInline expression="n_B - 2" /> blocks of R into the
                  outer buffer. One frame is reserved for the current S block,
                  one for the output block.
                </>
              ),
            },
            {
              title: "Scan S from start to end",
              content:
                "Read S block-by-block. For each S block, compare every tuple against every tuple in the outer chunk. Matches flow to the output buffer.",
            },
            {
              title: "Advance the outer chunk",
              content:
                "When S is fully scanned, move on to the next nB−2 blocks of R and scan S again. Repeat until all of R is done.",
            },
            {
              title: "Critical: the smaller relation is the outer",
              content: (
                <>
                  The cost is linear in <MathInline expression="b_R" /> (outer)
                  and roughly quadratic via{" "}
                  <MathInline expression="\lceil b_R/(n_B-2)\rceil \cdot b_S" />.
                  Put the smaller one on the outside and the chunk count drops.
                </>
              ),
            },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormulaCard
            label="Block NL cost"
            expression="b_R + \left\lceil \dfrac{b_R}{n_B - 2} \right\rceil \cdot b_S"
            description="R read once. S read once per outer chunk."
          />
          <FormulaCard
            label="Swap the outer"
            expression="\min\Big(b_R + \lceil b_R/(n_B-2)\rceil b_S,\; b_S + \lceil b_S/(n_B-2)\rceil b_R\Big)"
            description="Always check both orderings — the optimizer does."
          />
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Hash join in detail</SectionHeading>
        <StepByStep
          steps={[
            {
              title: "Pick a hash function and partition count",
              content: (
                <>
                  Choose <MathInline expression="M \approx \lceil b_R / n_B \rceil" />{" "}
                  buckets so each build partition fits in memory. Hash both
                  relations on the join attribute into <MathInline expression="M" />{" "}
                  on-disk buckets.
                </>
              ),
            },
            {
              title: "Partition phase",
              content: (
                <>
                  Scan R, write its tuples into the matching bucket (one
                  in-memory output block per bucket). Repeat for S. Cost:{" "}
                  <MathInline expression="2(b_R + b_S)" /> transfers.
                </>
              ),
            },
            {
              title: "Probe phase",
              content: (
                <>
                  For each bucket <em>i</em>: load R-bucket into an in-memory
                  hash table, scan S-bucket while probing. Matches flow to
                  output. Cost: <MathInline expression="b_R + b_S" />.
                </>
              ),
            },
            {
              title: "Total: 3 × (bR + bS)",
              content:
                "Each block read once in partition, written once in partition, read once in probe. No quadratic term — that's the appeal.",
            },
          ]}
        />
        <InfoCallout variant="warning" title="When a build partition overflows">
          If a single R-bucket doesn&apos;t fit in memory, the classic trick is{" "}
          <em>Grace hash join</em>: recursively partition that bucket with a
          second hash function. Each level costs an extra{" "}
          <MathInline expression="2 b" />. Postgres and many others use{" "}
          <em>hybrid hash join</em>, which keeps one partition purely in memory
          from the start when there&apos;s enough RAM.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">PostgreSQL: force each strategy</SectionHeading>
        <CodeBlock
          lang="sql"
          title="psql — force each join strategy"
          code={`-- Default: Postgres picks whichever is cheapest
EXPLAIN ANALYZE
SELECT e.name, d.dname
FROM employee e JOIN department d ON e.dno = d.dnumber;
-- → Hash Join (usually)

-- Turn off hash and merge → Nested Loop
SET enable_hashjoin = off;
SET enable_mergejoin = off;
EXPLAIN ANALYZE
SELECT e.name, d.dname
FROM employee e JOIN department d ON e.dno = d.dnumber;
-- → Nested Loop + Seq Scan (or Index Scan if indexed)

-- Only allow merge
RESET ALL;
SET enable_hashjoin = off;
SET enable_nestloop = off;
EXPLAIN ANALYZE ...;
-- → Merge Join  (Postgres sorts both sides if needed)

-- See each side's sort cost spelled out in the plan
RESET ALL;
SET enable_hashjoin = off;
SET work_mem = '64kB';  -- force external sort
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...;
-- Merge Join → Sort → external merge ...`}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="What to take away">
        Four algorithms, four cost profiles. J5 is usually the best default
        for equi-joins with plenty of memory; J4 is the champion when
        downstream operators also need sorted order; J2 with the right outer
        is surprisingly competitive for small joins; J3 only shines when the
        inner index is very tight.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
