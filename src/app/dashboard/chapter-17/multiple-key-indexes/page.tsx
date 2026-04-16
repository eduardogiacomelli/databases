import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { ComparisonTable } from "@/components/content/comparison-table";
import { Grid3x3Icon, KeyIcon, LayersIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §9"
        title="Multiple-Key Indexes"
        description="Composite indexes on two or more fields. Unlocks efficient multi-predicate lookups, but imposes a leftmost-prefix rule that dictates which queries can use them."
        icon={<Grid3x3Icon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The ordered-pair trick</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A composite index on{" "}
          <code className="font-mono text-xs">(last_name, first_name)</code>{" "}
          is a B+ tree whose keys are ordered pairs, compared
          lexicographically: first by last name, then (for equal last names)
          by first name. This gives efficient access for any{" "}
          <em>leftmost-prefix</em> of the key.
        </p>
        <ComparisonTable
          headers={["Query", "Can use index on (last_name, first_name)?"]}
          rows={[
            ["WHERE last_name = 'Smith'", "Yes — walks the B+ tree to the Smith range"],
            ["WHERE last_name = 'Smith' AND first_name = 'Ada'", "Yes — exact match at the leaf"],
            ["WHERE first_name = 'Ada'", "No — no leftmost prefix; degrades to scan"],
            ["WHERE last_name LIKE 'S%'", "Yes — leftmost-prefix range"],
            ["WHERE last_name = 'Smith' AND first_name LIKE 'A%'", "Yes"],
            ["WHERE last_name LIKE '%mith'", "No — the '%' is leading"],
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Composite vs. two singles</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<LayersIcon />} title="Composite (last, first)">
            One index, small. For predicates on both columns, one descent
            lands on the exact range. Covers last-only queries too.
          </ConceptCard>
          <ConceptCard icon={<KeyIcon />} title="Two separate (last) and (first)">
            Each index is small; the planner can use either. For predicates
            on both columns, it may index-bitmap the intersection — multiple
            scans, then combine. Slower than one composite.
          </ConceptCard>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Rule of thumb: create a composite when queries consistently filter
          on the same column combination in the same order. Otherwise
          separate indexes give the planner flexibility.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Beyond composites: grid files & kd-trees</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          True symmetric multi-key access — where any subset of the indexed
          fields can be queried with equal efficiency — requires different
          structures: <strong>grid files</strong> partition the multi-
          dimensional space into cells, and <strong>kd-trees</strong> recurse
          on alternating dimensions. These are used in spatial databases
          (PostGIS uses R-trees via GiST) rather than general-purpose
          indexing.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">In PostgreSQL</SectionHeading>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- Composite B+ tree
CREATE INDEX emp_name_idx ON employees (last_name, first_name);

-- Column order matters: this is NOT the same index
CREATE INDEX emp_name_rev_idx ON employees (first_name, last_name);

-- INCLUDE columns aren't part of the key but ride along in leaves,
-- enabling index-only scans without bloating the key.
CREATE INDEX emp_lookup_idx
  ON employees (last_name, first_name)
  INCLUDE (email, hire_date);`}
        />
      </AnimatedSection>

      <InfoCallout variant="warning" title="Order your columns by selectivity and predicate shape">
        Put the column that will most often appear with equality predicates
        first. A composite on <code className="font-mono text-xs">(status, created_at)</code>{" "}
        is great for <code className="font-mono text-xs">WHERE status = ? AND created_at &gt; ?</code>;
        reversing the order would make that query scan a large range of
        created_at values.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
