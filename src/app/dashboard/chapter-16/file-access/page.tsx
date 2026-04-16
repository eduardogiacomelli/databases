import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { FileAccessAnimator } from "@/components/simulators/file-access/file-access-animator";
import { SearchIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16 · Simulator"
        title="File Access Methods"
        description="Two algorithms, one dataset. Drive the simulator to see how a linear scan (unordered heap file) and a binary search (ordered file) explore blocks — and how the block-read counts diverge as the file grows."
        icon={<SearchIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">What&apos;s happening under the hood</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each tile is a disk block. Blocks are labeled with the range of keys
          they contain (<span className="font-mono">minKey–maxKey</span>).
          In linear mode, blocks are visited left-to-right. In binary mode,
          the visible window shrinks as the algorithm narrows the search
          range; inactive blocks fade out.
        </p>
      </AnimatedSection>

      <FileAccessAnimator />

      <InfoCallout variant="tip" title="Experiments worth trying">
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>
            Increase <span className="font-mono">b</span> to 48, run linear
            vs. binary side by side. Watch the gap.
          </li>
          <li>
            Type a key that is between two blocks — binary still narrows
            correctly but returns &quot;not stored.&quot;
          </li>
          <li>
            Slow the speed down to really see the binary window contract.
          </li>
        </ul>
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
