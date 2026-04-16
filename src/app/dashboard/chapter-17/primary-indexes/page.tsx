import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranchIcon, KeyIcon, MinimizeIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §2"
        title="Primary Indexes"
        description="The textbook case: an ordered data file keyed on a unique field, with a sparse auxiliary index that pins the anchor record of each data block."
        icon={<GitBranchIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Anchor records</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If the data file is sorted on the key field <MathInline expression="K" />,
          every block has a well-defined <em>first record</em> — its{" "}
          <strong>anchor</strong>. The primary index stores one entry per
          block, pairing the anchor&apos;s key with a pointer to the block:
        </p>
        <Card className="border-border/50">
          <CardContent className="p-5 text-center">
            <code className="font-mono text-sm">
              ⟨ anchor-key<sub>i</sub> , block-pointer<sub>i</sub> ⟩
              &nbsp;&nbsp;for i = 1…b
            </code>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Sparsity</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<MinimizeIcon />} title="Smaller by a factor of bfr">
            One entry per block, not per record. If the data has blocking
            factor <MathInline expression="\\text{bfr}" />, the primary
            index is roughly <MathInline expression="\\text{bfr}" />× smaller
            than a dense index would be.
          </ConceptCard>
          <ConceptCard icon={<KeyIcon />} title="Key-unique">
            Because the ordering field is a key, anchor values are strictly
            increasing. Binary search on the index is well-defined and every
            key lookup has a unique answer.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Lookup algorithm</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To find record with key <MathInline expression="K" />:
        </p>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
          <li>
            Binary search the index for the <strong>largest</strong> anchor
            key <MathInline expression="\\le K" />.
          </li>
          <li>Follow that entry&apos;s pointer to the corresponding data block.</li>
          <li>Scan the block for the record.</li>
        </ol>
        <FormulaCard
          label="Block reads (primary index)"
          expression="\\lceil \\log_2 b_i \\rceil + 1"
          description="Log of the tiny index plus one data-block read."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Concrete numbers</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Using the employee file from Chapter 16 — 30,000 records, 68 bytes
          each, 8192-byte blocks — the data file has{" "}
          <MathInline expression="b = 250" /> blocks and requires{" "}
          <MathInline expression="\\lceil \\log_2 250 \\rceil = 8" /> block
          reads via direct binary search.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A primary index entry is 9 bytes (4-byte key + 5-byte pointer), so
          <MathInline expression="\\text{bfr}_i = \\lfloor 8192/9 \\rfloor = 910" />,
          giving <MathInline expression="b_i = \\lceil 250/910 \\rceil = 1" />.
          A one-block index means equality lookup costs two block reads,
          total — a 4× speedup over binary-searching the data file, with a
          storage overhead under 0.5%.
        </p>
      </AnimatedSection>

      <InfoCallout variant="warning" title="The insertion problem">
        Keeping the data file ordered on the key is expensive. Every
        insertion must slot the new record into its sorted position —
        potentially shifting half the file. The classical workaround is the
        ISAM overflow area (covered in Chapter 16); the modern answer is to
        drop the requirement that the data file be physically ordered at all
        and let a B+ tree manage order.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
