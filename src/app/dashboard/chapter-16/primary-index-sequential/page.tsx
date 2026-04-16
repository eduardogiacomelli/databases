import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MathInline } from "@/components/content/math-block";
import {
  GitBranchIcon,
  KeyIcon,
  LayersIcon,
  ArrowRightIcon,
} from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · §5"
        title="Primary Index & ISAM"
        description="A first taste of indexing: a small auxiliary structure that sits alongside an ordered file and cuts the number of block reads from log₂(b) to log₂(bᵢ), where bᵢ ≪ b."
        icon={<GitBranchIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The core idea</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If the data file is ordered by a key, we can build a second, much
          smaller file — the <strong className="text-foreground">primary index</strong>{" "}
          — that contains <em>one entry per block</em> of the data file.
          Each index entry is a pair:
        </p>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <code className="font-mono text-sm">
              ⟨ first key in block<sub>i</sub> , pointer to block<sub>i</sub> ⟩
            </code>
          </CardContent>
        </Card>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Because there is only one entry per data block, the index is{" "}
          <strong>tiny</strong> relative to the data — often 100× smaller.
          Binary searching that tiny index takes far fewer block reads than
          binary searching the data file itself.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Dense vs. sparse indexes</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<LayersIcon />} title="Sparse index">
            One entry per <em>block</em>. Only works if the data file is
            ordered on the indexed field. Small and efficient. A primary index
            is sparse by construction.
          </ConceptCard>
          <ConceptCard icon={<LayersIcon />} title="Dense index">
            One entry per <em>record</em>. Works on any file (ordered or not).
            Larger but lets you answer existence queries without reading the
            data file at all.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Cost analysis</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let the data file have <MathInline expression="b" /> blocks and
          blocking factor <MathInline expression="\\text{bfr}" />. Let the
          index entry size be <MathInline expression="R_i" /> bytes and the
          block size <MathInline expression="B" /> bytes. The index
          blocking factor is <MathInline expression="\\text{bfr}_i = \\lfloor B/R_i \\rfloor" /> and
          the index has <MathInline expression="b_i = \\lceil b / \\text{bfr}_i \\rceil" /> blocks.
        </p>
        <FormulaCard
          label="Total block reads to find a record"
          expression="\\lceil \\log_2 b_i \\rceil \\;+\\; 1"
          description="Binary search the (much smaller) index, then follow one pointer to the data block."
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Concretely, with our 8,334-block data file and a 9-byte index entry
          in 8192-byte blocks: <MathInline expression="\\text{bfr}_i = 910" />, so{" "}
          <MathInline expression="b_i = 10" /> and the total cost is{" "}
          <MathInline expression="\\lceil \\log_2 10 \\rceil + 1 = 5" /> block
          reads. Down from 13 with binary search on the data alone — and it
          keeps getting better as the data grows.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Indexed-sequential file (ISAM)</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          An <strong>indexed-sequential file</strong> is the classic pairing:
          an ordered data file plus its primary index. The original{" "}
          <strong>ISAM</strong> (Indexed Sequential Access Method) organization
          added an <strong>overflow area</strong> to handle insertions without
          rewriting the main file — inserts go into an overflow chain attached
          to the block where the record logically belongs, and a periodic
          reorganization merges everything back into sorted main order.
        </p>
        <Card className="border-border/50 bg-muted/10">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex size-10 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-xs">
                idx
              </span>
              <ArrowRightIcon className="size-3 text-muted-foreground" />
              <div className="flex gap-1">
                {["B1", "B2", "B3", "B4", "..."].map((b) => (
                  <span
                    key={b}
                    className="flex size-10 items-center justify-center rounded-md border border-border/50 bg-card font-mono text-xs"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                main (ordered)
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex size-10 items-center justify-center opacity-0">_</span>
              <ArrowRightIcon className="size-3 text-muted-foreground opacity-0" />
              <div className="flex gap-1">
                {["O1", "O2"].map((b) => (
                  <span
                    key={b}
                    className="flex size-10 items-center justify-center rounded-md border border-yellow-500/40 bg-yellow-500/10 font-mono text-xs text-yellow-500"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                overflow
              </span>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Clustered files (non-key ordering)</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If the ordering field is <em>not</em> unique — say, records are
          ordered by <code className="font-mono text-xs">dept_id</code> but
          many employees share one department — we call the file{" "}
          <strong>clustered</strong>. Blocks in the data file hold{" "}
          <em>clusters</em> of records sharing the same value. The associated
          index is called a{" "}
          <strong className="text-foreground">clustering index</strong>, and
          we treat it in detail in <a className="text-primary underline underline-offset-2" href="/dashboard/chapter-17/clustering-indexes">Chapter 17</a>.
        </p>
        <ConceptCard icon={<KeyIcon />} title="Key vs. non-key ordering">
          When the ordering field is a key, every block&apos;s first-key
          uniquely identifies the block. When it isn&apos;t, consecutive
          blocks may share the same ordering value, and the index must handle
          pointers to the <em>first</em> block containing each value.
        </ConceptCard>
      </AnimatedSection>

      <InfoCallout variant="warning" title="Why one level isn't enough">
        For very large files, the index itself becomes too big to binary
        search in a handful of reads. The next step is to index the index —
        giving us a <strong>multilevel index</strong>, the direct precursor to
        the B-tree. That story continues in{" "}
        <a href="/dashboard/chapter-17" className="text-primary underline underline-offset-2">
          Chapter 17
        </a>
        .
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
