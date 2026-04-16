import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { CodeBlock } from "@/components/content/code-block";
import { PageNavigation } from "@/components/content/page-navigation";
import { ComparisonTable } from "@/components/content/comparison-table";
import { MathInline } from "@/components/content/math-block";
import {
  BarChart3Icon,
  SearchIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  RefreshCwIcon,
} from "lucide-react";

const binarySearchCode = `/**
 * Binary search over an ordered file of b blocks.
 * Each "read" here is a block read from disk — the expensive thing.
 *
 * @returns the block index where key K was found, or -1
 */
export function binarySearchBlocks(
  b: number,                                // total blocks in file
  readBlock: (idx: number) => Record[],     // block-level disk read
  firstKeyOf: (block: Record[]) => number,  // smallest key in a block
  lastKeyOf:  (block: Record[]) => number,  // largest  key in a block
  K: number,
): number {
  let low = 0;
  let high = b - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const block = readBlock(mid);

    if (K < firstKeyOf(block)) high = mid - 1;
    else if (K > lastKeyOf(block)) low = mid + 1;
    else return mid;   // K is within this block's key range
  }
  return -1;            // not found
}`;

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · §4"
        title="Retrieval & Update Operations"
        description="Four basic operations — SELECT, INSERT, UPDATE, DELETE — on heap and ordered files. The choice of file organization completely changes the cost profile of each."
        icon={<BarChart3Icon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Select conditions</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every retrieval on a file boils down to finding records that match a{" "}
          <strong className="text-foreground">selection condition</strong>.
          The common ones are:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ConceptCard icon={<SearchIcon />} title="Equality on key">
            <code className="font-mono text-xs">emp_id = 4711</code>. The most
            common and most optimizable condition.
          </ConceptCard>
          <ConceptCard icon={<SearchIcon />} title="Range query">
            <code className="font-mono text-xs">hire_date BETWEEN ... AND ...</code>.
            Benefits massively from ordered storage.
          </ConceptCard>
          <ConceptCard icon={<SearchIcon />} title="Equality on non-key">
            <code className="font-mono text-xs">dept_id = 7</code>. May return
            many records; still needs a scan unless there&apos;s an index.
          </ConceptCard>
          <ConceptCard icon={<SearchIcon />} title="Conjunctive">
            Several conditions AND&apos;ed together. Usually the most
            selective one drives the access plan.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Cost of equality search</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Let <MathInline expression="b" /> be the number of blocks in the
          file. The cost is the number of block reads to disk.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormulaCard
            label="Heap file (unordered)"
            expression="\\text{cost}_{\\text{avg}} = \\frac{b}{2} \\;;\\; \\text{cost}_{\\text{worst}} = b"
            description="Must linearly scan until the key is found; if unique the average is b/2."
          />
          <FormulaCard
            label="Ordered file, binary search"
            expression="\\text{cost} = \\lceil \\log_2 b \\rceil"
            description="Each read discards half the remaining blocks."
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          At <MathInline expression="b = 8334" /> blocks (our 1M-row example):
          heap search averages <strong>4,167 block reads</strong>; binary
          search on the ordered version averages{" "}
          <strong>⌈log₂ 8334⌉ = 13 block reads</strong>. Three orders of
          magnitude.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Binary search on blocks</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Binary search on an ordered file operates at block granularity:
          pick the middle block, read it, compare the key range; narrow to the
          left or right half; repeat. A TypeScript sketch:
        </p>
        <CodeBlock
          title="binary-search.ts"
          lang="typescript"
          code={binarySearchCode}
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Insertion cost</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<PlusCircleIcon />} title="Heap: cheap">
            Read the last block (1 read), place the record, write it back
            (1 write). Constant cost regardless of file size.
          </ConceptCard>
          <ConceptCard icon={<PlusCircleIcon />} title="Ordered: painful">
            To keep order, every record after the insertion point may need to
            shift. In the worst case, all subsequent blocks rewrite. Real
            systems use <strong>overflow blocks</strong> to amortize this.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Deletion &amp; update</SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<MinusCircleIcon />} title="Deletion">
            Locate the record, then either mark it deleted (a{" "}
            <em>deletion marker</em>) or physically compact the block.
            PostgreSQL uses the former plus <code className="font-mono text-xs">VACUUM</code>.
          </ConceptCard>
          <ConceptCard icon={<RefreshCwIcon />} title="Update (in place)">
            If the new value fits in the same bytes, rewrite the field and
            the block. Cheap.
          </ConceptCard>
          <ConceptCard icon={<RefreshCwIcon />} title="Update (moves record)">
            If the update changes the ordering field, the record must be
            deleted and reinserted. Treated as delete + insert.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Decision cheat sheet</SectionHeading>
        <ComparisonTable
          headers={["Workload", "Best organization", "Rationale"]}
          rows={[
            ["Write-heavy log", "Heap", "Insertion is O(1); reads are rare or do full scans anyway"],
            ["Read-heavy reporting on sort key", "Ordered", "Binary search + sequential range scans"],
            ["Point lookups by primary key", "Hashed", "O(1) average access"],
            ["Mixed read/write transactional (OLTP)", "Heap + B+ tree index", "Best of both — next chapter"],
          ]}
        />
      </AnimatedSection>

      <InfoCallout variant="warning" title="The ordered-file trap">
        Keeping a file ordered is tempting for fast reads, but the cost of
        maintaining that order on inserts/updates is usually prohibitive in
        practice. Almost all production systems use a heap for the data and a
        separate <strong>index</strong> (usually a B+ tree) to provide fast
        ordered access.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
