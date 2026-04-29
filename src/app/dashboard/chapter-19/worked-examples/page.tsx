import { BookOpenIcon, ListChecksIcon, BeakerIcon } from "lucide-react";
import { codeToHtml } from "shiki";
import { PageHeader } from "@/components/content/page-header";
import { AnimatedSection } from "@/components/content/animated-section";
import { SectionHeading } from "@/components/content/section-heading";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";
import { ConceptCard } from "@/components/content/concept-card";
import { ExampleWalkthrough } from "@/components/simulators/worked-examples/example-walkthrough";
import { WORKED_EXAMPLES } from "@/components/simulators/worked-examples/examples-data";
import { CodeBlock } from "@/components/content/code-block";

export default async function Page() {
  const sqlHtml: Record<string, string> = {};
  for (const e of WORKED_EXAMPLES) {
    sqlHtml[e.id] = await codeToHtml(e.sql, {
      lang: "sql",
      theme: "vitesse-dark",
    });
  }
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge="Chapter 19 · Worked Examples"
        title="Reading an optimized query plan"
        description="Four end-to-end examples — from the original SQL to the final relational-algebra tree, the algorithm chosen for each operator, and the asymptotic cost. Click any step to read the reasoning."
        icon={<BookOpenIcon />}
      />

      <AnimatedSection>
        <SectionHeading as="h2">How to read this page</SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          Each example shows the SQL, the assumptions about indexes and data
          distribution, and the optimized plan as an ordered list of operators.
          The list is bottom-up: leaves first, root (final projection) last.
          Each step has its own Big-O — the total at the bottom composes them.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard
            icon={<ListChecksIcon />}
            title="Pushed-down vs. left-up"
          >
            Filters that aren&apos;t very selective stay above the join. A
            highly selective join path can shrink the input more aggressively
            than an independent table scan.
          </ConceptCard>
          <ConceptCard icon={<BeakerIcon />} title="Algorithm per operator">
            Each step names the chosen access method (index nested-loop, hash
            join, merge sort, etc.). That&apos;s how an algebra tree becomes an
            executable plan.
          </ConceptCard>
          <ConceptCard icon={<BookOpenIcon />} title="Compose the costs">
            Read the per-step Big-O badges, then look at the total. A linear
            (|R|) term anywhere in the plan dominates the rest — that&apos;s
            usually where the real cost lives.
          </ConceptCard>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">The four examples</SectionHeading>
        <ExampleWalkthrough examples={WORKED_EXAMPLES} sqlHtml={sqlHtml} />
      </AnimatedSection>

      <AnimatedSection>
        <SectionHeading as="h2">
          How to test new examples yourself
        </SectionHeading>
        <p className="leading-relaxed text-muted-foreground">
          The easiest way to check whether a hand-drawn plan is plausible is to
          translate it to PostgreSQL and read{" "}
          <code className="font-mono text-xs">EXPLAIN ANALYZE</code>.
        </p>
        <CodeBlock
          lang="sql"
          title="psql — verify your reasoning end-to-end"
          code={`-- 1. Set up a tiny realistic dataset
CREATE TABLE pais     (idP int PRIMARY KEY, nome text UNIQUE);
CREATE TABLE individuo(idI int PRIMARY KEY, dtNasc date);
CREATE TABLE migra    (idM int PRIMARY KEY, idI int, idPO int, idPD int,
                       dtMigra date,
                       FOREIGN KEY (idI)  REFERENCES individuo,
                       FOREIGN KEY (idPO) REFERENCES pais(idP),
                       FOREIGN KEY (idPD) REFERENCES pais(idP));

-- 2. Add the indexes you assumed in the algebra tree
CREATE INDEX ON migra(idPO);
CREATE INDEX ON migra(idPD);
CREATE INDEX ON migra(dtMigra);
CREATE INDEX ON individuo(dtNasc);
ANALYZE; -- so the planner has stats

-- 3. Force-feed selectivity by inserting realistic distributions:
INSERT INTO pais SELECT g, 'Country_'||g FROM generate_series(1,250) g;
INSERT INTO individuo
  SELECT g, '1950-01-01'::date + (random()*30000)::int
  FROM generate_series(1, 10_000_000) g;
-- Insert 5 million random migration records
INSERT INTO migra
SELECT g, 
       (random()*9999999 + 1)::int, -- random idI (1 to 10M)
       (random()*249 + 1)::int,     -- random idPO (1 to 250)
       (random()*249 + 1)::int,     -- random idPD (1 to 250)
       '2010-01-01'::date + (random()*5000)::int -- random dtMigra
FROM generate_series(1, 5_000_000) g;

-- CRITICAL: Update statistics again so the planner knows about the data!
ANALYZE;
-- 4. Run EXPLAIN (ANALYZE, BUFFERS) — that is the ground-truth plan
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT pd.nome, COUNT(*) AS n
FROM   individuo i JOIN migra m ON i.idI = m.idI
       JOIN pais po ON m.idPO = po.idP
       JOIN pais pd ON m.idPD = pd.idP
WHERE  i.dtNasc >= '2000-01-01' AND
       m.dtMigra >= '2020-01-01' AND
       po.nome = 'Brasil'
GROUP  BY pd.nome
HAVING COUNT(*) > 10
ORDER  BY n DESC;`}
        />
        <InfoCallout variant="tip" title="Compare your tree to Postgres'">
          The plan node names map onto algebra: <em>Index Scan</em> = index
          access; <em>Bitmap Heap Scan</em> = strategy S9; <em>Hash Join</em> =
          J5; <em>Merge Join</em> = J4; <em>Nested Loop</em> = J2 or J3
          depending on the inner; <em>HashAggregate</em> = hash-based 𝒢;{" "}
          <em>Sort</em> = τ. If you see <em>Seq Scan</em> on a table you
          expected to lookup by index, your assumed selectivity was probably
          wrong.
        </InfoCallout>
        <InfoCallout variant="warning" title="Selectivity is the killer">
          Postgres won&apos;t use an index just because one exists — it consults
          pg_statistic. To make your hand-drawn plan match the planner&apos;s
          output, you have to insert data with the SAME distributional
          assumptions you used on paper (e.g. very few &lsquo;protozoário&rsquo;
          agents, far more &lsquo;bactéria&rsquo;). Without that, the planner
          will rightfully pick a different strategy.
        </InfoCallout>
        <InfoCallout variant="info" title="Three ways to challenge a plan">
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>
              Toggle <code className="font-mono text-xs">enable_hashjoin</code>,{" "}
              <code className="font-mono text-xs">enable_mergejoin</code>,{" "}
              <code className="font-mono text-xs">enable_nestloop</code> off one
              at a time and see how the cost shifts.
            </li>
            <li>
              Drop an index, run{" "}
              <code className="font-mono text-xs">ANALYZE</code>, re-EXPLAIN.
              The new plan tells you what that index was buying.
            </li>
            <li>
              Use{" "}
              <code className="font-mono text-xs">
                SET statistics_target = 1000
              </code>{" "}
              on the column you&apos;re reasoning about — gives the planner
              finer histograms and reveals which selectivity estimate it&apos;s
              actually using.
            </li>
          </ol>
        </InfoCallout>
      </AnimatedSection>

      <PageNavigation />
    </div>
  );
}
