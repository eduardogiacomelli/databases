import { ArrowDownUpIcon, ZapIcon, LayersIcon, RefreshCwIcon, BookOpenIcon } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { StepByStep } from "@/components/content/step-by-step";
import { FormulaCard } from "@/components/content/formula-card";
import { MathInline } from "@/components/content/math-block";
import { ExternalSortAnimator } from "@/components/simulators/external-sort/external-sort-animator";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 18 · §2"
        title="External Sorting"
        description="Relations are bigger than memory, so every sort-based operator — ORDER BY, DISTINCT, GROUP BY, sort-merge join — leans on the same on-disk algorithm. Initial run creation, then (nB−1)-way merging."
        icon={<ArrowDownUpIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Why every database needs it</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Sorting a relation that fits in memory is a one-line call to your
          language&apos;s quicksort. The interesting case is the one the DBMS
          always has to handle: a relation of <MathInline expression="b" />{" "}
          blocks where <MathInline expression="b \gg n_B" />. You can never hold
          the whole thing at once, so the algorithm works in waves — load what
          you can, sort it, write it back, then merge the sorted chunks. This
          is <em>external sort-merge</em>, and it sits underneath ORDER BY,
          DISTINCT, many GROUP BY plans, sort-merge join, and even the
          &ldquo;spill to disk&rdquo; fallback of hash joins.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<LayersIcon />} title="Phase 1 — runs">
            Read <MathInline expression="n_B" /> blocks, sort in memory, write
            the sorted chunk out as a <em>run</em>. Repeat until the whole file
            is consumed. You now have <MathInline expression="\lceil b/n_B \rceil" />{" "}
            sorted runs.
          </ConceptCard>
          <ConceptCard icon={<RefreshCwIcon />} title="Phase 2 — merge">
            Use <MathInline expression="n_B - 1" /> frames for input (one block
            per run) and 1 frame for output. Merge <MathInline expression="n_B - 1" />{" "}
            runs at a time into a bigger run. Repeat until one run remains.
          </ConceptCard>
          <ConceptCard icon={<BookOpenIcon />} title="Result">
            A single sorted file. Total I/O scales with the <em>number of
            passes</em> — not the square of <MathInline expression="b" />, not
            <MathInline expression="b \log b" />. Just linear per pass.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">The cost formula</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Every pass reads every block once and writes every block once —{" "}
          <MathInline expression="2b" /> transfers per pass. With one initial
          sort pass plus <MathInline expression="p" /> merge passes, the whole
          sort costs:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormulaCard
            label="Number of initial runs"
            expression="n_R = \left\lceil \dfrac{b}{n_B} \right\rceil"
            description="One run per buffer-load, last run possibly smaller."
          />
          <FormulaCard
            label="Number of merge passes"
            expression="p = \left\lceil \log_{n_B - 1} n_R \right\rceil"
            description="Each pass divides the run count by the fan-in (nB − 1)."
          />
          <FormulaCard
            label="Total block I/O"
            expression="2 \cdot b \cdot (p + 1)"
            description="Read + write every block once per pass, plus the initial sort pass."
            className="md:col-span-2"
          />
        </div>
        <InfoCallout variant="example" title="Worked example">
          <strong>
            <MathInline expression="b = 1024, \; n_B = 5" />
          </strong>{" "}
          → <MathInline expression="n_R = \lceil 1024/5 \rceil = 205" />,{" "}
          <MathInline expression="p = \lceil \log_4 205 \rceil = 4" />. Total
          cost = <MathInline expression="2 \cdot 1024 \cdot 5 = 10{,}240" />{" "}
          block transfers. Doubling the buffer to{" "}
          <MathInline expression="n_B = 10" /> cuts the pass count to 3 → 8,192
          transfers. The win from extra buffers is logarithmic, but it matters.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Interactive animator</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Slide the file size and buffer budget to watch the initial runs form,
          then see each merge pass halve the work. The live counter tracks
          reads and writes so you can verify the <MathInline expression="2b(p+1)" />{" "}
          formula as the passes unfold.
        </p>
        <ExternalSortAnimator />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">How the merge step actually works</SectionHeading>
        <StepByStep
          steps={[
            {
              title: "Load one block from each input run",
              content: (
                <>
                  With <MathInline expression="n_B - 1" /> input frames, you
                  can hold the head block of that many runs in memory
                  simultaneously. One block stays in the output frame.
                </>
              ),
            },
            {
              title: "Pick the smallest head key",
              content:
                "Scan the heads of the loaded blocks, copy the tuple with the smallest key to the output buffer. Advance that run's pointer.",
            },
            {
              title: "Refill input frames on demand",
              content:
                "When an input frame empties, load the next block of that run from disk. When a run is fully consumed, drop its frame from consideration.",
            },
            {
              title: "Flush the output buffer",
              content:
                "When the output frame is full, write it out as the next block of the merged run. Then reset it and keep going.",
            },
            {
              title: "Repeat until all inputs are drained",
              content:
                "You finish with one bigger sorted run. Group the next (nB−1) runs of this pass and do it again. When only one run remains, the file is sorted.",
            },
          ]}
        />
        <InfoCallout variant="tip" title="Replacement selection">
          A trick called <em>replacement selection</em> produces initial runs of{" "}
          <em>average size</em> <MathInline expression="2 n_B" /> — not{" "}
          <MathInline expression="n_B" /> — by keeping a priority queue and
          flushing keys to the current run only while they are ≥ the previous
          output key. Halves the number of initial runs, but requires random
          input order and an in-memory heap. Most engines use plain quicksort
          for simplicity.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">PostgreSQL: see it live</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Postgres picks an in-memory sort when the result fits in{" "}
          <code className="font-mono text-xs">work_mem</code>. When it
          doesn&apos;t, it switches to the external sort-merge above. You can
          force the switch by shrinking the budget:
        </p>
        <CodeBlock
          lang="sql"
          title="psql — force external sort"
          code={`-- Tiny work_mem forces sort to spill to disk
SET work_mem = '64kB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table ORDER BY some_column;
-- look for: "Sort Method: external merge  Disk: 5128kB"

-- Generous work_mem keeps it in memory
SET work_mem = '256MB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table ORDER BY some_column;
-- look for: "Sort Method: quicksort  Memory: 1843kB"

RESET work_mem;`}
        />
        <InfoCallout variant="info" title="Where else you will see this">
          Any operator that needs sorted input calls into this machinery:{" "}
          <ZapIcon className="inline size-3.5" /> sort-merge joins,
          duplicate-elimination for <code className="text-xs">DISTINCT</code>,
          the sort-based path for <code className="text-xs">GROUP BY</code>,{" "}
          <code className="text-xs">UNION</code> / <code className="text-xs">INTERSECT</code> /{" "}
          <code className="text-xs">EXCEPT</code>, and the{" "}
          <em>spill</em> of large in-memory hash tables when they outgrow{" "}
          <code className="text-xs">work_mem</code>.
        </InfoCallout>
      </AnimatedSection>

      <InfoCallout variant="tip" title="What to take away">
        External sort costs <MathInline expression="2b(p+1)" /> block I/Os.
        Buffer size has logarithmic effect on passes; file size has linear
        effect per pass. Every other sort-based operator you meet in this
        chapter builds on exactly this routine.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
