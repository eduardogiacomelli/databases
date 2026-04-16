import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { TreePineIcon, GitBranchIcon, ScaleIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §7 · Simulator"
        title="B-Trees"
        description="A dynamic, always-balanced multilevel index. Every node holds between ⌈p/2⌉ and p children; every leaf sits at the same depth. Splits on overflow and merges on underflow propagate bottom-up."
        icon={<TreePineIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The invariant</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A B-tree of order <MathInline expression="p" /> satisfies:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Every node (except root) has between <MathInline expression="\\lceil p/2 \\rceil" /> and <MathInline expression="p" /> children.</li>
          <li>A node with <MathInline expression="k" /> children holds <MathInline expression="k-1" /> keys, in sorted order.</li>
          <li>All leaves are at the same level (perfect height balance).</li>
          <li>Each key in a B-tree node carries its own data-record pointer.</li>
        </ul>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Operations at a glance</SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon={<GitBranchIcon />} title="Search">
            At each node, binary-search the keys and descend into the
            matching child. Hits can be satisfied at any level.
          </ConceptCard>
          <ConceptCard icon={<ScaleIcon />} title="Insert">
            Walk to the appropriate leaf. If full, <strong>split</strong>:
            move the middle key into the parent. The parent may split too —
            propagation is bounded by height.
          </ConceptCard>
          <ConceptCard icon={<ScaleIcon />} title="Delete">
            After removal, if a node drops below the half-full mark,{" "}
            <strong>borrow</strong> from a sibling or <strong>merge</strong>{" "}
            with it. Possibly propagates up the tree.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Cost model</SectionHeading>
        <FormulaCard
          label="Tree height"
          expression="h \\le \\log_{\\lceil p/2 \\rceil} \\left( \\frac{n+1}{2} \\right)"
          description="With n keys and minimum fan-out ⌈p/2⌉, height grows very slowly: a 100-order tree over a billion keys is under 5 levels deep."
        />
        <FormulaCard
          label="Any operation"
          expression="O(h) = O(\\log_p n)"
          description="Search, insert, and delete all walk the tree top-to-bottom and (at most) back up."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Why B-trees shine on disk</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A B-tree node is a block. With a block size of 8 KB and an entry
          size of 16 bytes, a node holds about 500 keys — so the tree has
          fan-out ~500. Storing a billion entries then requires only{" "}
          <MathInline expression="\\lceil \\log_{500} 10^9 \\rceil \\approx 4" />{" "}
          levels, and hence at most four block reads per lookup. The upper
          levels are usually cached in RAM, so most lookups touch only one or
          two blocks on disk.
        </p>
      </AnimatedSection>

      <InfoCallout variant="example" title="B-tree vs B+ tree">
        In a pure B-tree, every node carries data-record pointers. That lets
        queries terminate early on interior hits, but it also means interior
        nodes are bigger (wasting fan-out). B+ trees move all pointers to the
        leaves and link the leaves, trading early termination for higher
        fan-out and efficient range scans. Systems almost universally chose
        the B+ variant. Next page.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
