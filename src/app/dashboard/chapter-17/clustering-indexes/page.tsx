import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { CodeBlock } from "@/components/content/code-block";
import { Grid3x3Icon, LayersIcon, BoxesIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §3"
        title="Clustering Indexes"
        description="When the file is ordered on a non-key field, records with equal values clump together in blocks. A clustering index gives us the first block of each clump — the same sparsity as a primary index, with a different anchor rule."
        icon={<Grid3x3Icon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The non-key ordering case</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Suppose the <code className="font-mono text-xs">employees</code>{" "}
          table is physically ordered on <code className="font-mono text-xs">dept_id</code>
          (not unique). All employees of department 7 sit in contiguous
          blocks, followed by all of department 8, and so on. The{" "}
          <strong>clustering index</strong> has one entry per{" "}
          <em>distinct value</em> of the ordering field:
        </p>
        <div className="rounded-lg border border-border/50 bg-card/60 p-5 text-center">
          <code className="font-mono text-sm">
            ⟨ dept_id , pointer to first block containing dept_id ⟩
          </code>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">How it differs from a primary index</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<LayersIcon />} title="Anchor by value, not by block">
            A primary index has one entry per block (value uniqueness comes
            for free). A clustering index has one entry per distinct value —
            because several consecutive blocks may share the same value.
          </ConceptCard>
          <ConceptCard icon={<BoxesIcon />} title="Still sparse">
            Both are sparse in terms of records. The clustering index may be
            larger than a primary index on the same file if values have few
            duplicates, and smaller if values have many duplicates.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">A worked calculation</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Suppose 30,000 employee records, 68 bytes each, 8192-byte blocks,
          blocking factor 120 → <MathInline expression="b = 250" /> data
          blocks. The company has 50 departments, evenly distributed, so each
          department spans roughly <MathInline expression="250/50 = 5" /> blocks.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Clustering index: 50 entries of 9 bytes = 450 bytes, fitting in{" "}
          <MathInline expression="b_i = 1" /> block.
        </p>
        <FormulaCard
          label="Lookup: find all employees in dept D"
          expression="\\lceil \\log_2 b_i \\rceil + \\left\\lceil \\frac{b}{|D|} \\right\\rceil"
          description="Binary-search the (tiny) index once, then read all blocks in the cluster — that's the sequential-scan tail."
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Total cost: 1 + 5 = 6 block reads for all matching records. A full
          scan of the data file would cost 250.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Maintaining order</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Inserting a new employee requires finding the right cluster and
          slotting in there. As with any ordered file, this is expensive —
          which is why real systems allocate whole blocks or groups of blocks
          per value, and let each group grow its own mini-overflow area.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- PostgreSQL: ask the server to physically order the heap on
-- dept_id, using the B-tree index as the sort key.
CREATE INDEX employees_dept_idx ON employees (dept_id);
CLUSTER employees USING employees_dept_idx;

-- Verify:
SELECT relname, relfilenode FROM pg_class WHERE relname = 'employees';`}
        />
      </AnimatedSection>

      <InfoCallout variant="example" title="Range scans love clustering">
        A query like <code className="font-mono text-xs">WHERE dept_id = 7</code>{" "}
        is the best case: one index read, then sequential reads of a
        handful of contiguous blocks. This is the same access pattern that
        makes B+ tree range scans so cheap — and why the clustering index is
        the conceptual ancestor of the B+ tree&apos;s linked leaves.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
