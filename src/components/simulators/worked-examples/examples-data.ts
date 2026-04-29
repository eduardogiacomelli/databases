import type { WorkedExample } from "./example-walkthrough";

export const WORKED_EXAMPLES: WorkedExample[] = [
  {
    id: "ex1",
    shortTitle: "Ex 1 · Aluno/Disciplina",
    title: "Top students of INE5616 with professor 'FILETO' (post-2010)",
    visualUrl: "/otimizacao-fisica",
    question:
      "Find name and date-of-birth of students with IAA > 7, born after 1990, who have taken the discipline INE5616 with professor 'FILETO' in any class after 2010.",
    sql: `SELECT A.idA, A.nome, A.dt_nasc
FROM    Aluno A, Matricula MT, Turma T,
        Disciplina D, Leciona L, Professor P
WHERE   MT.idA = A.idA AND MT.idT = T.idT AND
        T.idD = D.idD AND L.idT = T.idT AND
        L.idP = P.idP AND
        A.iaa > 7 AND A.dt_nasc > '31/12/1990' AND
        T.ano > 2010 AND
        D.sigla = 'INE5616' AND P.apelido = 'FILETO';`,
    schema: [
      { name: "Aluno (A)", description: "Students. Many rows; few match the IAA/dt_nasc filters." },
      { name: "Matrícula (MT)", description: "Enrollment fact table — biggest. Links Aluno ↔ Turma." },
      { name: "Turma (T)", description: "Classes. T.ano filter is weak (a lot post-2010)." },
      { name: "Disciplina (D)", description: "Disciplines. SIGLA is unique → INE5616 is a single row." },
      { name: "Leciona (L)", description: "Teaching assignments — Professor ↔ Turma." },
      { name: "Professor (P)", description: "Faculty. APELIDO 'FILETO' is one row." },
    ],
    assumptions: [
      "Primary index on every PK; secondary indexes on all FKs and on D.SIGLA, P.APELIDO, A.IAA, A.DT_NASC, T.ANO.",
      "INE5616 disciplina exists once. 'FILETO' professor exists once.",
      "Many turmas per disciplina, many matrículas per turma, many alunos overall.",
    ],
    keyInsight:
      "The unique-key lookups on D.SIGLA and P.APELIDO start with cardinality 1 and propagate small intermediate results upward through index nested-loops. Selections on Aluno (IAA, DT_NASC) stay above the join because they are NOT very selective in absolute terms — the join path already shrinks the result more aggressively.",
    steps: [
      {
        id: "1",
        kind: "leaf",
        expr: "σ_{D.SIGLA = 'INE5616'}(D)",
        title: "Find the disciplina row",
        algorithm: "Index lookup on the secondary index over D.SIGLA",
        reasoning:
          "SIGLA is unique. One descent of a B+ tree returns a single tuple. Cheapest possible starting point.",
        bigO: "O(\\log|D|)",
      },
      {
        id: "2",
        kind: "join",
        expr: "D ⋈ T  on  D.idD = T.idD",
        title: "All turmas of INE5616",
        algorithm: "Index nested-loop using secondary index on T.idD",
        reasoning:
          "Only ONE D-row drives the loop. We probe T's index for that idD and pull all matching turma blocks. The filter T.ANO > 2010 is checked in memory on those rows — no extra I/O.",
        bigO: "O(\\log|T| + k_{DT})",
        note:
          "Pushing σ(T.ANO > 2010) below the join would force an independent scan of Turma — much worse, because ANO > 2010 still matches lots of rows.",
      },
      {
        id: "3",
        kind: "leaf",
        expr: "σ_{P.APELIDO = 'FILETO'}(P)",
        title: "Find the professor row",
        algorithm: "Index lookup on P.APELIDO",
        reasoning: "Single tuple. Same shape as step 1.",
        bigO: "O(\\log|P|)",
      },
      {
        id: "4",
        kind: "join",
        expr: "P ⋈ L  on  P.idP = L.idP",
        title: "All teaching assignments of 'FILETO'",
        algorithm: "Index nested-loop on L.idP",
        reasoning:
          "One P-row → look up its idP in Leciona's secondary index. Yields the small set of (idP, idT) rows where FILETO teaches.",
        bigO: "O(\\log|L| + k_{PL})",
      },
      {
        id: "5",
        kind: "join",
        expr: "(D⋈T) ⋈ (P⋈L)  on  T.idT = L.idT",
        title: "Turmas of INE5616 actually taught by FILETO",
        algorithm: "Hash join — both sides are already small in-memory result sets",
        reasoning:
          "Two small intermediate results → build a hash table on the smaller (probably P⋈L) and probe with the other. No disk involvement; this is an in-memory computation.",
        bigO: "O(k_{DT} + k_{PL})",
      },
      {
        id: "6",
        kind: "join",
        expr: "(...) ⋈ MT  on  MT.idT = T.idT",
        title: "All enrollments in those turmas",
        algorithm: "Index nested-loop on MT.idT",
        reasoning:
          "For each surviving idT (a handful of values), probe Matrícula's index by idT. Yields the candidate enrollment rows.",
        bigO: "O(k \\cdot \\log|MT| + k_{MT})",
      },
      {
        id: "7",
        kind: "join",
        expr: "(...) ⋈ A  on  MT.idA = A.idA",
        title: "Lookup each student",
        algorithm: "Index nested-loop on A.idA (primary key)",
        reasoning:
          "For each enrollment row, fetch the corresponding Aluno tuple via primary index. Cheaper than a sort-merge because |MT-result| is small.",
        bigO: "O(k_{MT} \\cdot \\log|A|)",
      },
      {
        id: "8",
        kind: "select",
        expr: "σ_{A.IAA > 7 \\;\\wedge\\; A.dt\\_nasc > '31/12/1990'}",
        title: "Apply the Aluno filters in memory",
        algorithm: "CPU filter — no I/O",
        reasoning:
          "Conditions checked on tuples already loaded by the previous join step. Free in I/O terms.",
        bigO: "O(k_{MT})",
      },
      {
        id: "9",
        kind: "project",
        expr: "π_{A.idA, A.nome, A.dt\\_nasc}",
        title: "Final projection",
        reasoning:
          "Drop unused columns. Streaming, no extra I/O.",
        bigO: "O(k_{final})",
      },
    ],
    totalBigO:
      "O(\\log|D| + \\log|T| + \\log|P| + \\log|L| + k_{MT}\\log|A|)",
    totalReasoning:
      "Every term is either a logarithmic index descent or a small-cardinality multiplier. No table is fully scanned — and that's the whole point of this strategy.",
  },

  {
    id: "ex2",
    shortTitle: "Ex 2 · Agente/Doença",
    title: "Protozoan agents with above-average obituaries in SC since 2012",
    visualUrl: "/otimizacao-fisica-2",
    question:
      "List names of protozoan agents with more 'óbito' cases in SC since 26/09/2012 than the average cases-per-agent ratio in the whole database.",
    sql: `SELECT A.nome, COUNT(C.*) AS NroCasos
FROM   Agente A, Ocasiona O, Doenca D, Caso C
WHERE  A.codag = O.codag AND O.codd = D.codd AND
       D.codd = C.codd AND
       A.tipo = 'protozoario' AND
       C.data >= '26/09/2012' AND C.uf = 'SC' AND
       C.situacao = 'Obito'
GROUP  BY A.NOME
HAVING NroCasos > (SELECT COUNT(*) FROM Caso /
                   SELECT COUNT(*) FROM Agente);`,
    schema: [
      { name: "Agente (A)", description: "Pathogens. 'protozoário' is highly selective." },
      { name: "Ocasiona (O)", description: "Agent ↔ Disease assoc. table." },
      { name: "Doença (D)", description: "Diseases. Mostly pass-through here." },
      { name: "Caso (C)", description: "Health-event fact table — biggest. Filtered by UF/situação/data." },
    ],
    assumptions: [
      "Primary indexes on every PK; secondary indexes on FKs and on Agente.tipo, Caso.(data, uf, situação).",
      "Far fewer protozoários than 'Caso.situação=Óbito ∧ uf=SC ∧ data≥26/09/2012'.",
      "Subquery scans the whole Caso and Agente — but only twice, once at startup.",
    ],
    keyInsight:
      "Two highly selective access paths converge: Agente.tipo cuts agents very aggressively; the bitmap-AND on Caso (uf=SC, situação=Óbito, data≥…) cuts cases. The expensive parts (the joins) operate on already-shrunk inputs. The HAVING subquery is two full scans done ONCE up-front; their result is a single scalar.",
    steps: [
      {
        id: "1",
        kind: "leaf",
        expr: "σ_{A.tipo = 'protozoario'}(A)",
        title: "Filter Agente via index on tipo",
        algorithm: "Secondary-index scan + heap fetch",
        reasoning:
          "tipo='protozoário' is rare. Index returns RIDs, fetch the matching Agente blocks.",
        bigO: "O(\\log|A| + k_A)",
      },
      {
        id: "2",
        kind: "leaf",
        expr: "σ_{C.data \\ge \\ldots \\wedge C.uf = 'SC' \\wedge C.situacao = 'Obito'}(C)",
        title: "Filter Caso via bitmap AND",
        algorithm: "Bitmap index scan on three indexes, AND, then heap fetch (S9)",
        reasoning:
          "Each clause is moderately selective; AND-ing the bitmaps eliminates almost every Caso before any data block is touched. Postgres' BitmapAnd plan literally.",
        bigO: "O(k_c)",
      },
      {
        id: "3",
        kind: "project",
        expr: "π_{codc, codd}",
        title: "Project Caso to needed columns",
        reasoning:
          "Drop everything except join key + grouping target. Streaming through the bitmap fetch.",
        bigO: "O(k_c)",
      },
      {
        id: "4",
        kind: "join",
        expr: "A ⋈ O  on  A.codag = O.codag",
        title: "Match each protozoário to its Doenças",
        algorithm: "Index nested-loop on O.codag",
        reasoning:
          "Few protozoários (k_A) → each probes Ocasiona's secondary index. Yields k_A·avg_doencas rows.",
        bigO: "O(k_A \\cdot \\log|O| + K_{AO})",
      },
      {
        id: "5",
        kind: "join",
        expr: "(A⋈O) ⋈ (filtered C)  on  O.codd = C.codd",
        title: "Pair surviving cases with their agents",
        algorithm: "Hash join — both sides already small",
        reasoning:
          "A⋈O has K_AO rows; filtered C has k_c rows. Build a hash on the smaller and probe with the other. No more disk I/O on the relations themselves.",
        bigO: "O(K_{AO} + k'_c)",
      },
      {
        id: "6",
        kind: "group",
        expr: "_{A.nome}\\mathcal{G}_{COUNT(C.codc) → NroCasos}",
        title: "Aggregate: count cases per agent name",
        algorithm: "Hash aggregation in memory",
        reasoning:
          "Result of the previous join is small. One scan, build a hash on A.nome, accumulate counts.",
        bigO: "O(k)",
      },
      {
        id: "7",
        kind: "leaf",
        expr: "(SELECT COUNT(*) FROM Caso) / (SELECT COUNT(*) FROM Agente)",
        title: "Compute the HAVING threshold (subquery)",
        algorithm: "Two index-only sequential scans",
        reasoning:
          "Both COUNT(*) can use a covering index — Postgres often counts via primary index. Either way it's O(|C|+|A|), executed once at the start of the plan, not per row.",
        bigO: "O(|C| + |A|)",
        note:
          "This is the only term that scales with the full table sizes. Everything else is logarithmic or driven by small intermediate cardinalities.",
      },
      {
        id: "8",
        kind: "having",
        expr: "σ_{NroCasos > MediaCasos}",
        title: "HAVING filter",
        algorithm: "CPU filter against the precomputed scalar",
        reasoning:
          "Subquery already produced a single number. Compare each group's count against it.",
        bigO: "O(k')",
      },
      {
        id: "9",
        kind: "project",
        expr: "π_{A.nome, NroCasos}",
        title: "Final projection",
        reasoning: "Streaming. Done.",
        bigO: "O(k')",
      },
    ],
    totalBigO: "O(\\log|O| + K_{AO} + |C| + |A|)",
    totalReasoning:
      "The dominant terms are the two full scans needed by the HAVING subquery — they swamp every other operation. Without that subquery, the whole plan would be sub-linear in |C|.",
  },

  {
    id: "ex3",
    shortTitle: "Ex 3 · Médico/Atestado",
    title: "Top SC doctors with more attestations than the in-state average",
    visualUrl: "/otimizacao-fisica-3",
    question:
      "List CRM, name, attestation count, and distinct-patient count of doctors in SC who have issued attestations to SC patients since 2012-01-01 about a disease whose specialty differs from theirs, with above-average attestation count, ordered DESC.",
    sql: `SELECT M.CRM, M.nome, COUNT(A.*) AS nAtests,
       COUNT(DISTINCT P.codP)
FROM   Atestado A, Medico M, Paciente P, Doenca D
WHERE  A.CRM = M.CRM AND A.codP = P.codP AND
       A.codD = D.codD AND
       A.estado = M.estado AND A.data >= '01/01/12' AND
       D.espec <> M.espec AND
       M.estado = 'SC' AND P.estado = 'SC'
GROUP  BY M.CRM, M.nome
HAVING nAtests > (SELECT COUNT(*) / COUNT(DISTINCT CRM)
                  FROM Atestado)
ORDER  BY nAtests DESC;`,
    schema: [
      { name: "Médico (M)", description: "Doctors. estado='SC' is moderately selective." },
      { name: "Atestado (A)", description: "Big fact table. data ≥ 2012-01-01 weakly selective." },
      { name: "Paciente (P)", description: "Patients. estado='SC' filters here too." },
      { name: "Doença (D)", description: "Diseases. Small reference table." },
    ],
    assumptions: [
      "PK indexes on every table; secondary indexes on M.estado, P.estado, A.data, FKs.",
      "Millions of patients and atestados; thousands of doctors and diseases.",
      "Subquery counts all atestados once; produces one scalar.",
    ],
    keyInsight:
      "Two semi-symmetric Hash Joins between filtered M, A, and P: each side is shrunk independently before joining. D is small enough to scan; the predicate D.espec ≠ M.espec is checked as part of the (M,A,D) hash join. The FINAL ORDER BY uses external merge sort over the already-small grouped result.",
    steps: [
      {
        id: "1",
        kind: "leaf",
        expr: "σ_{M.estado = 'SC'}(M)",
        title: "Filter doctors by state",
        algorithm: "Index lookup on M.estado",
        reasoning: "k_M ≪ |M| — only SC doctors survive.",
        bigO: "O(\\log|M| + k_M)",
      },
      {
        id: "2",
        kind: "project",
        expr: "π_{CRM, nome, espec, estado}",
        title: "Project M to needed columns",
        reasoning: "Streaming. Reduces tuple width before joining.",
        bigO: "O(k_M)",
      },
      {
        id: "3",
        kind: "leaf",
        expr: "σ_{A.data \\ge '01/01/12'}(A)",
        title: "Filter atestados by date",
        algorithm: "Index range scan on A.data",
        reasoning:
          "Range scan from 2012 onwards. k_A is large but smaller than |A|.",
        bigO: "O(\\log|A| + k_A)",
      },
      {
        id: "4",
        kind: "join",
        expr: "M ⋈ A  on  M.CRM = A.CRM \\wedge M.estado = A.estado",
        title: "Doctors meet their attestations",
        algorithm: "Hash join (build M, probe A)",
        reasoning:
          "M is the smaller side. The composite predicate is fully evaluable from join keys; no extra filter pass.",
        bigO: "O(k_M + k_A)",
      },
      {
        id: "5",
        kind: "leaf",
        expr: "D",
        title: "Scan Doença",
        algorithm: "Sequential scan (small table)",
        reasoning:
          "|D| is small enough that a full scan beats any index plan.",
        bigO: "O(|D|)",
      },
      {
        id: "6",
        kind: "join",
        expr: "(M⋈A) ⋈ D  on  A.codD = D.codD \\wedge M.espec \\ne D.espec",
        title: "Attach disease, enforce specialty mismatch",
        algorithm: "Hash join + residual filter",
        reasoning:
          "Hash on D.codD, probe with (M⋈A). Mismatch predicate is a CPU filter applied to each match.",
        bigO: "O(k_{AM} + |D|)",
      },
      {
        id: "7",
        kind: "leaf",
        expr: "σ_{P.estado = 'SC'}(P)",
        title: "Filter patients by state",
        algorithm: "Index lookup on P.estado",
        reasoning: "Same pattern as the M filter.",
        bigO: "O(\\log|P| + k_P)",
      },
      {
        id: "8",
        kind: "join",
        expr: "(...) ⋈ P  on  A.codP = P.codP",
        title: "Final join with SC patients",
        algorithm: "Hash join",
        reasoning:
          "Two small filtered sides. Build on the smaller, probe with the other.",
        bigO: "O(k'_{AM} + k_P)",
      },
      {
        id: "9",
        kind: "group",
        expr: "_{CRM, nome}\\mathcal{G}_{COUNT(A), COUNT(DISTINCT P)}",
        title: "Aggregate per doctor",
        algorithm: "Hash aggregation",
        reasoning:
          "One pass over the joined result, two accumulators per group.",
        bigO: "O(k'')",
      },
      {
        id: "10",
        kind: "leaf",
        expr: "(SELECT COUNT(*) / COUNT(DISTINCT CRM) FROM Atestado)",
        title: "Compute average attestations per doctor",
        algorithm: "Index-only or sequential scan with two aggregates",
        reasoning:
          "Single scalar — executed once at startup. Same magnitude as |A|.",
        bigO: "O(|A|)",
      },
      {
        id: "11",
        kind: "having",
        expr: "σ_{nAtests > avg}",
        title: "HAVING filter",
        reasoning: "Compare each group's count to the precomputed scalar.",
        bigO: "O(k'')",
      },
      {
        id: "12",
        kind: "sort",
        expr: "τ_{nAtests \\;DESC}",
        title: "ORDER BY nAtests DESC",
        algorithm: "External merge sort if k''' doesn't fit in work_mem",
        reasoning:
          "k''' is small (only doctors above average), so this is usually an in-memory sort.",
        bigO: "O(k''' \\log k''')",
      },
    ],
    totalBigO: "O(|A|)",
    totalReasoning:
      "Asymptotically bound by the HAVING subquery's full Atestado scan. The main pipeline is dominated by the index range over A.data plus a sequence of cheap hash joins on small intermediates.",
  },

  {
    id: "ex4",
    shortTitle: "Ex 4 · Migra/País (late join)",
    title: "Top destinations of Brazilian emigrants born after 2000",
    visualUrl: "/otimizacao-fisica-4",
    question:
      "Find the destination countries (with full row PD.*) and the count of immigrants n that have received more than 10 000 Brazilian emigrants born since 2000-01-01 (migrating since 2020-01-01), ordered by n DESC.",
    sql: `SELECT  PD.*, COUNT(M.*) AS n
FROM    Individuo I JOIN Migra M ON I.idI = M.idI
        JOIN Pais PO ON M.idPO = PO.idP
        JOIN Pais AS PD ON M.idPD = PD.idP
WHERE   I.dtNasc >= '01/01/2000' AND
        M.dtMigra >= '01/01/2020' AND
        PO.nome = 'Brasil'
GROUP   BY PD.*
HAVING  n > 10000
ORDER   BY n DESCENDING;`,
    schema: [
      { name: "País (PO/PD)", description: "Reused as origin and destination via two aliases. Tiny table (≤ 250 rows)." },
      { name: "Migra (M)", description: "Migration events — biggest table." },
      { name: "Indivíduo (I)", description: "People — big, but accessed via FK." },
    ],
    assumptions: [
      "Primary index on each PK; secondary indexes on every FK and on I.dtNasc, M.dtMigra, País.nome.",
      "Brazil emigrations since 2020 are RARE relative to global emigrations — high selectivity.",
      "Brazilians born since 2000 emigrating since 2020 are FEWER than total people born since 2000.",
    ],
    keyInsight:
      "The advanced trick: GROUP BY runs BEFORE the join with PD. The HAVING n > 10 000 cuts the group count drastically, so when we finally join PD only the surviving destinations need to be looked up. Joining PD before grouping would force PD reads for every distinct destination — hundreds, instead of dozens.",
    steps: [
      {
        id: "1",
        kind: "leaf",
        expr: "σ_{PO.nome = 'Brasil'}(Pais)",
        title: "Find Brasil row (origin)",
        algorithm: "Index lookup on Pais.nome (candidate key)",
        reasoning: "Single tuple. Cheapest possible starting point.",
        bigO: "O(\\log|Pais|)",
      },
      {
        id: "2",
        kind: "join",
        expr: "PO ⋈ M  on  M.idPO = PO.idP",
        title: "Migrations originating in Brazil",
        algorithm: "Index nested-loop on M.idPO",
        reasoning: "One PO row → look up its idP in Migra's secondary index.",
        bigO: "O(\\log|M| + k_{PO})",
      },
      {
        id: "3",
        kind: "select",
        expr: "σ_{M.dtMigra \\ge '01/01/2020'}",
        title: "Filter to recent emigrations",
        algorithm: "CPU filter (already loaded)",
        reasoning:
          "Could also be pushed below the join, but the index path on PO already shrinks the row count enough that filtering above is essentially free.",
        bigO: "O(k_{PO})",
      },
      {
        id: "4",
        kind: "join",
        expr: "(...) ⋈ I  on  M.idI = I.idI",
        title: "Look up the individual",
        algorithm: "Index nested-loop on I.idI (primary key)",
        reasoning:
          "For each surviving migration, fetch the matching person via PK. Cheaper than scanning Indivíduo.",
        bigO: "O(k_{MB20} \\cdot \\log|I|)",
      },
      {
        id: "5",
        kind: "select",
        expr: "σ_{I.dtNasc \\ge '01/01/2000'}",
        title: "Filter to people born since 2000",
        algorithm: "CPU filter on already-loaded I tuples",
        reasoning:
          "Same logic as the dtMigra filter — pushed-down would scan Indivíduo independently for nothing.",
        bigO: "O(k_{MBI})",
      },
      {
        id: "6",
        kind: "group",
        expr: "_{M.idPD}\\mathcal{G}_{COUNT(M.*) → n}",
        title: "Group by destination, count",
        algorithm: "Hash aggregation in memory",
        reasoning:
          "Critical move: aggregate BEFORE joining PD. The output has at most one row per distinct destination — likely << 250.",
        bigO: "O(k_{MBI2000})",
        note:
          "This is the optimization that defines this example: aggregate first, then join the destination dimension only once per surviving group.",
      },
      {
        id: "7",
        kind: "having",
        expr: "σ_{n > 10000}",
        title: "Cut unpopular destinations",
        algorithm: "CPU filter",
        reasoning:
          "After this, only k_hav destinations remain. Likely a handful.",
        bigO: "O(k_{groups})",
      },
      {
        id: "8",
        kind: "join",
        expr: "(...) ⋈ PD  on  M.idPD = PD.idP",
        title: "Late join with País destination",
        algorithm: "Index nested-loop on PD.idP",
        reasoning:
          "Only k_hav lookups instead of one per matriculated tuple. PD.* (full row) is fetched only for surviving destinations.",
        bigO: "O(k_{hav} \\cdot \\log|Pais|)",
      },
      {
        id: "9",
        kind: "sort",
        expr: "τ_{n \\;DESC}",
        title: "Order results",
        algorithm: "Quicksort in memory",
        reasoning: "k_hav is tiny — fits easily in work_mem.",
        bigO: "O(k_{hav} \\log k_{hav})",
      },
    ],
    totalBigO: "O(\\log|Pais| + \\log|M| + k_{MBI} \\log|I|)",
    totalReasoning:
      "The aggregate-before-join trick keeps the cost of touching the País table proportional to the small group count, not to the |M|-sized intermediate result. The dominant term is the per-tuple PK lookup into Indivíduo.",
  },
];
