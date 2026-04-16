import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { ComparisonTable } from "@/components/content/comparison-table";
import { BarChart3Icon } from "lucide-react";
import { MathInline } from "@/components/content/math-block";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §5"
        title="Index Properties Overview"
        description="A single table that places primary, clustering and secondary indexes on the same axes: sparsity, ordering requirement, uniqueness, and count-per-file."
        icon={<BarChart3Icon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The four axes</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every ordered single-level index can be characterized by four
          yes/no questions. Together they determine cost, use cases, and
          implementation choices.
        </p>
        <ComparisonTable
          headers={[
            "Property",
            "Primary",
            "Clustering",
            "Secondary (key)",
            "Secondary (non-key)",
          ]}
          rows={[
            ["Data file ordered on indexed field", "Yes, by key", "Yes, by non-key", "No", "No"],
            ["Indexed field is a key", "Yes", "No", "Yes", "No"],
            ["Dense or sparse", "Sparse (one per block)", "Sparse (one per distinct value)", "Dense (one per record)", "Dense or block-anchor"],
            ["Count per file", "1", "1", "Many", "Many"],
            ["Size relative to data", "b / bfr", "distinct-values", "r", "r"],
            ["Equality lookup I/Os", "log₂ bᵢ + 1", "log₂ bᵢ + 1", "log₂ bᵢ + 1", "log₂ bᵢ + k"],
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Mental model</SectionHeading>
        <div className="rounded-lg border border-border/50 bg-muted/10 p-5 space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">If the data file is ordered</strong>{" "}
            on the indexed field, we can skip duplicates and only pin down the
            boundaries — sparse index. <strong>Primary</strong> (key-ordered) and{" "}
            <strong>clustering</strong> (non-key ordered) are the two flavors.
          </p>
          <p>
            <strong className="text-foreground">If not</strong>, every record
            must have its own entry, because there is no sorted run to walk —
            dense index. That&apos;s every <strong>secondary</strong> index.
          </p>
          <p>
            Sparse indexes are <em>smaller but constrained</em> (one per file,
            must follow the physical order). Dense indexes are{" "}
            <em>larger but free</em> (any field, any number).
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">When single-level breaks down</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All four index types above share the same pain point: the index
          itself may grow large enough that binary-searching it is no longer
          a handful of reads. With <MathInline expression="b_i" /> in the
          tens of thousands we are back to <MathInline expression="\\log_2 b_i \\approx 15+" />
          I/Os per lookup just to traverse the index.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The fix is the same fix we applied to the data file: if a sorted
          file is too large to binary search efficiently, index it. That is
          the idea behind multilevel indexes, which are next.
        </p>
      </AnimatedSection>

      <InfoCallout variant="example" title="One file, multiple indexes">
        A typical employee table in production has: one primary-key-ish
        index on <code className="font-mono text-xs">id</code> (often itself a
        B+ tree acting as a clustered primary), plus half a dozen dense
        secondary indexes on <code className="font-mono text-xs">email</code>,{" "}
        <code className="font-mono text-xs">dept_id</code>,{" "}
        <code className="font-mono text-xs">hire_date</code>, and maybe a
        composite or two. Each query picks whichever is cheapest.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
