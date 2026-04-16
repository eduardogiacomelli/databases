import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { CodeBlock } from "@/components/content/code-block";
import { PgTypeTag } from "@/components/content/pg-type-tag";
import { ComparisonTable } from "@/components/content/comparison-table";
import { PageNavigation } from "@/components/content/page-navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileTextIcon,
  RulerIcon,
  DatabaseIcon,
  GaugeIcon,
} from "lucide-react";

const createTableSql = `-- A fixed-length record in PostgreSQL
CREATE TABLE employee (
  emp_id      INTEGER        NOT NULL,  --  4 bytes
  first_name  CHAR(20)       NOT NULL,  -- 20 bytes (padded)
  last_name   CHAR(30)       NOT NULL,  -- 30 bytes (padded)
  salary      NUMERIC(10,2)  NOT NULL,  --  8 bytes
  hire_date   DATE           NOT NULL,  --  4 bytes
  dept_id     SMALLINT       NOT NULL   --  2 bytes
);
-- Record size R = 4 + 20 + 30 + 8 + 4 + 2 = 68 bytes`;

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · §1"
        title="Records & Record Types"
        description="Before we talk about files, blocks or indexes, we need to know what a single row actually looks like in bytes. This page defines records, fields, and the record format — the atomic unit of everything that follows."
        icon={<FileTextIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">What is a record?</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A <strong className="text-foreground">record</strong> is a contiguous
          sequence of bytes on disk that represents one tuple of a relation
          (one row of a table). Each record is a concatenation of{" "}
          <strong className="text-foreground">fields</strong>, one per attribute
          in the relation. The record format — how many fields, in what order,
          of what type — is described by the table&apos;s schema and is stored
          in the database catalog.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <ConceptCard icon={<FileTextIcon />} title="Record">
            One row. A contiguous chunk of bytes. The unit a query engine
            reads, inserts, updates or deletes.
          </ConceptCard>
          <ConceptCard icon={<RulerIcon />} title="Field">
            One attribute value inside a record. Has a fixed or variable size
            determined by its data type.
          </ConceptCard>
          <ConceptCard icon={<DatabaseIcon />} title="Record type">
            The schema: ordered list of (field name, data type, size). Shared
            by every record in the table.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Fixed-length vs. variable-length records</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If every field has a known, fixed byte size, every record in the file
          has the same length <em>R</em>. This is the easy case and the one we
          focus on throughout the chapter: addressing, searching and updating
          all become simple arithmetic on block offsets.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Variable-length records (e.g. <PgTypeTag name="TEXT" /> or{" "}
          <PgTypeTag name="VARCHAR" /> columns, <code className="font-mono text-xs">NULL</code>{" "}
          fields, or repeating groups) complicate this significantly — the
          engine needs in-record length prefixes, separators or offset tables.
          Real RDBMS mix both; PostgreSQL&apos;s heap format stores fixed-size
          fields inline and moves long variable-length values to a separate{" "}
          <code className="font-mono text-xs">TOAST</code> storage.
        </p>
        <InfoCallout variant="info" title="Assumption for this chapter">
          We will assume <strong>fixed-length records</strong> and{" "}
          <strong>unspanned files</strong> (a record never crosses a block
          boundary). It keeps the math clean and isolates the concepts.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">PostgreSQL data types & their sizes</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To reason about disk occupation we need a byte budget for every
          column. Here&apos;s a reference table of common PostgreSQL types.
        </p>
        <ComparisonTable
          headers={["Category", "Type", "Size (bytes)", "Notes"]}
          rows={[
            ["Numeric", <PgTypeTag key="a" name="SMALLINT" />, <span key="b" className="font-mono">2</span>, "Signed 16-bit integer"],
            ["Numeric", <PgTypeTag key="c" name="INTEGER" />, <span key="d" className="font-mono">4</span>, "Most common integer type"],
            ["Numeric", <PgTypeTag key="e" name="BIGINT" />, <span key="f" className="font-mono">8</span>, "64-bit integer"],
            ["Numeric", <PgTypeTag key="g" name="NUMERIC(p,s)" />, <span key="h" className="font-mono">~8</span>, "Arbitrary precision decimal"],
            ["Text", <PgTypeTag key="i" name="CHAR(n)" />, <span key="j" className="font-mono">n</span>, "Fixed, right-padded with spaces"],
            ["Text", <PgTypeTag key="k" name="VARCHAR(n)" />, <span key="l" className="font-mono">n+1..n+4</span>, "Variable; 1–4-byte length header"],
            ["Boolean", <PgTypeTag key="m" name="BOOLEAN" />, <span key="n" className="font-mono">1</span>, "True / False / Null"],
            ["Date", <PgTypeTag key="o" name="DATE" />, <span key="p" className="font-mono">4</span>, "Calendar date"],
            ["Date", <PgTypeTag key="q" name="TIMESTAMP" />, <span key="r" className="font-mono">8</span>, "With microsecond precision"],
            ["UUID", <PgTypeTag key="s" name="UUID" />, <span key="t" className="font-mono">16</span>, "128-bit identifier"],
          ]}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">An example record</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Consider a simplified <code className="font-mono text-xs">employee</code>{" "}
          table. The record size <em>R</em> is just the sum of the field sizes
          (we ignore null bitmaps and alignment padding here).
        </p>
        <CodeBlock
          title="schema.sql"
          lang="sql"
          code={createTableSql}
        />

        <FormulaCard
          label="Record size"
          expression="R \\;=\\; \\sum_{i=1}^{n} \\text{size}(f_i)"
          description="R is the sum of the byte sizes of all n fields in the record. For the employee example above, R = 68 bytes."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Visualizing a record in memory</SectionHeading>
        <Card className="border-border/50 bg-muted/10">
          <CardContent className="p-6">
            <div className="mb-3 text-xs text-muted-foreground font-mono">
              One employee record (68 bytes) laid out in byte-order:
            </div>
            <div className="flex flex-wrap items-stretch font-mono text-[10px] gap-px">
              {[
                { label: "emp_id", bytes: 4, color: "bg-chart-1/40" },
                { label: "first_name", bytes: 20, color: "bg-chart-2/40" },
                { label: "last_name", bytes: 30, color: "bg-chart-3/40" },
                { label: "salary", bytes: 8, color: "bg-chart-4/40" },
                { label: "hire_date", bytes: 4, color: "bg-chart-1/40" },
                { label: "dept_id", bytes: 2, color: "bg-chart-5/40" },
              ].map((f) => (
                <div
                  key={f.label}
                  style={{ flexGrow: f.bytes, flexBasis: 0 }}
                  className={`${f.color} border border-border/40 flex flex-col items-center justify-center py-3 px-2`}
                >
                  <span className="font-medium">{f.label}</span>
                  <span className="text-muted-foreground">{f.bytes}B</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <InfoCallout variant="tip" title="Ready to experiment?">
        The{" "}
        <a href="/dashboard/chapter-16/schema-builder" className="text-primary underline underline-offset-2">
          Schema Builder simulator
        </a>{" "}
        lets you build a record like this column-by-column and instantly see
        its size, blocking factor and disk footprint.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
