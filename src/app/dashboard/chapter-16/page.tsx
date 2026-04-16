import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { SectionHeading } from "@/components/content/section-heading";
import { PageNavigation } from "@/components/content/page-navigation";
import { navigation } from "@/lib/navigation";
import {
  HardDriveIcon,
  FileTextIcon,
  LayersIcon,
  DatabaseIcon,
  SearchIcon,
  HashIcon,
  GitBranchIcon,
  BarChart3Icon,
  ArrowRightIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chapter = navigation[0];

export default function Chapter16Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 16"
        title="Disk Storage & File Structures"
        description="How relational databases physically store records on disk — organizing bytes into blocks, blocks into files, and files into efficient access structures. This is the foundation that determines how fast your queries can possibly run."
        icon={<HardDriveIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Why physical storage matters</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every SELECT, INSERT and UPDATE eventually touches bytes on a physical
          device. The gap between memory access (≈100 ns) and disk access
          (≈10 ms for HDD, ≈100 μs for SSD) is so vast that query performance
          is almost entirely dictated by <em>how many disk blocks</em> the
          engine has to read. Understanding record layout, blocking factor, and
          file organization is the first step to reasoning about real-world
          database performance.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">What you will learn</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <ConceptCard icon={<FileTextIcon />} title="Records & record types">
            Fixed-length record layout, PostgreSQL data types and their byte
            sizes, and how rows map to disk bytes.
          </ConceptCard>
          <ConceptCard icon={<LayersIcon />} title="Files of records">
            Heap files, ordered (sequential) files, and hashed files — three
            fundamental ways to organize a collection of records on disk.
          </ConceptCard>
          <ConceptCard icon={<HardDriveIcon />} title="Disk storage & blocks">
            Block size, blocking factor, unspanned records, contiguous
            allocation, and why the block is the unit of I/O.
          </ConceptCard>
          <ConceptCard icon={<DatabaseIcon />} title="Schema builder" variant="highlight">
            An interactive simulator: define a table schema, pick a block size,
            watch blocking factor, block count and wasted space update live.
          </ConceptCard>
          <ConceptCard icon={<SearchIcon />} title="File access methods" variant="highlight">
            Linear scan vs. binary search, animated side-by-side with block
            read counts — see the asymptotic difference unfold.
          </ConceptCard>
          <ConceptCard icon={<BarChart3Icon />} title="Retrieval & update ops">
            The cost of SELECT, INSERT and DELETE on unordered vs. ordered
            files, and why keeping a file sorted is expensive.
          </ConceptCard>
          <ConceptCard icon={<GitBranchIcon />} title="Primary index & ISAM">
            The first step toward indexing: a small auxiliary structure that
            dramatically cuts down block reads.
          </ConceptCard>
          <ConceptCard icon={<HashIcon />} title="Hashing" variant="highlight">
            Hash functions, buckets, collisions, and resolution strategies —
            with an interactive hash table you can poke at.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Start reading</SectionHeading>
        <div className="grid gap-2">
          {chapter.items.map((item, i) => (
            <Link
              key={item.url}
              href={item.url}
              className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/40 px-4 py-3 text-sm transition-colors hover:border-border hover:bg-card"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.icon && (
                  <item.icon className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium">{item.title}</span>
                {item.isSimulator && (
                  <Badge
                    variant="secondary"
                    className="gap-0.5 px-1.5 py-0 text-[10px]"
                  >
                    <ZapIcon className="size-2.5" />
                    Simulator
                  </Badge>
                )}
              </span>
              <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </AnimatedSection>

      <InfoCallout variant="tip" title="How to use this chapter">
        Each topic page combines theory, formulas, PostgreSQL examples and
        where relevant, interactive simulators. Work through them in order —
        later topics build on earlier ones — and experiment freely with the
        simulators. That&apos;s where the intuition really clicks.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
