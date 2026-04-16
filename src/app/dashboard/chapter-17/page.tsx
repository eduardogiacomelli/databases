import Link from "next/link";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { SectionHeading } from "@/components/content/section-heading";
import { PageNavigation } from "@/components/content/page-navigation";
import { navigation } from "@/lib/navigation";
import {
  TreePineIcon,
  LayersIcon,
  GitBranchIcon,
  Grid3x3Icon,
  SearchIcon,
  BarChart3Icon,
  HashIcon,
  SettingsIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const chapter = navigation[1];

export default function Chapter17Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17"
        title="Indexing Structures & Physical Design"
        description="From single-level primary indexes to multi-level B+ trees — the data structures that turn linear scans into logarithmic lookups, and the design decisions that separate a hot database from a cold one."
        icon={<TreePineIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">The index arc</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Chapter 16 ended with a primary index — a tiny auxiliary file that
          cut block reads for ordered files dramatically. Chapter 17 follows
          the idea to its conclusion: index the index, and then index{" "}
          <em>that</em>, until the tree is shallow enough to reach any record
          in four or five block reads regardless of file size. The B+ tree is
          where this story lands, and it is the structure that powers the
          default index in PostgreSQL, MySQL, Oracle, SQL Server and nearly
          every other relational system shipping today.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">What you will learn</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <ConceptCard icon={<LayersIcon />} title="Single-level ordered indexes">
            The mechanics of a separate index file and how binary search on it
            compares to binary search on the data.
          </ConceptCard>
          <ConceptCard icon={<GitBranchIcon />} title="Primary indexes">
            Sparse indexes on ordered key fields — the classical case with the
            cleanest analysis.
          </ConceptCard>
          <ConceptCard icon={<Grid3x3Icon />} title="Clustering indexes">
            When the ordering field is not a key: indexing clusters, not
            individual records.
          </ConceptCard>
          <ConceptCard icon={<SearchIcon />} title="Secondary indexes">
            Indexes on non-ordering fields — dense, always larger, but the
            workhorse of real query plans.
          </ConceptCard>
          <ConceptCard icon={<BarChart3Icon />} title="Comparative properties">
            A unified table of index types: dense vs. sparse, ordered vs. not,
            key vs. non-key, with their cost trade-offs.
          </ConceptCard>
          <ConceptCard icon={<LayersIcon />} title="Multilevel indexes" variant="highlight">
            Index the index. An interactive fan-out calculator and animated
            traversal bring the ISAM idea to life.
          </ConceptCard>
          <ConceptCard icon={<TreePineIcon />} title="B-trees" variant="highlight">
            Dynamic balanced multilevel indexes. Watch insertions and splits
            propagate up the tree.
          </ConceptCard>
          <ConceptCard icon={<TreePineIcon />} title="B+ trees" variant="highlight">
            The industry default: all data at leaves, leaves linked for range
            scans. The default PG index.
          </ConceptCard>
          <ConceptCard icon={<Grid3x3Icon />} title="Multiple-key indexes">
            Composite keys, the leftmost-prefix rule, and when a composite
            beats two single-column indexes.
          </ConceptCard>
          <ConceptCard icon={<HashIcon />} title="Other index types">
            Hash, bitmap, function-based, and partial indexes — each optimized
            for a specific access pattern.
          </ConceptCard>
          <ConceptCard icon={<SettingsIcon />} title="General indexing issues">
            PostgreSQL CREATE INDEX, covering indexes, index-only scans, and
            write amplification.
          </ConceptCard>
          <ConceptCard icon={<BookOpenIcon />} title="Physical database design">
            How to decide which indexes to create by reasoning about workload,
            selectivity, and storage cost.
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

      <InfoCallout variant="tip" title="Read with PostgreSQL open">
        Every structure in this chapter exists in PostgreSQL under the
        <code className="mx-1 font-mono text-xs">CREATE INDEX … USING</code>
        syntax (btree, hash, gin, gist, brin, spgist). Try the CREATE INDEX
        statements in a scratch database as you read — the costs and plan
        shapes will stick far better.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
