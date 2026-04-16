The highly selective path (Disciplina → Turma):
D.SIGLA = 'INE5616' is a primary key lookup — it returns exactly 1 record. That costs O(log|D|) via the index. Now when you join that single D record with Turma on T.IDD = D.IDD, you're doing an index nested-loop join: for that one IDD value, look it up in Turma's index. You get back maybe k_DT ≤ 20 turma records. Very cheap.
Now here's the key: why not also filter T.ANO > 2010 on the Turma table first? Because to do that filter independently, you'd need to either scan the entire Turma table (touching all its blocks) or use an index on ANO (if one exists). But T.ANO > 2010 is a range condition on a non-key attribute — it's not very selective. You might still get thousands of records and touch hundreds of blocks.
Instead, the optimizer's reasoning is: I already have only ~20 turma records from the D→T join. I can check ANO > 2010 on those 20 records for free (they're already in memory). Why would I independently scan Turma's blocks to filter first, when the join path already narrows it down more aggressively?
Same logic for Aluno:
A.IAA > 7 and A.DT_NASC > '31/12/1990' are both range conditions — moderately selective at best. Filtering Aluno independently might still return thousands of students and require scanning many blocks.
But look at the join path: after all the earlier joins (D→T→L→P→MT), you end up with maybe k' ≤ 1000 matrícula records. Each one has an IDA (student ID). For each IDA, you do an index lookup on Aluno: O(log|A|) per student. That's k' × log|A| block reads, and you only access the specific Aluno blocks you actually need. Then you check IAA > 7 and DT_NASC on those retrieved records — already in memory, zero extra I/O.
Compare that to the alternative: scan ALL of Aluno to find students with IAA > 7 born after 1990 (touching tons of blocks), then join that large intermediate result with Matrícula. Way more disk I/O.
The general principle:
The "push selections down" heuristic breaks when:

The selection is not very selective (range conditions on large tables — ANO > 2010 still matches many records)
There's a highly selective join path from the other side that narrows the result far more aggressively (primary key lookup → index join → small intermediate result)
The table has an index on the join attribute, so you can access just the specific records you need via the join result, rather than scanning

In that situation, it's cheaper to let the join path do the filtering implicitly, and apply the selection condition as a post-filter on the small join result.
Image 2 from your teacher shows this clearly — the selections on Aluno (IAA > 7, DT_NASC) are placed ABOVE the join with Matrícula, not pushed down to the Aluno leaf. And the T.ANO > 2010 is handled after the D→T join, not independently on Turma.
The complexity formula reflects this: O(log|D| + log|T| + k_DT + log|P| + k_p*log|L| + k_LP + k*log|MT| + k'\*log|A| + k_MTA) — notice there's no "scan all of Turma" or "scan all of Aluno" term. Every table access is either a log-cost index lookup or a small cardinality multiplier.
For your simulator: This is exactly what makes the Query Tree Transformer simulator interesting — it shouldn't just blindly push all selections down. It should show this trade-off: "pushing σ(T.ANO > 2010) down would cost X blocks, but leaving it above the join costs Y blocks because the join result is already small." That's what separates a good simulator from a textbook-rule-applier.
