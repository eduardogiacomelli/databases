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
  HardDriveIcon,
  BoxesIcon,
  RulerIcon,
  MinusSquareIcon,
  ZapIcon,
} from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · §3"
        title="Disk Storage & Access"
        description="The disk block is the fundamental unit of I/O in a database. Nothing about query performance makes sense until you understand why — and how records pack into blocks."
        icon={<HardDriveIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The disk block</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Storage hardware cannot actually read one byte at a time. A disk
          transfers data in fixed-size chunks called{" "}
          <strong className="text-foreground">blocks</strong> (or{" "}
          <em>pages</em>, in a DBMS context). Typical block sizes today are{" "}
          <strong>4 KB</strong> or <strong>8 KB</strong> (PostgreSQL&apos;s
          default is 8192 bytes). Asking for a single 68-byte record still
          costs a full block read. This single fact drives almost all the
          analysis that follows.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <ConceptCard icon={<BoxesIcon />} title="Block / page">
            The I/O unit. Typical sizes: 4096 or 8192 bytes. Chosen to match
            OS page size and SSD write granularity.
          </ConceptCard>
          <ConceptCard icon={<RulerIcon />} title="Blocking factor (bfr)">
            How many whole records fit in one block. bfr = ⌊B / R⌋.
          </ConceptCard>
          <ConceptCard icon={<MinusSquareIcon />} title="Unspanned">
            A record never straddles a block boundary. Any leftover space at
            the end of a block is wasted.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Blocking factor — the core formula</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If the block size is <MathInline expression="B" /> bytes and each
          record has size <MathInline expression="R" /> bytes, the number of
          whole (unspanned) records per block is:
        </p>
        <FormulaCard
          label="Blocking factor"
          expression="\\text{bfr} \\;=\\; \\left\\lfloor \\frac{B}{R} \\right\\rfloor"
          description="Floor because we cannot store a partial record (unspanned assumption)."
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Given a file of <MathInline expression="r" /> records, the total
          number of blocks needed is:
        </p>
        <FormulaCard
          label="Total blocks"
          expression="b \\;=\\; \\left\\lceil \\frac{r}{\\text{bfr}} \\right\\rceil"
          description="Ceiling because the last block may be only partially full."
        />
        <FormulaCard
          label="Wasted space per block"
          expression="w \\;=\\; B - \\text{bfr} \\cdot R"
          description="The bytes at the tail of each block that cannot hold another whole record."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Worked example</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Take the employee table from the previous page:{" "}
          <MathInline expression="R = 68" /> bytes. With PostgreSQL&apos;s
          default <MathInline expression="B = 8192" /> bytes:
        </p>
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-3 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">bfr </span>=⌊8192 / 68⌋ ={" "}
              <span className="text-primary font-semibold">120</span> records/block
            </div>
            <div>
              <span className="text-muted-foreground">wasted </span>= 8192 − 120 × 68 ={" "}
              <span className="text-primary font-semibold">32</span> bytes (0.39%)
            </div>
            <div>
              <span className="text-muted-foreground">For r = 1,000,000 records: </span>
              b = ⌈1,000,000 / 120⌉ ={" "}
              <span className="text-primary font-semibold">8,334</span> blocks ≈ 65 MB
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Block allocation on disk</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A file&apos;s blocks can be allocated to disk in a few ways:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ConceptCard icon={<ZapIcon />} title="Contiguous allocation" variant="highlight">
            Blocks are physically adjacent. Fastest sequential access (no seek
            between blocks). Our default assumption throughout this chapter.
          </ConceptCard>
          <ConceptCard icon={<BoxesIcon />} title="Linked allocation">
            Each block has a pointer to the next. Easy to grow a file; bad
            random access; one seek per block in the worst case.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <InfoCallout variant="info" title="Why unspanned?">
        Allowing records to cross block boundaries saves a bit of space, but it
        means every record read might require <em>two</em> block reads.
        That&apos;s usually a worse trade than losing a few bytes per block.
        Real systems mostly stick with unspanned + slotted page formats.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
