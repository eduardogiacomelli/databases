import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { ConceptCard } from "@/components/content/concept-card";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { CodeBlock } from "@/components/content/code-block";
import { ComparisonTable } from "@/components/content/comparison-table";
import { StepByStep } from "@/components/content/step-by-step";
import { MathInline } from "@/components/content/math-block";
import {
  GitBranchIcon,
  BracesIcon,
  LayersIcon,
  FilterIcon,
  NetworkIcon,
  ArrowRightLeftIcon,
} from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 18 · §1"
        title="SQL to Relational Algebra"
        description="How a SELECT-FROM-WHERE block is translated into a relational-algebra expression tree. This is the first thing the engine does with your SQL — and the tree it produces is what the optimizer will spend the rest of its time reshaping."
        icon={<GitBranchIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">Where this step fits</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Before any algorithm runs, SQL text must become something the engine
          can reason about. The scanner tokenises, the parser checks syntax, the
          validator confirms that tables and columns exist — and then the
          translator produces a <strong>relational-algebra expression</strong>{" "}
          (rendered as a <em>query tree</em>). Every transformation Chapter 19
          applies — push a σ down, convert × into ⋈, reorder joins — operates on
          this tree. If the translator builds a clumsy tree, the optimizer has
          more work to do; if it builds a clean tree, the optimizer often has
          very little to do.
        </p>
        <InfoCallout variant="info" title="Algebra first, algorithms later">
          The tree at this stage says <em>what</em> must happen (select these
          rows, join on this predicate, project these columns) — not{" "}
          <em>how</em>. Choosing nested-loop vs hash join, index vs scan, is the
          optimizer&apos;s job (Chapter 19 + §3 and §4 of this chapter). Keep
          the two layers separate in your head.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">
          The query block: the unit of translation
        </SectionHeading>
        <p className=" leading-relaxed text-muted-foreground">
          A <strong>query block</strong> is a single SELECT-FROM-WHERE
          expression, optionally with GROUP BY and HAVING. It is the smallest
          piece of SQL that can be translated on its own. A query with nested
          subqueries has one query block per SELECT — the outer block references
          the inner blocks through predicates like{" "}
          <code className="font-mono text-xs">IN</code>,{" "}
          <code className="font-mono text-xs">EXISTS</code>, or a scalar
          comparison. The translator walks each block independently, then
          stitches them together.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<BracesIcon />} title="One SELECT = one block">
            Each SELECT-FROM-WHERE-[GROUP BY]-[HAVING] corresponds to one
            sub-tree. Set operations (UNION, INTERSECT, EXCEPT) and nested
            queries connect blocks; they do not merge them.
          </ConceptCard>
          <ConceptCard icon={<LayersIcon />} title="Bottom-up evaluation">
            The leaves of the tree are base tables. Each internal node is an
            operation that consumes its children&apos;s output. Execution order
            is determined by the tree shape: children before parents.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">The translation rules</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Translation is mechanical. Each SQL clause maps to a specific
          relational-algebra operator. A fluent reading of this table is enough
          to translate most real queries by hand.
        </p>
        <ComparisonTable
          headers={["SQL clause", "Algebra operator", "Notes"]}
          rows={[
            [
              <code key="c1" className="font-mono text-xs">
                SELECT A, B
              </code>,
              <span key="o1">
                π<sub>A,B</sub> (projection)
              </span>,
              "Applied last, at the root of the tree.",
            ],
            [
              <code key="c2" className="font-mono text-xs">
                FROM R, S
              </code>,
              "R × S (cartesian product)",
              "Becomes ⋈ once a matching WHERE predicate is found.",
            ],
            [
              <code key="c3" className="font-mono text-xs">
                FROM R JOIN S ON ...
              </code>,
              "R ⋈ S (theta-join)",
              "Already explicit — no cartesian intermediate step needed.",
            ],
            [
              <code key="c4" className="font-mono text-xs">
                WHERE c
              </code>,
              <span key="o4">
                σ<sub>c</sub> (selection)
              </span>,
              "Conjunctions split into cascaded σ's (rule R1 in Ch 19).",
            ],
            [
              <code key="c5" className="font-mono text-xs">
                GROUP BY g
              </code>,
              <span key="o5">
                <MathInline expression="{}_g\mathcal{G}_{\text{agg}}" />{" "}
                (grouping & aggregation)
              </span>,
              "Group attributes on the left, aggregate functions on the right.",
            ],
            [
              <code key="c6" className="font-mono text-xs">
                HAVING c
              </code>,
              <span key="o6">
                σ<sub>c</sub> above the 𝒢
              </span>,
              "HAVING is WHERE for groups — same operator, different input.",
            ],
            [
              <code key="c7" className="font-mono text-xs">
                ORDER BY a
              </code>,
              "τ (sort) at the root",
              "Often realized physically by an external-sort pass (§2).",
            ],
            [
              <code key="c8" className="font-mono text-xs">
                DISTINCT
              </code>,
              "δ (duplicate elimination)",
              "Sort or hash based — see §5 (Other Operations).",
            ],
          ]}
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          The only subtlety is the FROM/WHERE interaction: a comma in the FROM
          clause <em>literally</em> produces a cartesian product. It only
          becomes a join when the translator (or the heuristic optimizer of
          Chapter 19) notices a join predicate in the WHERE clause and applies
          equivalence rule R7 (
          <MathInline expression="\sigma_c(R \times S) \equiv R \bowtie_c S" />
          ).
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">A translation, step by step</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Take the classic query:{" "}
          <em>
            names of employees earning over 50k, together with their department
            name
          </em>
          .
        </p>
        <CodeBlock
          lang="sql"
          title="query"
          code={`SELECT e.name, d.dname
FROM employee e, department d
WHERE e.dno = d.dnumber
  AND e.salary > 50000;`}
        />
        <StepByStep
          steps={[
            {
              title: "FROM produces leaves",
              content:
                "Two leaves appear: employee and department. At this moment, no join exists yet — the comma translates to a cartesian product node above them.",
            },
            {
              title: "WHERE produces selections",
              content:
                "The conjunction splits into two conditions (R1). The join condition (e.dno = d.dnumber) stays with the cartesian product; the single-table condition (e.salary > 50000) becomes a σ above employee.",
            },
            {
              title: "× + join predicate ⇒ ⋈",
              content:
                "The translator (or optimizer) recognises a cartesian product sitting directly below a selection whose predicate uses attributes of both sides. It fuses them into a theta-join with that predicate.",
            },
            {
              title: "SELECT produces a projection at the root",
              content: (
                <>
                  A π<sub>name, dname</sub> sits at the top of the tree,
                  discarding every other column. Nothing downstream needs those
                  columns, so the optimizer is free to push the projection
                  further down later.
                </>
              ),
            },
          ]}
        />
        <InfoCallout variant="example" title="The resulting tree">
          <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
            {`               π_{name, dname}
                     │
             ⋈_{e.dno = d.dnumber}
              │                 │
     σ_{salary > 50000}    department
              │
          employee`}
          </pre>
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Nested queries</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A subquery is another query block. How it connects to the outer block
          depends on whether it <em>references</em> the outer block.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<NetworkIcon />} title="Uncorrelated">
            The inner block does not mention any outer attribute. It is
            evaluated once; the result is a constant set the outer block
            compares against. Cheap.
          </ConceptCard>
          <ConceptCard icon={<ArrowRightLeftIcon />} title="Correlated">
            The inner block references outer attributes (e.g.{" "}
            <code className="font-mono text-xs">e.dno = d.dnumber</code> inside
            an EXISTS). Conceptually re-evaluated for every outer row — but the
            optimizer tries very hard to rewrite it as a join.
          </ConceptCard>
        </div>
        <ComparisonTable
          headers={["SQL idiom", "Algebra rewrite", "Why"]}
          rows={[
            [
              <code key="a1" className="font-mono text-xs">
                x IN (SELECT y FROM ...)
              </code>,
              "semi-join ⋉",
              "Outer rows whose x matches some y. Duplicates on the right are irrelevant.",
            ],
            [
              <code key="a2" className="font-mono text-xs">
                x NOT IN (SELECT y ...)
              </code>,
              "anti-join ▷",
              "Outer rows with no matching y. NULLs make this subtle — NOT IN + NULL kills the match.",
            ],
            [
              <code key="a3" className="font-mono text-xs">
                EXISTS (SELECT 1 ...)
              </code>,
              "semi-join ⋉",
              "Identical to IN in the non-NULL case; clearer when the subquery has multiple predicates.",
            ],
            [
              <code key="a4" className="font-mono text-xs">
                NOT EXISTS (...)
              </code>,
              "anti-join ▷",
              "NULL-safe cousin of NOT IN. Preferred idiom in practice.",
            ],
            [
              <code key="a5" className="font-mono text-xs">
                x = (SELECT MAX(y) ...)
              </code>,
              "scalar subquery",
              "Inner block yields a single value; outer block treats it as a constant at evaluation time.",
            ],
          ]}
        />
        <InfoCallout
          variant="tip"
          title="Why correlated subqueries are 'unnested'"
        >
          A naïve implementation of a correlated subquery runs the inner block
          once per outer row — an{" "}
          <MathInline expression="O(n \cdot \text{inner cost})" /> plan that
          scales poorly. Every serious optimizer rewrites correlated IN / EXISTS
          into an explicit semi-join so it can be executed by a single hash or
          sort-merge pass. PostgreSQL calls this pass <em>subquery pull-up</em>;
          you can see it in the plan as a{" "}
          <code className="font-mono text-xs">Hash Semi Join</code> node.
        </InfoCallout>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">Query tree vs. query graph</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The book distinguishes two representations. They are not rivals — they
          capture different stages of the same idea.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptCard icon={<GitBranchIcon />} title="Query tree (algebra)">
            Leaves are base relations; internal nodes are σ, π, ⋈, 𝒢, ∪, etc.
            The tree <em>encodes an execution order</em> — children run before
            parents. Two equivalent trees can describe the same result with
            different costs, which is exactly what Chapter 19 exploits.
          </ConceptCard>
          <ConceptCard icon={<FilterIcon />} title="Query graph (calculus)">
            Nodes are relations and attributes; edges are join predicates and
            selection conditions. There is <em>no</em> implicit order. It is a
            single canonical representation — useful as an input to a cost-based
            optimizer that will build many candidate trees from it.
          </ConceptCard>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Most textbook examples use query trees, because algorithms and costs
          are both order-sensitive. System R&apos;s dynamic-programming join
          enumerator (§19.4) effectively walks the query graph and materialises
          only the cheapest left-deep tree per subset.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">In PostgreSQL</SectionHeading>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Everything on this page corresponds to real stages of the Postgres
          planner. After parsing, the internal tree (a{" "}
          <code className="font-mono text-xs">Query *</code> node) is already in
          an algebra-like form; the planner then drives the transformations of
          Chapter 19. <code className="font-mono text-xs">EXPLAIN</code> shows
          the <em>physical</em> tree that results — algorithms chosen, access
          paths picked — but its shape is a direct descendant of the algebra
          tree built here.
        </p>
        <CodeBlock
          lang="sql"
          title="psql — the algebra tree becomes a physical plan"
          code={`-- The query from earlier
EXPLAIN (VERBOSE, COSTS OFF)
SELECT e.name, d.dname
FROM employee e, department d
WHERE e.dno = d.dnumber
  AND e.salary > 50000;

-- You will see something like:
--   Hash Join
--     Hash Cond: (e.dno = d.dnumber)
--     -> Seq Scan on employee e
--          Filter: (salary > 50000)     <-- σ pushed below the join
--     -> Hash
--          -> Seq Scan on department d

-- Force-unnest a subquery and watch the algebra: IN → Semi Join
EXPLAIN (COSTS OFF)
SELECT dname FROM department
WHERE dnumber IN (SELECT dno FROM employee WHERE salary > 50000);
-- Hash Semi Join  (the semi-join operator, literally)`}
        />
      </AnimatedSection>

      <InfoCallout variant="tip" title="What to take away">
        SQL translation is mechanical, but it sets the <em>shape</em> of
        everything that follows. Master the six or seven mappings in the table
        above and you can hand-translate any query in the book. When we build
        the Query Tree Transformer in §19.1, each rule will nudge this tree into
        a cheaper equivalent — and you&apos;ll recognise every operator it
        manipulates.
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
