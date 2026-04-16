import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { StepByStep } from "@/components/content/step-by-step";
import { CodeBlock } from "@/components/content/code-block";
import { BookOpenIcon, BarChart3Icon, ClockIcon, GaugeIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §12"
        title="Physical Database Design"
        description="Putting it all together: how to decide, for a real workload, which tables to index, how to order composite keys, what to cluster, and how to measure when you're done."
        icon={<BookOpenIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The four inputs</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <ConceptCard icon={<BarChart3Icon />} title="Workload">
            The mix of SELECT, INSERT, UPDATE, DELETE and their frequencies.
            The only index that matters is one the workload actually uses.
          </ConceptCard>
          <ConceptCard icon={<GaugeIcon />} title="Selectivity">
            What fraction of rows each predicate returns. Low selectivity
            (few rows) favors indexes; high selectivity (most rows) favors
            sequential scans.
          </ConceptCard>
          <ConceptCard icon={<ClockIcon />} title="SLA / latency target">
            Some queries can be slow; others cannot. Pay the write cost of an
            index only where a read is on the critical path.
          </ConceptCard>
          <ConceptCard icon={<BookOpenIcon />} title="Storage budget">
            Indexes can easily exceed the size of the data. Disk, RAM, and
            backup time all scale with index footprint.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">A design workflow</SectionHeading>
        <StepByStep
          steps={[
            {
              title: "Enumerate the hot queries",
              content: "Pull the top 20–50 statements by total time from pg_stat_statements. These account for most of what the database does.",
            },
            {
              title: "Map each to its ideal access path",
              content: "For each query, sketch the index that would let it run as index-only or index+one-heap-read. Note which are already covered.",
            },
            {
              title: "Merge & prune",
              content: "Look for overlaps — a composite (a, b) subsumes a single (a). Drop redundancies. Verify leftmost-prefix eligibility for existing composites.",
            },
            {
              title: "Consider the write side",
              content: "For each candidate index, estimate write amplification. Cut the ones whose read benefit doesn't justify write cost on this workload.",
            },
            {
              title: "Validate with EXPLAIN ANALYZE",
              content: "Create the indexes on a staging copy, run the hot queries, and confirm the planner chose them and the latency dropped.",
            },
            {
              title: "Monitor in production",
              content: "After rollout, watch pg_stat_user_indexes. Drop any index that sees zero scans for a full workload cycle.",
            },
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Default heuristics that almost always apply</SectionHeading>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
          <li>Index every foreign key — it avoids sequential scans when the parent row is updated or deleted.</li>
          <li>Primary keys get a B+ tree automatically; leave it.</li>
          <li>Columns in WHERE clauses with equality predicates → B+ tree.</li>
          <li>Columns in range predicates (BETWEEN, &lt;, &gt;) → B+ tree (possibly composite).</li>
          <li>Columns in ORDER BY paired with a LIMIT → B+ tree with the right direction.</li>
          <li>Low-cardinality columns in analytics queries → consider BRIN or let PG build an on-the-fly bitmap.</li>
          <li>High-selectivity filters over huge rarely-queried slices → partial index.</li>
        </ul>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Inspecting what the planner does</SectionHeading>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- The planner's plan with measured timings
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, email FROM users WHERE email = $1;

-- Who's using which index?
SELECT
  schemaname, relname, indexrelname,
  idx_scan, idx_tup_read, idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Suspected bloat
SELECT * FROM pgstattuple('orders'); -- table
SELECT * FROM pgstatindex('orders_customer_idx'); -- index`}
        />
      </AnimatedSection>

      <InfoCallout variant="example" title="The economist's view">
        An index is an investment: you spend storage, write I/O, and planner
        time forever, in exchange for faster reads. If the read benefit
        doesn&apos;t exceed the sum of write cost + storage cost (valued
        against the SLA), the index is a net loss. Very few teams quantify
        this precisely, but even asking the question aloud when adding an
        index filters out a lot of bad ideas.
      </InfoCallout>

      <InfoCallout variant="tip" title="You've reached the end of Chapter 17">
        That&apos;s the full indexing arc, from primary index to the decision
        matrix that justifies it in production. From here, the useful next
        steps are: (1) the simulators on this site for intuition about tree
        dynamics, and (2) reading the PostgreSQL source for{" "}
        <code className="font-mono text-xs">src/backend/access/nbtree/</code>{" "}
        — the B+ tree implementation is surprisingly readable.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
