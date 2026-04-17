import {
  SearchIcon,
  ZapIcon,
  TreePineIcon,
  HashIcon,
  FilterIcon,
} from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { ComparisonTable } from "@/components/content/comparison-table";
import { CodeBlock } from "@/components/content/code-block";
import { MathInline } from "@/components/content/math-block";
import { SelectStrategyComparator } from "@/components/simulators/select-algorithms/select-strategy-comparator";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 18 · §3"
        title="Algorithms for SELECT"
        description="Nine textbook strategies (S1–S9) the engine can use to evaluate σ — linear scan, binary search, index lookups of five flavors, and three tricks for conjunctive predicates."
        icon={<SearchIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Nine strategies, one goal</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          A <strong>SELECT</strong> (σ) in the physical plan is any node that
          filters tuples by a predicate. The engine picks one of nine classic
          strategies depending on three things: the <em>shape of the predicate</em>{" "}
          (equality on a key, range, conjunction), the <em>physical layout</em>{" "}
          (ordered file, heap, hash file), and the <em>indexes available</em>.
          Each strategy has an exact block-I/O formula, and the whole art of
          the optimizer is knowing which one fits the situation.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<ZapIcon />} title="Linear &amp; binary">
            S1 (linear) always works; S2 (binary) works only if the file is
            physically sorted on the search attribute. Both are baselines the
            optimizer will beat whenever it can.
          </ConceptCard>
          <ConceptCard icon={<TreePineIcon />} title="Index lookups">
            S3–S6 cover the common cases: primary index equality (S3a) or
            range (S4), hash equality (S3b), clustering index (S5), secondary
            B+ on key (S6a) or non-key (S6b).
          </ConceptCard>
          <ConceptCard icon={<FilterIcon />} title="Conjunctions">
            S7–S9 handle <code className="font-mono text-xs">AND</code> of
            multiple predicates — pick one index and filter, use a composite
            index, or intersect RID sets (bitmap-AND).
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">The full table</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Every row below is a strategy with its exact I/O cost. Notation:{" "}
          <MathInline expression="b" /> file blocks,{" "}
          <MathInline expression="h_i" /> index levels,{" "}
          <MathInline expression="s" /> matching records,{" "}
          <MathInline expression="\text{bfr}" /> records per block.
        </p>
        <ComparisonTable
          headers={["Code", "Method", "Applies to", "I/O cost"]}
          rows={[
            [
              <Badge key="1" variant="secondary" className="font-mono">S1</Badge>,
              "Linear search",
              "Any condition — baseline",
              <MathInline key="c1" expression="b \text{ (worst)},\; b/2 \text{ (avg, key eq)}" />,
            ],
            [
              <Badge key="2" variant="secondary" className="font-mono">S2</Badge>,
              "Binary search",
              "Equality on physically ordered file",
              <MathInline key="c2" expression="\lceil \log_2 b \rceil" />,
            ],
            [
              <Badge key="3a" variant="secondary" className="font-mono">S3a</Badge>,
              "Primary index · equality",
              "Equality on primary key",
              <MathInline key="c3a" expression="h_i + 1" />,
            ],
            [
              <Badge key="3b" variant="secondary" className="font-mono">S3b</Badge>,
              "Hash file · equality",
              "Equality on hash key",
              <MathInline key="c3b" expression="1 \text{ (no overflow)}" />,
            ],
            [
              <Badge key="4" variant="secondary" className="font-mono">S4</Badge>,
              "Primary index · range",
              "Range on ordering key",
              <MathInline key="c4" expression="h_i + \lceil b/2 \rceil \text{ (worst)}" />,
            ],
            [
              <Badge key="5" variant="secondary" className="font-mono">S5</Badge>,
              "Clustering index · equality",
              "Equality on clustering non-key",
              <MathInline key="c5" expression="h_i + \lceil s/\text{bfr} \rceil" />,
            ],
            [
              <Badge key="6a" variant="secondary" className="font-mono">S6a</Badge>,
              "Secondary B+ · equality (key)",
              "Equality on non-ordering key",
              <MathInline key="c6a" expression="h_i + 1" />,
            ],
            [
              <Badge key="6b" variant="secondary" className="font-mono">S6b</Badge>,
              "Secondary B+ · equality (non-key)",
              "Equality on non-ordering, non-key",
              <MathInline key="c6b" expression="h_i + s" />,
            ],
            [
              <Badge key="7" variant="secondary" className="font-mono">S7</Badge>,
              "Conjunction · best-index + filter",
              "AND of conditions; at least one indexed",
              <span key="c7">cost(most-selective index) + CPU filter</span>,
            ],
            [
              <Badge key="8" variant="secondary" className="font-mono">S8</Badge>,
              "Conjunction · composite index",
              "AND matches a composite key",
              <MathInline key="c8" expression="h_i + 1" />,
            ],
            [
              <Badge key="9" variant="secondary" className="font-mono">S9</Badge>,
              "Conjunction · RID intersection",
              "AND with multiple single-col indexes",
              <MathInline key="c9" expression="2 h_i + s" />,
            ],
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Interactive comparator</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Choose a predicate, toggle the indexes you have, and pick up to three
          strategies to race side-by-side. The block grid shows which blocks
          each strategy reads; the formula panel plugs in your numbers so you
          can see why one wins.
        </p>
        <SelectStrategyComparator />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Conjunctions: the tricky one</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          <strong>S7</strong> (&ldquo;best index + filter&rdquo;) is the
          default every real optimizer falls back to: find the single
          most-selective condition that has an index, retrieve the matching
          rows via that index, check the other conditions in memory. It
          never double-reads blocks — the runner-up conditions cost nothing
          extra in I/O, just CPU.
        </p>
        <InfoCallout variant="tip" title="When S9 beats S7">
          S9 (intersect RID sets, aka <em>bitmap-AND</em>) is better whenever{" "}
          <em>two</em> conditions are each moderately selective but neither is
          highly selective. Two index scans are cheap; intersecting their
          bitmaps eliminates most tuples before a single data block is read.
          PostgreSQL calls this a <code className="font-mono text-xs">BitmapAnd</code> node.
        </InfoCallout>
        <InfoCallout variant="warning" title="OR is harder">
          Disjunctions are brutal: a single unindexed disjunct forces a full
          scan of the whole relation because even one unindexed clause can
          qualify tuples the optimizer has no way to find via indexes. When
          every disjunct has an index, a <em>BitmapOr</em> can union the RID
          sets — analogous to S9 but with ∪ instead of ∩.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">PostgreSQL mappings</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Every row in the table above maps to a plan node you&apos;ve seen
          in <code className="font-mono text-xs">EXPLAIN</code>:
        </p>
        <ComparisonTable
          headers={["Textbook strategy", "Postgres plan node"]}
          rows={[
            ["S1 linear", "Seq Scan"],
            ["S3a / S6a equality lookup", "Index Scan"],
            ["S3b hash lookup", "Bitmap Heap Scan via Hash Index"],
            ["S4 index range", "Index Scan with range predicate"],
            ["S5 clustering index", "Index Scan on a CLUSTER-ed table"],
            [
              "S6b scattered match",
              <HashIcon key="h" className="inline size-3.5" />,
            ],
            ["S7 best index + filter", "Index Scan + Filter"],
            ["S9 intersect RIDs", "BitmapAnd of multiple Bitmap Index Scans"],
          ]}
        />
        <CodeBlock
          lang="sql"
          title="psql — see each strategy in action"
          code={`-- S3a / S6a: primary/secondary equality
EXPLAIN ANALYZE SELECT * FROM employee WHERE ssn = '123456789';
-- → Index Scan using employee_pkey ... (1 row)

-- S4 / S6 range: depends on selectivity
EXPLAIN ANALYZE SELECT * FROM employee WHERE salary > 50000;
-- many rows → Seq Scan + Filter;  few rows → Index Scan

-- S9: intersect two index scans
EXPLAIN ANALYZE
SELECT * FROM employee
WHERE dno = 5 AND salary BETWEEN 40000 AND 60000;
-- → BitmapAnd
--      Bitmap Index Scan on idx_employee_dno
--      Bitmap Index Scan on idx_employee_salary`}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="What to take away">
        Every SELECT the engine runs is one of these nine strategies. The
        choice is dictated by the predicate shape and the available access
        paths — the optimizer&apos;s job is to pick the cheapest applicable
        one. When you read EXPLAIN output, you&apos;re literally reading which
        of S1–S9 was chosen.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
