import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { ComparisonTable } from "@/components/content/comparison-table";
import {
  LayersIcon,
  ShuffleIcon,
  ArrowDownAZIcon,
  HashIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · §2"
        title="Files of Records"
        description="Once we know what a single record looks like, we need to organize many of them into a file. There are three classic strategies — heap, sequential and hashed — each with very different access characteristics."
        icon={<LayersIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">What is a file of records?</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A <strong className="text-foreground">file</strong> is a sequence of
          records. The physical file lives on disk as a sequence of{" "}
          <strong className="text-foreground">blocks</strong> (also called{" "}
          <em>pages</em>). Each block holds some whole number of records — the{" "}
          <em>blocking factor</em>, covered in the next section. The question
          this page answers is: <em>in what order are the records placed</em>,
          and what does that order imply about performance?
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">
          The three fundamental organizations
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<ShuffleIcon />} title="Heap (unordered) file">
            New records are simply appended to the last block. Insertion is
            O(1); search is O(n) block reads. PostgreSQL&apos;s default heap
            table is an example.
          </ConceptCard>
          <ConceptCard icon={<ArrowDownAZIcon />} title="Sequential (ordered) file">
            Records are kept sorted by some ordering field. Binary search
            becomes possible: O(log n) blocks for a lookup. But keeping it
            ordered on every insert is painful.
          </ConceptCard>
          <ConceptCard icon={<HashIcon />} title="Hashed file">
            A hash function maps the key directly to a bucket (block).
            Expected-time O(1) lookup for equality queries, but bad for range
            queries and vulnerable to collisions.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Heap files in detail</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A heap file places records in no particular order. When you insert,
          the DBMS finds the last block, drops the record at the end (or in a
          free slot left by a previous delete), and writes the block back.
          That&apos;s fast. But to find a record by any condition, the engine
          has no choice but a <strong>linear scan</strong>: read block 1, scan
          its records, read block 2, scan, and so on. On average half the blocks
          must be read; in the worst case, all of them.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Deletion is usually <em>logical</em>: a bit per record marks it as
          deleted, and the space is reused later. Periodic compaction or{" "}
          <code className="font-mono text-xs">VACUUM</code> (in PostgreSQL) is
          required to reclaim space.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Sequential (ordered) files</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A sequential file sorts records by an{" "}
          <strong className="text-foreground">ordering field</strong>. If that
          field is also unique, we call it the{" "}
          <strong className="text-foreground">ordering key</strong> — otherwise
          the file is called a <em>clustered file</em>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Badge
            variant="outline"
            className="justify-start gap-2 py-2 px-3 font-normal"
          >
            <ArrowDownAZIcon className="size-3.5" /> Binary search possible in
            O(log₂ b) block reads
          </Badge>
          <Badge
            variant="outline"
            className="justify-start gap-2 py-2 px-3 font-normal"
          >
            <ArrowDownAZIcon className="size-3.5" /> Range scans are sequential
            and cache-friendly
          </Badge>
          <Badge
            variant="outline"
            className="justify-start gap-2 py-2 px-3 font-normal"
          >
            <ShuffleIcon className="size-3.5" /> Insertion must preserve order —
            expensive
          </Badge>
          <Badge
            variant="outline"
            className="justify-start gap-2 py-2 px-3 font-normal"
          >
            <ShuffleIcon className="size-3.5" /> Often paired with an overflow
            area
          </Badge>
        </div>
        <InfoCallout variant="example" title="The overflow trick">
          Real systems rarely keep the main file strictly sorted. Instead, new
          records go into an overflow area, and a periodic reorganization pass
          merges them back in sorted order. This is the idea behind{" "}
          <strong>ISAM</strong> (Indexed Sequential Access Method).
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Hashed files</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A hashed file uses a <strong>hash function</strong> <em>h</em> that
          maps a record&apos;s hash key to a bucket address (a block on disk).
          To find a record with key <em>k</em>, you compute <em>h(k)</em> and
          jump straight to that block. Typical cost: <em>one</em> block read.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The catch: two keys may hash to the same bucket (a{" "}
          <strong>collision</strong>). Resolution strategies — open addressing,
          chaining with overflow blocks, extendible hashing, linear hashing —
          get their own dedicated page later in this chapter.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Side-by-side comparison</SectionHeading>
        <ComparisonTable
          headers={["Operation", "Heap", "Sequential", "Hashed"]}
          rows={[
            [
              "Equality search on key",
              <span key="a" className="font-mono text-xs">
                O(b)
              </span>,
              <span key="b" className="font-mono text-xs">
                O(log b)
              </span>,
              <span key="c" className="font-mono text-xs">
                O(1)
              </span>,
            ],
            [
              "Range search",
              <span key="d" className="font-mono text-xs">
                O(b)
              </span>,
              <span key="e" className="font-mono text-xs">
                O(log b + r)
              </span>,
              <span key="f" className="font-mono text-xs">
                O(b)
              </span>,
            ],
            [
              "Insertion",
              <span key="g" className="font-mono text-xs">
                O(1)
              </span>,
              <span key="h" className="font-mono text-xs">
                O(b)
              </span>,
              <span key="i" className="font-mono text-xs">
                O(1)*
              </span>,
            ],
            [
              "Deletion",
              <span key="j" className="font-mono text-xs">
                O(b)
              </span>,
              <span key="k" className="font-mono text-xs">
                O(b)
              </span>,
              <span key="l" className="font-mono text-xs">
                O(1)*
              </span>,
            ],
            ["Ordered scan", "No", "Yes (natural)", "No"],
          ]}
          caption="b = number of blocks, r = result size. * amortized, assumes no collisions."
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="There is no single winner">
        Each organization trades cost at one operation against cost at another.
        Real systems combine them: PostgreSQL uses heap tables + B+ tree
        indexes, giving heap-style inserts and log-time lookups. That&apos;s the
        subject of{" "}
        <a
          className="text-primary underline underline-offset-2"
          href="/dashboard/chapter-17"
        >
          Chapter 17
        </a>
        .
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
