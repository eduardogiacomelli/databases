import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { SettingsIcon, LayersIcon, RefreshCwIcon, ZapIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §11"
        title="General Indexing Issues"
        description="Once you know which index to build, you still have to decide what it covers, when to rebuild it, and what it costs on writes. This is where a lot of production tuning lives."
        icon={<SettingsIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Covering indexes & index-only scans</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A <strong>covering index</strong> contains every column a query
          needs, so the engine can answer the query without visiting the heap
          at all — an <strong>index-only scan</strong>. PostgreSQL supports
          this via the <code className="font-mono text-xs">INCLUDE</code>{" "}
          clause: payload columns ride along in the leaves but aren&apos;t
          part of the key.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`CREATE INDEX orders_customer_idx
  ON orders (customer_id)
  INCLUDE (order_date, total);

-- This query can now be answered entirely from the index
EXPLAIN
SELECT customer_id, order_date, total
  FROM orders
 WHERE customer_id = 42;
-- -> Index Only Scan using orders_customer_idx`}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Write amplification</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<ZapIcon />} title="Every insert hits every index">
            A row with N indexes costs roughly N+1 B+ tree operations on
            insert. For OLTP tables with 8–10 secondary indexes, writes can
            be 10× slower than an unindexed version.
          </ConceptCard>
          <ConceptCard icon={<RefreshCwIcon />} title="HOT updates help (PG)">
            If an update doesn&apos;t touch indexed columns, PostgreSQL can
            skip index updates via the Heap-Only Tuple optimization. Design
            indexes so hot-path updates avoid them.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Index bloat & maintenance</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          B+ tree nodes can accumulate dead entries under MVCC. PostgreSQL
          reclaims space via <code className="font-mono text-xs">VACUUM</code>,
          but heavy churn still produces bloat that wastes I/O. The remedies:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>
            <code className="font-mono text-xs">REINDEX CONCURRENTLY</code> — rebuild the index online.
          </li>
          <li>
            <code className="font-mono text-xs">pg_repack</code> — community tool for heap + index repack without long locks.
          </li>
          <li>
            Periodic <code className="font-mono text-xs">ANALYZE</code> so the planner has accurate statistics.
          </li>
        </ul>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Concurrent index creation</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A plain <code className="font-mono text-xs">CREATE INDEX</code>{" "}
          takes an <code className="font-mono text-xs">ACCESS EXCLUSIVE</code>{" "}
          lock — no writes, no reads of other tables that reference this one.
          On a production table this means downtime. Use{" "}
          <code className="font-mono text-xs">CREATE INDEX CONCURRENTLY</code>{" "}
          to build without blocking writes, at the cost of two passes through
          the heap.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- Safe for production: non-blocking, but slower and cannot run in a transaction
CREATE INDEX CONCURRENTLY orders_created_at_idx ON orders (created_at);

-- If it fails partway, the index is left in INVALID state
-- Clean up and retry:
DROP INDEX CONCURRENTLY orders_created_at_idx;`}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Storage parameters</SectionHeading>
        <ConceptCard icon={<LayersIcon />} title="Fillfactor">
          Controls how full a leaf page is when initially written. Default is
          90 for B+ trees — the 10% free space absorbs in-place updates (HOT)
          and reduces page splits. Lower it for update-heavy tables, raise it
          for append-only workloads.
        </ConceptCard>
      </AnimatedSection>

      <InfoCallout variant="warning" title="Every index earns its keep or it costs you">
        Unused indexes are pure overhead: disk, RAM (via shared_buffers),
        write amplification, and planner complexity. Run{" "}
        <code className="font-mono text-xs">SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0</code>{" "}
        on a representative workload and drop what nothing uses.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
