import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { FormulaCard } from "@/components/content/formula-card";
import { PageNavigation } from "@/components/content/page-navigation";
import { MathInline } from "@/components/content/math-block";
import { CodeBlock } from "@/components/content/code-block";
import { TreePineIcon, LinkIcon, LayersIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 17 · §8 · Simulator"
        title="B+ Trees"
        description="The default index in every mainstream RDBMS. All data pointers sit at the leaves; leaves form a doubly-linked list for fast range scans; interior nodes are pure routing keys with high fan-out."
        icon={<TreePineIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Two differences from a B-tree</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<LayersIcon />} title="Data only at leaves">
            Interior nodes store only routing keys and child pointers — no
            record pointers. This doubles or triples interior fan-out,
            shrinking the tree.
          </ConceptCard>
          <ConceptCard icon={<LinkIcon />} title="Leaves are linked">
            Every leaf has a pointer to the next (and often previous) leaf.
            Once a range query locates the starting leaf, the rest of the
            range is a sequential scan of linked leaves.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Routing vs. leaf entries</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Interior entries look like <code className="font-mono text-xs">⟨key, child-ptr⟩</code>.
          Leaf entries look like{" "}
          <code className="font-mono text-xs">⟨key, record-ptr⟩</code> (or,
          in a clustered table, the entire record). Keys may be duplicated
          between an interior routing entry and a leaf — the interior copy
          exists only to direct the search, not to point at data.
        </p>
        <FormulaCard
          label="Fan-out"
          expression="p_{\\text{int}} = \\left\\lfloor \\frac{B}{V + \\text{PT}} \\right\\rfloor, \\quad p_{\\text{leaf}} = \\left\\lfloor \\frac{B}{V + R_p} \\right\\rfloor"
          description="B = block size, V = key size, PT = child pointer, Rp = record pointer. Interior fan-out is higher because PT < Rp (child pointer is a block ID, record pointer is block+slot)."
        />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Range scans: the killer feature</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For a query like <code className="font-mono text-xs">WHERE id BETWEEN 1000 AND 2000</code>:
        </p>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
          <li>Descend to the leaf containing key 1000: <MathInline expression="h" /> block reads.</li>
          <li>Walk the linked leaves forward, emitting matching keys.</li>
          <li>Stop when a key exceeds 2000.</li>
        </ol>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Crucially, you <em>don&apos;t re-traverse the tree</em> for each
          result — the leaf links replace what would otherwise be N separate
          tree descents.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">PostgreSQL&apos;s default</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <code className="font-mono text-xs">CREATE INDEX</code> without an
          explicit <code className="font-mono text-xs">USING</code> clause
          produces a B+ tree. PostgreSQL&apos;s B+ tree implementation adds
          deduplication of entries for the same value, concurrent split
          algorithms (Lehman-Yao), and a separate free-space map.
        </p>
        <CodeBlock
          lang="sql"
          title="psql"
          code={`-- Default (B+ tree)
CREATE INDEX orders_customer_idx ON orders (customer_id);

-- Inspect the index structure
SELECT pg_size_pretty(pg_relation_size('orders_customer_idx'));
SELECT * FROM pgstatindex('orders_customer_idx'); -- tree_level, leaf_pages, etc.

-- Range scan that uses it
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE customer_id BETWEEN 1000 AND 2000
ORDER BY customer_id;`}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="Why this is the industry default">
        B+ trees are: (1) balanced under arbitrary insert/delete patterns,
        (2) efficient for both point and range queries, (3) friendly to
        block-based storage via high fan-out, (4) straightforward to
        implement with concurrent operations. No single alternative beats
        them on all four at once. Hash indexes win on pure point lookups;
        bitmaps win on low-cardinality OLAP; but B+ is the default for a
        reason.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
