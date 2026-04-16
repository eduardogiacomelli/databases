import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { ComparisonTable } from "@/components/content/comparison-table";
import { HashIcon, GridIcon, FunctionSquareIcon, FilterIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §10"
        title="Other Index Types"
        description="Hash, bitmap, function-based, and partial indexes. Each sacrifices generality for a narrow, very fast access pattern — and each maps to a specific PostgreSQL feature."
        icon={<HashIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Hash indexes</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The tree-free cousin. A hash index stores{" "}
          <code className="font-mono text-xs">⟨h(key), record-ptr⟩</code> and
          answers equality queries in expected O(1). Useless for range scans,
          useless for ordering. In PostgreSQL, hash indexes became crash-safe
          and WAL-logged only in PG 10 — before that they were discouraged.
        </p>
        <ConceptCard icon={<HashIcon />} title="When a hash index wins">
          Pure equality workloads on wide keys (UUIDs, long strings). The
          hash is fixed-size regardless of key length, so hash indexes stay
          small where a B+ tree would bloat.
        </ConceptCard>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Bitmap indexes</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For every distinct value, store a bitmap: one bit per row,
          indicating presence. Intersecting two bitmaps is an AND of two
          bitstrings — measured in nanoseconds even over millions of rows.
        </p>
        <ConceptCard icon={<GridIcon />} title="When bitmaps win">
          Low-cardinality columns (status, gender, country) combined via AND/OR
          in OLAP workloads. PostgreSQL does not offer a persistent bitmap
          index, but it builds one on-the-fly during{" "}
          <code className="font-mono text-xs">Bitmap Index Scan</code> /{" "}
          <code className="font-mono text-xs">BitmapAnd</code> /{" "}
          <code className="font-mono text-xs">BitmapOr</code> plans.
        </ConceptCard>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Function-based (expression) indexes</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The index key is the result of an expression rather than a stored
          column. Queries using the same expression can use the index.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- Case-insensitive search: index on the computed expression
CREATE INDEX employees_email_lower_idx
  ON employees (LOWER(email));

-- Now this query uses the index
SELECT * FROM employees WHERE LOWER(email) = 'ada@example.com';

-- Index on JSON path
CREATE INDEX orders_ship_country_idx
  ON orders ((metadata->>'ship_country'));`}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Partial indexes</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          An index with a{" "}
          <code className="font-mono text-xs">WHERE</code> clause that
          filters which rows are indexed. Perfect when a small slice of rows
          accounts for nearly all queries.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- 95% of queries are for active users — don't waste index space on inactive ones
CREATE INDEX users_email_active_idx
  ON users (email)
  WHERE active = true;

-- Unique constraint that only applies to non-deleted rows
CREATE UNIQUE INDEX users_email_unique
  ON users (email)
  WHERE deleted_at IS NULL;`}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">The PostgreSQL menu</SectionHeading>
        <ComparisonTable
          headers={["USING", "Purpose", "Good at"]}
          rows={[
            ["btree (default)", "Balanced tree, keys sorted", "Point lookups, range scans, ORDER BY"],
            ["hash", "Hash table", "Equality only, wide keys"],
            ["gin", "Generalized Inverted Index", "Arrays, jsonb, full-text (many values per row)"],
            ["gist", "Generalized Search Tree", "Geometric, full-text, exclusion constraints"],
            ["spgist", "Space-partitioned GiST", "Non-balanced data: quadtrees, suffix trees"],
            ["brin", "Block Range Index", "Huge tables with physical correlation (timestamps)"],
          ]}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="Right tool, right workload">
        A <code className="font-mono text-xs">CREATE INDEX ... USING brin</code>{" "}
        on a two-billion-row append-only time-series table can be 1000× smaller
        than the B+ tree equivalent, because it only stores min/max per block
        range. It&apos;s slower for random lookups but nearly free to maintain.
        Match index type to access pattern, not to habit.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
