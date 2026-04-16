import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { SchemaBuilder } from "@/components/simulators/schema-builder/schema-builder";
import { DatabaseIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · Simulator"
        title="Schema Builder"
        description="Design a table, choose a block size, and watch every physical metric update live. Change a type, add a column, scale the record count — all the formulas from the previous pages, made tangible."
        icon={<DatabaseIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">How to use it</SectionHeading>
        <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground list-disc list-inside marker:text-primary/60">
          <li>
            Add or remove columns on the left. Every PostgreSQL type is
            annotated with its on-disk byte cost.
          </li>
          <li>
            Change the <span className="font-mono">block size</span> (B) and{" "}
            <span className="font-mono">record count</span> (r) on the right.
          </li>
          <li>
            Metrics tab shows all derived values; <em>Block layout</em> tab
            renders one block, record-by-record, with the wasted tail
            highlighted.
          </li>
        </ul>
      </AnimatedSection>

      <SchemaBuilder />

      <InfoCallout variant="tip" title="Try these experiments">
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>
            Add a <span className="font-mono">VARCHAR(255)</span> column and
            watch the blocking factor collapse.
          </li>
          <li>
            Set the block size to 512 B with the default schema — how much
            worse is storage efficiency?
          </li>
          <li>
            Push <span className="font-mono">r</span> to 100,000,000. Notice
            linear search stays linear while binary search stays tiny.
          </li>
        </ul>
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
