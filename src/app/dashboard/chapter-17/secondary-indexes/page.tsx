import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { CodeBlock } from "@/components/content/code-block";
import { ComparisonTable } from "@/components/content/comparison-table";
import { SearchIcon, LayersIcon, LinkIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §4"
        title="Secondary Indexes"
        description="Indexes on fields the data file is not ordered on. Always dense, always larger than the primary — and yet, in real systems, where most of the action is."
        icon={<SearchIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Why dense</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A secondary index cannot rely on sorting to locate a record
          implicitly. There is no anchor record, no ordering we can exploit
          within the data file. So it must store one entry for{" "}
          <strong>every</strong> record — not just every block:
        </p>
        <div className="rounded-lg border border-border/50 bg-card/60 p-5 text-center">
          <code className="font-mono text-sm">
            ⟨ indexed-field-value , pointer-to-record ⟩ × n
          </code>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The index itself <em>is</em> sorted on the indexed field, so we can
          still binary search it — but it is larger than a primary or
          clustering index on the same data.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Key vs. non-key secondary</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<LayersIcon />} title="Key secondary">
            The indexed field is unique (e.g. email). One index entry per
            record, one pointer per entry. Straightforward.
          </ConceptCard>
          <ConceptCard icon={<LinkIcon />} title="Non-key secondary">
            The field has duplicates (e.g. last_name). Options:
            <ul className="list-disc list-inside mt-2 space-y-0.5">
              <li>One index entry per record (many with the same value)</li>
              <li>One entry per distinct value, pointing to a bucket of pointers</li>
              <li>Variable-length entries holding a list of pointers</li>
            </ul>
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Cost analysis</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let <MathInline expression="r" /> = records,{" "}
          <MathInline expression="R_i" /> = size of an index entry,{" "}
          <MathInline expression="B" /> = block size. Then:
        </p>
        <FormulaCard
          label="Secondary-index blocks"
          expression="b_i = \\left\\lceil \\frac{r}{\\lfloor B/R_i \\rfloor} \\right\\rceil"
          description="One entry per record means the index scales with r, not b."
        />
        <FormulaCard
          label="Equality search"
          expression="\\lceil \\log_2 b_i \\rceil + 1"
          description="Binary search index, then follow the pointer to the (unordered) data block."
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          For our 30,000-record employee file on a non-key field, dense
          index:{" "}
          <MathInline expression="b_i = \\lceil 30000/910 \\rceil = 34" />,
          so lookup costs <MathInline expression="\\lceil \\log_2 34 \\rceil + 1 = 7" />{" "}
          block reads.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">When the secondary index becomes a liability</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Range or “many matches” queries on a secondary index are expensive:
          each matching record may sit in a different data block. A query
          returning 1,000 records via a secondary index on a 30,000-record
          file can easily read 1,000 data blocks — more than a sequential
          scan of the entire file. The planner must estimate selectivity and
          pick.
        </p>
        <ComparisonTable
          headers={["Selectivity", "Best access path"]}
          rows={[
            ["< ~5% of rows", "Secondary index scan"],
            ["~5–20%", "Depends on clustering; planner decides"],
            ["> ~20%", "Usually sequential scan wins"],
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">In PostgreSQL</SectionHeading>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`CREATE INDEX employees_email_idx   ON employees (email);     -- key secondary
CREATE INDEX employees_lname_idx   ON employees (last_name); -- non-key secondary

-- Include extra columns so the index covers common queries
-- (index-only scan: no heap visit needed)
CREATE INDEX employees_email_cover ON employees (email) INCLUDE (first_name, last_name);`}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="The workhorse">
        In a typical OLTP schema, the one-to-a-few primary and clustering
        indexes are dwarfed by a long tail of secondary indexes covering
        every column that appears in a WHERE clause. Secondary indexes are
        why write amplification is a design concern: every insert updates
        every relevant secondary index.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
