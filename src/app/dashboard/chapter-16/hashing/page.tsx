import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { ComparisonTable } from "@/components/content/comparison-table";
import { MathInline } from "@/components/content/math-block";
import { HashSimulator } from "@/components/simulators/hashing/hash-simulator";
import { HashIcon, ZapIcon, ShuffleIcon, LinkIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · §6 · Simulator"
        title="Hashing Techniques"
        description="Skip the comparison tree entirely: compute an address and jump straight to the block. One I/O for the happy path — provided collisions are kept under control."
        icon={<HashIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The one-access dream</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A <strong className="text-foreground">hash file</strong> applies a function{" "}
          <MathInline expression="h(K)" /> to the search key to compute a{" "}
          <em>bucket address</em> directly. No probing of a tree, no
          binary search of an index — just one arithmetic operation and a
          single disk block read. In the best case, equality search on a hash
          file costs <MathInline expression="O(1)" /> block I/Os, independent
          of file size.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The catch: two keys can hash to the same bucket (a{" "}
          <strong>collision</strong>). Hashing is a balance between a well-
          chosen <MathInline expression="h" />, a well-sized bucket, and a
          collision-handling policy that keeps the worst case bounded.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Choosing a hash function</SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<ZapIcon />} title="Division">
            <MathInline expression="h(K) = K \\bmod M" />. Cheap and common —
            pick <MathInline expression="M" /> prime to avoid aliasing on
            powers of 2.
          </ConceptCard>
          <ConceptCard icon={<ShuffleIcon />} title="Multiplication">
            <MathInline expression="h(K) = \\lfloor M \\cdot \\{K \\cdot A\\} \\rfloor" />.
            Works well for arbitrary <MathInline expression="M" />;{" "}
            <MathInline expression="A \\approx 0.618" /> (golden ratio) is a
            classic choice.
          </ConceptCard>
          <ConceptCard icon={<LinkIcon />} title="Mid-square">
            Square the key, take the middle digits. Good dispersion when key
            magnitudes vary.
          </ConceptCard>
        </div>
        <FormulaCard
          label="Load factor"
          expression="\\alpha = \\frac{n}{M \\cdot s}"
          description="Keys n / (buckets M × slots per bucket s). Keep α ≲ 0.8 for good probe-chain bounds."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Collision resolution</SectionHeading>
        <ComparisonTable
          headers={["Strategy", "Mechanism", "Lookup cost", "Delete cost"]}
          rows={[
            [
              "Chaining (overflow)",
              "Extra records attached to the bucket via pointers",
              "1 + overflow-chain length",
              "Cheap — unlink from chain",
            ],
            [
              "Linear probing",
              "Try h(K), h(K)+1, h(K)+2, … mod M",
              "Good until α > 0.7, then degrades quickly",
              "Requires tombstones to preserve probe paths",
            ],
            [
              "Double hashing",
              "Step size = second hash h₂(K), probe h+i·h₂",
              "Smoother degradation than linear",
              "Tombstones required",
            ],
          ]}
        />
      </AnimatedSection>

      <HashSimulator />

      <AnimatedSection>
        <SectionHeading as="h2">Minimal Python-ish reference</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The textbook&apos;s chained-bucket insert, reduced to its essentials:
        </p>
        <CodeBlock
          lang="typescript"
          title="hash-file.ts"
          code={`type Record = { key: number; payload: unknown };
type Bucket = { slots: Record[]; overflow: Record[] };

function insertChained(
  buckets: Bucket[],
  slotsPerBucket: number,
  key: number,
  payload: unknown,
) {
  const h = ((key % buckets.length) + buckets.length) % buckets.length;
  const b = buckets[h];

  if (b.slots.length < slotsPerBucket) {
    b.slots.push({ key, payload });
  } else {
    b.overflow.push({ key, payload }); // linked into bucket's chain
  }
}`}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Static vs. dynamic hashing</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<HashIcon />} title="Static">
            Fixed <MathInline expression="M" />. Simple, but the file must be
            sized up-front. Growth past the capacity needs a full{" "}
            <em>rehash</em> — an expensive offline operation.
          </ConceptCard>
          <ConceptCard icon={<ZapIcon />} title="Dynamic (extendible & linear)">
            <MathInline expression="M" /> grows on demand. <strong>Extendible
            hashing</strong> uses a directory of <MathInline expression="2^d" />{" "}
            pointers that doubles when a bucket overflows;{" "}
            <strong>linear hashing</strong> splits one bucket at a time in
            round-robin fashion and keeps the directory implicit.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <InfoCallout variant="example" title="When hashing wins — and when it loses">
        Hashing dominates for equality search (<code className="font-mono text-xs">WHERE id = ?</code>).
        It is <strong>useless</strong> for range queries
        (<code className="font-mono text-xs">WHERE id BETWEEN a AND b</code>),
        because a good hash deliberately scrambles ordering. Range workloads
        want B+ trees; lookup-heavy OLTP workloads want hash indexes. Most
        production systems offer both: PostgreSQL has{" "}
        <code className="font-mono text-xs">CREATE INDEX … USING hash</code>,
        but the B-tree is the default for good reason.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
