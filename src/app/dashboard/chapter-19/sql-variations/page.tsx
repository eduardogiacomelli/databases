import {
  TerminalIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  RecycleIcon,
  TableIcon,
  Repeat2Icon,
  WindIcon,
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

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 19 · SQL variations"
        title="Other SQL commands and how their plans differ"
        description="The worked examples in §1 are all SELECT-FROM-WHERE-GROUP-HAVING. This page covers what changes when the statement is INSERT, UPDATE, DELETE, MERGE, a CTE, a recursive query, or carries window functions / DISTINCT / set operations."
        icon={<TerminalIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Why the plans look different</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          A SELECT plan&apos;s job is to <em>find</em> tuples. A modifying
          statement&apos;s plan does that <em>and</em> writes them back —
          which means it has to deal with index maintenance, locks, MVCC
          versioning, triggers, and constraint checks. That extra work shows
          up as new operators in the plan and as additional I/O that pure
          SELECT plans never pay.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">DML — INSERT / UPDATE / DELETE</SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<PlusIcon />} title="INSERT">
            Inserts a tuple per source row. Hash/sort the source if needed,
            then a writer node pushes tuples into the heap and updates every
            secondary index. Cost adds <MathInline expression="\sum_i (h_i + 1)" />{" "}
            per row for index maintenance.
          </ConceptCard>
          <ConceptCard icon={<PencilIcon />} title="UPDATE">
            Driven by the WHERE selection — same access path as the equivalent
            SELECT — followed by an update node. In MVCC engines like Postgres,
            the row is rewritten as a new version; affected indexes get a new
            entry, old versions are marked dead.
          </ConceptCard>
          <ConceptCard icon={<Trash2Icon />} title="DELETE">
            Same SELECT-style access path. The delete node tombstones the
            tuple. Only indexes whose key changes need updating in UPDATE; in
            DELETE every index entry must be removed (or marked).
          </ConceptCard>
        </div>
        <CodeBlock
          lang="sql"
          title="psql — DML plan structure"
          code={`-- INSERT plan: a single Insert node above the source query
EXPLAIN INSERT INTO log_archive
SELECT * FROM logs WHERE created_at < now() - interval '1 year';
-- Insert on log_archive
--   ->  Index Scan using logs_created_at_idx ...
-- (the source SELECT picks the rows, Insert pushes them out)

-- UPDATE plan: source query + Update node
EXPLAIN UPDATE employee SET salary = salary * 1.05
        WHERE dno = 5;
-- Update on employee
--   ->  Index Scan using idx_employee_dno ...
-- Each updated row visits every secondary index too.

-- DELETE plan: same shape, Delete on top
EXPLAIN DELETE FROM session WHERE last_seen < now() - interval '1 day';
-- Delete on session
--   ->  Seq Scan on session  Filter: ...`}
        />
        <InfoCallout variant="warning" title="HOT updates in PostgreSQL">
          When an UPDATE doesn&apos;t touch any indexed column, Postgres can
          do a <em>HOT (heap-only tuple) update</em>: skip index maintenance
          entirely and chain the new version on the same page. This is{" "}
          <em>much</em> cheaper. Verify with{" "}
          <code className="font-mono text-xs">EXPLAIN (ANALYZE, BUFFERS)</code>{" "}
          and the <code className="font-mono text-xs">pg_stat_user_tables</code>{" "}
          view (<code className="text-xs">n_tup_hot_upd</code>).
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">MERGE / UPSERT</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          A MERGE (or <code className="font-mono text-xs">INSERT … ON CONFLICT</code>{" "}
          in Postgres) is essentially a left outer join between the source and
          target, plus a router that sends each row through the right
          branch — INSERT, UPDATE, or DELETE.
        </p>
        <CodeBlock
          lang="sql"
          title="MERGE — plan shape"
          code={`-- INSERT … ON CONFLICT in Postgres
INSERT INTO inventory (sku, qty)
VALUES ('AB-1', 10), ('AB-2', 5)
ON CONFLICT (sku) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty;

-- Plan:
-- Insert on inventory
--   Conflict Resolution: UPDATE
--   Conflict Arbiter Indexes: inventory_sku_key
--   ->  Values Scan on "*VALUES*"`}
        />
        <InfoCallout variant="info" title="Cost shape">
          For each source row: an index lookup on the conflict arbiter (the
          unique-constraint index) plus a write. Asymptotically{" "}
          <MathInline expression="O(|source|\cdot \log|target|)" /> if the
          arbiter is a B+ tree.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">CTEs &amp; recursive queries</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<RecycleIcon />} title="Non-recursive CTE">
            A non-recursive <code className="font-mono text-xs">WITH</code>{" "}
            block compiles to a sub-plan. Modern Postgres (≥12) inlines it by
            default — same plan as if you had written the CTE inline. The old
            optimization fence is gone unless you write{" "}
            <code className="font-mono text-xs">WITH cte AS MATERIALIZED (…)</code>.
          </ConceptCard>
          <ConceptCard icon={<Repeat2Icon />} title="Recursive CTE">
            <code className="font-mono text-xs">WITH RECURSIVE</code>{" "}
            generates a fixed-point loop: evaluate the base case, then repeat
            the recursive case against the working set until empty. Plan node:{" "}
            <em>WorkTable Scan</em>. Cost ≈ depth × per-step query cost.
          </ConceptCard>
        </div>
        <CodeBlock
          lang="sql"
          title="recursive CTE — graph traversal"
          code={`WITH RECURSIVE descendants(id, parent_id, depth) AS (
  SELECT id, parent_id, 0 FROM employee WHERE id = 1
  UNION ALL
  SELECT e.id, e.parent_id, d.depth + 1
  FROM   employee e
  JOIN   descendants d ON e.parent_id = d.id
)
SELECT * FROM descendants;
-- Plan:
-- CTE Scan on descendants
--   CTE descendants
--     ->  Recursive Union
--           ->  Index Scan ... (base case)
--           ->  Hash Join (recursive case)
--                 ->  WorkTable Scan
--                 ->  Seq Scan on employee`}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">DISTINCT and set operations</SectionHeading>
        <ComparisonTable
          headers={["SQL clause", "Algebra", "Algorithm Postgres uses", "Cost shape"]}
          rows={[
            [
              "DISTINCT",
              "δ (duplicate elimination)",
              "HashAggregate or Sort + Unique",
              <MathInline key="d" expression="O(b)" /> ,
            ],
            [
              "UNION",
              "∪ with dedup",
              "Append + HashAggregate",
              <MathInline key="u" expression="O(b_R + b_S)" /> ,
            ],
            [
              "UNION ALL",
              "∪ (bag)",
              "Append (streaming, no dedup)",
              <MathInline key="ua" expression="O(b_R + b_S)" /> ,
            ],
            [
              "INTERSECT",
              "∩",
              "HashSetOp on a UNION ALL",
              <MathInline key="i" expression="O(b_R + b_S)" /> ,
            ],
            [
              "EXCEPT",
              "−",
              "HashSetOp on a UNION ALL",
              <MathInline key="e" expression="O(b_R + b_S)" /> ,
            ],
          ]}
        />
        <InfoCallout variant="tip" title="UNION vs UNION ALL">
          UNION is UNION ALL plus a hash dedup pass. If you know the two sides
          are disjoint, prefer UNION ALL — same correctness, no dedup cost.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Window functions</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Window functions (<code className="font-mono text-xs">ROW_NUMBER()</code>,{" "}
          <code className="font-mono text-xs">SUM() OVER (PARTITION BY…)</code>,
          etc.) compile to a <em>WindowAgg</em> node above a sort that orders
          tuples by <code className="font-mono text-xs">PARTITION BY, ORDER BY</code>.
          Each partition is processed in a single pass.
        </p>
        <CodeBlock
          lang="sql"
          title="WindowAgg plan"
          code={`SELECT  dno, name, salary,
        RANK() OVER (PARTITION BY dno ORDER BY salary DESC) AS r
FROM    employee;

-- Plan:
-- WindowAgg
--   ->  Sort  (Sort Key: dno, salary DESC)
--         ->  Seq Scan on employee
--
-- The cost is dominated by the Sort. If an index already provides the
-- (dno, salary DESC) order, the Sort disappears and WindowAgg streams.`}
        />
        <InfoCallout variant="info" title="Multiple windows">
          Each distinct PARTITION BY/ORDER BY shape adds another{" "}
          <em>WindowAgg</em> node, each with its own preceding sort. Reusing
          the same window via{" "}
          <code className="font-mono text-xs">WINDOW w AS (…)</code> only
          improves readability — it doesn&apos;t collapse plan nodes.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Other shapes worth knowing</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<TableIcon />} title="OUTER JOINs">
            LEFT/RIGHT/FULL OUTER JOINs reuse J2/J4/J5 with a small twist: when
            an outer tuple has no match, the algorithm emits the tuple
            anyway, padded with NULLs. FULL OUTER is naturally sort-merge.
          </ConceptCard>
          <ConceptCard icon={<WindIcon />} title="Lateral joins">
            <code className="font-mono text-xs">LATERAL</code> turns a join
            into a correlated nested-loop where the right side may reference
            the left. The plan is always a Nested Loop with the right side
            re-executed per outer tuple — essentially J1.
          </ConceptCard>
          <ConceptCard icon={<TerminalIcon />} title="LIMIT / OFFSET">
            LIMIT becomes a Limit node that short-circuits the pipeline once
            it has enough rows. With pipelined plans this is very cheap; with
            blocking operators (Sort, HashAggregate) the engine still has to
            finish the blocking step before LIMIT helps.
          </ConceptCard>
          <ConceptCard icon={<TerminalIcon />} title="Prepared statements">
            <code className="font-mono text-xs">PREPARE</code> compiles the
            plan once and caches it. Generic plan vs. custom plan is decided
            per-execute based on the cost gap. Inspect with{" "}
            <code className="font-mono text-xs">EXPLAIN EXECUTE</code>.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <InfoCallout variant="tip" title="What to take away">
        Every non-SELECT statement still has a SELECT-shaped subplan inside —
        the same nine SELECT strategies and four JOIN algorithms apply. The
        differences are the writer operators (Insert/Update/Delete), the loop
        constructs (recursive CTE, lateral), and the duplicate-elimination
        operators (DISTINCT, set operations) you stack on top.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
