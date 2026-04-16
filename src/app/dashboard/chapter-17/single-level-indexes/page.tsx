import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { CodeBlock } from "@/components/content/code-block";
import { LayersIcon, FileTextIcon, KeyIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §1"
        title="Single-Level Ordered Indexes"
        description="An index is just a second file — small, ordered, and searched with the same tools (linear scan, binary search) we already know. The trick is that this file is so much smaller than the data file that log₂ of it costs almost nothing."
        icon={<LayersIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">What an index really is</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every ordered index, regardless of type, is a file of entries
          shaped like:
        </p>
        <div className="rounded-lg border border-border/50 bg-card/60 p-5 text-center">
          <code className="font-mono text-sm">
            ⟨ indexing-field-value , pointer(s) ⟩
          </code>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Because each entry is only two things — a short value and a short
          pointer — index entries are <strong>much</strong> smaller than
          data records. And because the index file is sorted on the indexing
          field, we can binary search it.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">The three classical types</SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<KeyIcon />} title="Primary">
            On the ordering key of the data file. Sparse: one entry per data
            block. Only one primary index per file.
          </ConceptCard>
          <ConceptCard icon={<LayersIcon />} title="Clustering">
            On the ordering field when it is not a key. Sparse: one entry per
            distinct value. One per file.
          </ConceptCard>
          <ConceptCard icon={<FileTextIcon />} title="Secondary">
            On any non-ordering field. Dense: one entry per record. Many per
            file — the workhorse.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Cost model</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let the index have <MathInline expression="b_i" /> blocks. Any
          search that can use the index pays:
        </p>
        <FormulaCard
          label="Equality search via single-level index"
          expression="\\lceil \\log_2 b_i \\rceil + (\\text{follow pointer to data})"
          description="Binary search the index, then one block read to the data file. Usually far fewer I/Os than binary search on the data file itself."
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          That&apos;s the entire idea in one line. The rest of this chapter
          fleshes out the details — sparsity, which fields qualify, how to
          make the index itself searchable without binary search — but every
          variation is a refinement of this formula.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">In PostgreSQL</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          PostgreSQL does not expose the distinction between primary,
          clustering and secondary in its DDL — they are all just{" "}
          <code className="font-mono text-xs">CREATE INDEX</code>. The
          planner chooses between index scans and sequential scans based on
          statistics, and the physical ordering of rows in the heap is
          controlled by the <code className="font-mono text-xs">CLUSTER</code>{" "}
          command (one-time) or by periodic <code className="font-mono text-xs">VACUUM FULL</code>.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- A plain B-tree index (the default). This plays the role of a
-- secondary index unless the column happens to be the natural
-- clustering order.
CREATE INDEX employees_email_idx ON employees (email);

-- Make the heap physically follow one index. This is what turns
-- a secondary-looking index into the clustering order.
CLUSTER employees USING employees_dept_idx;`}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="Why introduce the single-level version first">
        In practice, no production system uses single-level indexes — they
        graduate to multi-level B+ trees. But the cost analysis of
        single-level indexes is the direct ancestor of the B+ tree cost
        analysis, and without it the tree version looks like magic. Master
        this first.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
