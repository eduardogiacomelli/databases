# Chapters 18–19 Reference & Simulator Specs

> **How to use this file in Claude Code:**
> Each section below is a self-contained "topic card." When building a page,
> read ONLY the card for that topic + the corresponding raw chapter markdown.
> Build one page, test it, then move to the next.
>
> Build order (recommended):
> 1. ch18/sql-to-relational-algebra
> 2. ch18/external-sorting  
> 3. ch18/select-algorithms
> 4. ch18/join-algorithms
> 5. ch18/other-operations
> 6. ch18/pipelining
> 7. ch19/heuristic-optimization
> 8. ch19/cost-estimation
> 9. ch19/dp-optimization
> 10. ch19/semantic-optimization

---

## Chapter 18: Strategies for Query Processing

### Overview

Chapter 18 answers: "Given a SQL query, what physical algorithms can the DBMS
use to execute each operation?" It covers the full pipeline from SQL text to
execution, with concrete algorithms and their I/O cost formulas.

The query processing pipeline:
```
SQL query
  → Scanner/Parser (syntax check)
  → Validator (schema check)  
  → Query Tree (relational algebra)
  → Optimizer (Chapter 19) picks algorithms
  → Execution engine runs chosen algorithms
  → Result
```

Key figure: Figure 18.1 in the book — the "typical steps" diagram. 
Recreate this as an interactive flow diagram on the overview/intro page.

---

### TOPIC CARD 18.1 — SQL to Relational Algebra Translation

**Book section:** 18.1  
**Slug:** `sql-to-relational-algebra`  
**Has simulator:** YES — Query Tree Builder  
**Key concepts to cover:**

1. **Query blocks**: The basic unit of translation. A query block = one
   SELECT-FROM-WHERE expression (possibly with GROUP BY / HAVING).
   Nested queries → separate query blocks.

2. **Translation rules:**
   - `SELECT A1, A2 FROM R WHERE C` → π_{A1,A2}(σ_C(R))
   - `FROM R1, R2` → R1 × R2 (or R1 ⋈ R2 if WHERE has join condition)
   - `WHERE` conjunctions → cascade of σ operations
   - `GROUP BY` → 𝒢 (grouping/aggregation operator)
   
3. **Nested queries:**
   - Uncorrelated subquery: evaluate inner block once, use result in outer
   - Correlated subquery: inner block re-evaluated for each outer tuple
   - IN → semi-join (⋉)
   - NOT IN → anti-join (▷)
   - EXISTS → semi-join

4. **Query tree vs Query graph:**
   - Query tree: corresponds to relational algebra expression, 
     leaf = relation, internal node = operation, execution order = bottom-up
   - Query graph: corresponds to relational calculus, no implicit order,
     single canonical representation

**PostgreSQL tie-in:**
```sql
-- Show the query plan (the result of this whole pipeline)
EXPLAIN (VERBOSE) 
SELECT e.name, d.dname 
FROM employee e, department d 
WHERE e.dno = d.dnumber AND e.salary > 50000;

-- Show the plan with actual execution stats
EXPLAIN ANALYZE 
SELECT e.name, d.dname 
FROM employee e JOIN department d ON e.dno = d.dnumber
WHERE e.salary > 50000;
```

#### SIMULATOR SPEC: Query Tree Builder

**Purpose:** User writes (or selects) a SQL query → see it decompose into a 
relational algebra expression tree step by step.

**Inputs:**
- SQL query text input (with autocomplete/presets)
- Preset queries (start with these, user can also type custom):
  1. `SELECT name FROM employee WHERE salary > 50000`
  2. `SELECT name, dname FROM employee, department WHERE dno = dnumber AND salary > 50000`
  3. `SELECT dname FROM department WHERE dnumber IN (SELECT dno FROM employee WHERE salary > 50000)`
  4. `SELECT dno, AVG(salary) FROM employee GROUP BY dno HAVING AVG(salary) > 40000`

**Animation states (step by step):**
1. Show the SQL query highlighted by clause (SELECT = blue, FROM = green, WHERE = orange)
2. FROM clause → leaf nodes appear (one per table)
3. WHERE clause → if join condition, add ⋈ node above the two tables. If selection condition, add σ node.
4. If cartesian product + selection → show × first, then transform to ⋈ (with visual morph)
5. SELECT clause → add π node at top with projected attributes
6. If GROUP BY → add 𝒢 node
7. If nested query → show inner block building its own subtree, then connecting to outer tree

**Visual design:**
- Tree layout: root at top, leaves at bottom
- Each node is a rounded rectangle with:
  - Operation symbol (σ, π, ⋈, ×, 𝒢)
  - Condition or attribute list below
- Edges are animated (draw from child to parent)
- Active step's node pulses/glows
- Leaf nodes show table name + icon

**Output panel:**
- Relational algebra expression in text form (updates as tree builds)
- Node count, tree depth

**Edge cases to handle:**
- Single table, no join → just σ and π
- Self-join → same table appears as two leaves with aliases
- Three-way join → tree has two ⋈ nodes (left-deep by default)
- Subquery → nested tree with clear visual boundary

**Quality criteria:**
- Tree must be properly laid out (no overlapping nodes)
- Animation must be steppable (next/prev/play/reset)
- Each step must show which SQL clause is being processed
- Must handle at least the 4 preset queries correctly

---

### TOPIC CARD 18.2 — External Sorting

**Book section:** 18.2  
**Slug:** `external-sorting`  
**Has simulator:** YES — External Sort Animator  
**Key concepts to cover:**

1. **Why external sort matters:** Relations don't fit in memory. Sort-based
   algorithms (sort-merge join, ORDER BY, DISTINCT, GROUP BY) all need this.

2. **Sort-merge algorithm:**
   - **Phase 1 (run creation):** Read nB buffer blocks, sort in memory, 
     write sorted "run" to disk. Creates ⌈b/nB⌉ initial runs.
   - **Phase 2+ (merging):** Merge nB-1 runs at a time (1 buffer for output).
     Each pass reduces run count by factor of (nB-1).
   - Number of passes: ⌈log_{nB-1}(⌈b/nB⌉)⌉ + 1 (including initial sort)

3. **Cost formula:**
   ```
   nR = ⌈b/nB⌉               (number of initial runs)
   nP = ⌈log_{nB-1}(nR)⌉      (number of merge passes)
   Total block reads = 2 * b * (nP + 1)
   ```
   (Each pass reads and writes all b blocks once = 2b per pass)

4. **Example:** b = 1024 blocks, nB = 5 buffers
   - Initial runs: ⌈1024/5⌉ = 205 runs
   - Merge passes: ⌈log_4(205)⌉ = 4 passes
   - Total: 2 × 1024 × 5 = 10,240 block transfers

**PostgreSQL tie-in:**
```sql
-- See external sort in action
SET work_mem = '64kB';  -- force external sort
EXPLAIN ANALYZE SELECT * FROM large_table ORDER BY some_column;
-- Look for "Sort Method: external merge  Disk: XXXkB"

SET work_mem = '256MB';  -- allow in-memory sort
EXPLAIN ANALYZE SELECT * FROM large_table ORDER BY some_column;
-- Look for "Sort Method: quicksort  Memory: XXXkB"
```

#### SIMULATOR SPEC: External Sort Animator

**Purpose:** Visualize the sort-merge passes. User sees blocks being read into
buffers, sorted, written as runs, then merged pass by pass.

**Inputs:**
- File size in blocks `b`: slider, range 8–64 (default 16)
- Buffer size `nB`: slider, range 3–8 (default 4)
- Speed: slider (ms per step)
- Data: randomly generated integer keys, or user can type values

**Animation — Phase 1 (Run Creation):**
1. Show file as a row of `b` colored blocks (each block has ~3-4 visible keys)
2. Highlight nB blocks → "read into memory"
3. Show buffer area: blocks appear, keys rearrange (sort animation)
4. Write sorted run to a "Runs" area below, labeled "Run 1"
5. Repeat for next nB blocks → "Run 2", etc.
6. After all runs created, show "Phase 1 complete: nR runs of nB blocks each"

**Animation — Phase 2+ (Merge Passes):**
1. Show runs from previous pass in a column
2. Pick nB-1 runs, highlight them
3. Show one block from each run loaded into buffers (nB-1 input + 1 output)
4. Animate merge: smallest key from buffer heads → output buffer
5. When output buffer full → write to new run, show block appearing
6. When an input buffer exhausted → load next block from that run
7. After merging nB-1 runs → one larger run
8. Repeat for next group of nB-1 runs
9. After pass complete, show "Pass N complete: M runs"
10. Continue until 1 run remains

**Stats panel (live-updating):**
- Current phase/pass number
- Runs remaining
- Block I/Os so far (reads + writes separately)
- Formula: `Total = 2 × b × (passes + 1)`
- Progress bar toward completion

**Visual layout:**
```
┌─────────────────────────────────────────┐
│ Controls: [b slider] [nB slider] [speed]│
│ [Run] [Step] [Reset] [Random Data]      │
├─────────────────────────────────────────┤
│                                         │
│  FILE:  [B0][B1][B2]...[Bn]            │
│                                         │
│  BUFFERS: [buf0][buf1][buf2] → [out]    │
│                                         │
│  PASS 0 RUNS:  [R0][R1][R2]...[Rk]     │
│  PASS 1 RUNS:  [R0'][R1']...           │
│  PASS 2 RUNS:  [R0'']                  │
│                                         │
├─────────────────────────────────────────┤
│  Block I/Os: 48 reads + 48 writes = 96 │
│  Formula: 2 × 16 × 3 = 96             │
│  Passes: 3 (1 sort + 2 merge)          │
└─────────────────────────────────────────┘
```

**Quality criteria:**
- Merge step must show actual key comparison (which key is smallest)
- Must correctly handle last run being smaller than nB blocks
- Cost counter must match the formula exactly
- User should be able to pause mid-merge and see buffer contents

---

### TOPIC CARD 18.3 — Algorithms for SELECT

**Book section:** 18.3  
**Slug:** `select-algorithms`  
**Has simulator:** YES — SELECT Strategy Comparator  
**Key concepts to cover:**

1. **Search methods for selection (σ):**

   | Code | Method | Condition | Cost (block I/Os) |
   |------|--------|-----------|-------------------|
   | S1 | Linear search | Any | b/2 avg, b worst |
   | S2 | Binary search | Equality on ordering key | ⌈log₂(b)⌉ |
   | S3a | Primary index, equality | Equality on primary key | h_i + 1 |
   | S3b | Hash key, equality | Equality on hash key | 1 (no overflow), 1+ov (overflow) |
   | S4 | Primary index, range | Range on ordering key | h_i + ⌈b/2⌉ |
   | S5 | Clustering index, equality | Equality on clustering (non-key) | h_i + ⌈s/bfr⌉ |
   | S6 | Secondary (B+ tree), equality | Equality on non-ordering | h_i + 1 (key), h_i + s (non-key) |
   | S7 | Conjunctive, one index | AND conditions | Use one index + test rest |
   | S8 | Conjunctive, composite index | AND conditions matching composite | h_i + 1 |
   | S9 | Conjunctive, intersection | AND conditions, multiple indexes | Intersect record pointers |

   Where: b = file blocks, h_i = index height, s = selectivity (matching records), 
   bfr = blocking factor, ov = overflow buckets

2. **Conjunctive selection (AND):**
   - Strategy S7: pick the most selective condition that has an index, retrieve 
     those records, then check remaining conditions on each
   - Strategy S8: if a composite index matches the conjunction
   - Strategy S9: use multiple indexes, intersect the pointer sets, then retrieve

3. **Disjunctive selection (OR):**
   - If ALL conditions have indexes → union of pointer sets
   - If ANY condition lacks an index → must do linear scan (can't avoid it)

**PostgreSQL tie-in:**
```sql
-- See which select strategy Postgres picks
EXPLAIN ANALYZE SELECT * FROM employee WHERE ssn = '123456789';
-- → Index Scan (like S3a/S6)

EXPLAIN ANALYZE SELECT * FROM employee WHERE salary > 50000;
-- → Seq Scan with Filter (like S1) or Index Scan (S4/S6) depending on selectivity

EXPLAIN ANALYZE SELECT * FROM employee WHERE dno = 5 AND salary > 50000;
-- → might use one index + filter (S7) or bitmap index scan (S9-like)
```

#### SIMULATOR SPEC: SELECT Strategy Comparator

**Purpose:** User picks a selection condition and available indexes → see
multiple strategies execute side by side with I/O cost comparison.

**Inputs:**
- Table config: number of blocks `b` (slider 16–256), blocking factor `bfr`
- Selection condition (dropdown):
  - Equality on primary key (e.g., `WHERE ssn = X`)
  - Equality on non-key with clustering index (e.g., `WHERE dno = 5`)
  - Equality on non-key with secondary index
  - Range on ordering attribute
  - Conjunction of two conditions
- Available indexes (toggleable checkboxes):
  - Primary index on key (height h_i)
  - Clustering index on non-key
  - Secondary B+ tree index
  - Hash index
- Search key value (text input)

**Animation:**
- Show the file as a grid of blocks (like your existing file-access simulator)
- Run up to 3 strategies in parallel columns:
  - Column 1: Linear scan (always shown as baseline)
  - Column 2: Best available index strategy
  - Column 3: Second-best strategy (if applicable)
- Each column shows blocks being accessed (highlighted), with a running I/O counter
- For index strategies, show the index traversal above the data blocks

**Stats panel:**
- Table comparing: Strategy name | I/O formula | Computed cost | Actual blocks read
- Winner highlighted in green
- "Why?" tooltip explaining when each strategy is preferred

**Quality criteria:**
- Cost formulas must be correct and visibly computed (show the formula with values plugged in)
- Index traversal must show actual tree levels (not just a number)
- Conjunction case must show S7 approach (one index + filter remaining)

---

### TOPIC CARD 18.4 — Algorithms for JOIN

**Book section:** 18.4  
**Slug:** `join-algorithms`  
**Has simulator:** YES — Join Algorithm Animator  
**Key concepts to cover:**

1. **Join algorithms and their costs:**

   Let R have bR blocks, nR records; S have bS blocks, nS records.
   Buffer has nB frames.

   | Algorithm | Cost (block I/Os) | When to use |
   |-----------|-------------------|-------------|
   | **J1: Nested-loop** (tuple-level) | bR + nR × bS | Never in practice (terrible) |
   | **J2: Block nested-loop** | bR + ⌈bR/(nB-2)⌉ × bS | No index, small buffer. Use smaller relation as outer. |
   | **J3: Index nested-loop** | bR + nR × (h_i + 1) | Index exists on join attr of inner relation |
   | **J4: Sort-merge join** | Sort(R) + Sort(S) + bR + bS | Both large, no index, enough buffers to sort |
   | **J5: Hash join** | 3 × (bR + bS) | Equi-join, enough buffers for partition phase |

2. **Block nested-loop detail (J2):**
   - Load nB-2 blocks of R (outer) into memory
   - For each block of S (inner), compare all tuples in memory against S block
   - 1 buffer for S block, 1 buffer for output
   - Cost: bR + ⌈bR/(nB-2)⌉ × bS
   - **Critical insight:** always use the SMALLER relation as outer

3. **Sort-merge join detail (J4):**
   - Sort R on join attribute (external sort cost)
   - Sort S on join attribute (external sort cost)
   - Merge: scan both sorted files simultaneously, output matches
   - Merge phase cost: bR + bS (single pass through each)

4. **Hash join detail (J5):**
   - **Partition phase:** hash both R and S into M buckets using same hash function.
     Cost: read R + S, write R + S = 2(bR + bS)
   - **Probe phase:** for each bucket pair, load smaller one into memory hash table,
     scan the other. Cost: bR + bS
   - Total: 3(bR + bS)
   - Requirement: each partition of smaller relation must fit in memory

5. **Choosing the right algorithm:** depends on buffer size, indexes, relation sizes,
   whether join attrs are sorted. The optimizer (Ch 19) makes this choice.

**PostgreSQL tie-in:**
```sql
-- Force different join strategies
SET enable_hashjoin = off;
SET enable_mergejoin = off;
EXPLAIN ANALYZE
SELECT e.name, d.dname 
FROM employee e JOIN department d ON e.dno = d.dnumber;
-- → Nested Loop (only option left)

-- Reset and see what Postgres prefers
RESET ALL;
EXPLAIN ANALYZE ...
-- → Usually Hash Join for equi-joins on non-indexed columns
```

#### SIMULATOR SPEC: Join Algorithm Animator

**Purpose:** The crown jewel simulator for Chapter 18. User configures two
relations and buffer size → see join algorithms execute with real data and
compare their I/O costs.

**Inputs:**
- Relation R: size in blocks bR (slider 4–32), records per block
- Relation S: size in blocks bS (slider 4–32), records per block  
- Buffer size nB (slider 3–10)
- Join attribute values: auto-generated with configurable overlap %
- Algorithm selector: checkboxes for which algorithms to show (default: all)
- Index available on S's join attribute: toggle

**Core animation — Block Nested-Loop (J2):**
1. Show R blocks in a row (top), S blocks in a row (middle), output area (bottom)
2. Load nB-2 blocks of R into buffer area → highlight them
3. Scan S block by block:
   - Load one S block into buffer
   - Flash matching tuples (join attribute matches)
   - Matching tuples flow to output area
   - S block counter increments
4. After all S blocks scanned, load next chunk of R
5. Repeat until R exhausted

**Core animation — Sort-Merge (J4):**
1. Show R blocks (unsorted, colored randomly by join key)
2. Sort phase: R blocks rearrange into sorted order (external sort, can be abbreviated)
3. Same for S
4. Merge phase: two pointers (R-pointer, S-pointer) advance through sorted blocks
5. When join keys match → tuples flow to output
6. When keys don't match → advance the pointer with the smaller key

**Core animation — Hash Join (J5):**
1. Partition phase:
   - Hash function visualization: key → bucket number
   - R tuples flow into buckets (partition R)
   - S tuples flow into buckets (partition S)
   - Show buckets filling up
2. Probe phase:
   - For each bucket pair: load R-bucket into memory hash table
   - Scan S-bucket, probe the hash table
   - Matches flow to output

**Comparison mode (recommended default view):**
- 2×2 grid or tabbed view with all algorithms running on the SAME data
- Shared I/O counter at the bottom comparing all algorithms
- Bar chart showing cumulative I/O for each

**Stats panel:**
```
Algorithm         | Formula              | Cost  | Actual I/Os
─────────────────────────────────────────────────────
Block nested-loop | bR + ⌈bR/(nB-2)⌉×bS | 232   | 232 ✓
Sort-merge        | Sort(R)+Sort(S)+bR+bS| 180   | 180 ✓
Hash join         | 3×(bR+bS)           | 144   | 144 ✓
Index nested-loop | bR + nR×(hi+1)      | 520   | N/A (no index)
```

**Quality criteria:**
- MUST correctly implement the block nested-loop outer chunk size as nB-2 (not nB)
- Sort-merge must show the sort phase I/Os separately from the merge phase
- Hash join must show the partition phase and probe phase separately
- Changing buffer size nB must immediately recalculate all costs
- Swapping which relation is outer vs inner must show the cost difference
- "Use smaller as outer" button that auto-optimizes

---

### TOPIC CARD 18.5 — Other Operations (PROJECT, SET, AGGREGATE, OUTER JOIN)

**Book section:** 18.5  
**Slug:** `other-operations`  
**Has simulator:** NO (conceptual page with interactive cost comparison table)  
**Key concepts to cover:**

1. **PROJECT (π):** The expensive part is duplicate elimination.
   - Sort-based: sort on projected attributes, scan to remove adjacent duplicates.
     Cost: sort cost + b
   - Hash-based: hash on projected attributes, eliminate duplicates within buckets
   - If no duplicate elimination needed (bag semantics), π is free (just drop columns)

2. **SET operations (∪, ∩, −):**
   - Sort both inputs on same attributes, then merge:
     - Union: output every tuple, skip duplicates
     - Intersection: output only tuples appearing in both
     - Difference: output only tuples in first but not second
   - Hash-based: partition both, then operate on bucket pairs

3. **AGGREGATE (SUM, COUNT, AVG, MIN, MAX):**
   - Without GROUP BY: single scan, O(b)
   - With GROUP BY: sort on grouping attributes, then compute aggregates per group
   - Or: hash on grouping attributes, compute aggregates per bucket

4. **OUTER JOIN:**
   - Modify any join algorithm: when an outer tuple has no match, pad with NULLs
   - Left outer: pad unmatched tuples from left relation
   - Full outer: pad unmatched from both (more complex, typically sort-merge based)

---

### TOPIC CARD 18.6 — Pipelining vs Materialization

**Book section:** 18.6  
**Slug:** `pipelining`  
**Has simulator:** YES — Pipeline vs Materialize  
**Key concepts to cover:**

1. **Materialized evaluation:**
   - Execute one operation at a time, bottom-up
   - Each operation writes its FULL result to a temporary relation on disk
   - Next operation reads that temp relation
   - Cost: sum of all operation costs + cost of writing/reading all intermediate results

2. **Pipelined evaluation:**
   - Don't wait for an operation to complete
   - As each tuple is produced by one operation, pass it immediately to the next
   - No temporary relations written to disk
   - Cost: dramatically less I/O (no intermediate writes)

3. **Iterator model (demand-driven / Volcano model):**
   - Each operator implements: `open()`, `next()`, `close()`
   - Top operator calls `next()` on its child, which calls `next()` on its child, etc.
   - Tuples "pulled" up through the tree one at a time
   - This is how PostgreSQL works

4. **When pipelining is impossible:**
   - Sort-based operations (need all input before producing output)
   - Hash join build phase (need full partition before probing)
   - These are "blocking" operators — they break the pipeline

**PostgreSQL tie-in:**
```sql
-- Postgres uses the iterator model
-- EXPLAIN shows the pipeline:
EXPLAIN ANALYZE
SELECT d.dname, COUNT(*)
FROM employee e JOIN department d ON e.dno = d.dnumber
WHERE e.salary > 50000
GROUP BY d.dname;
-- Read bottom-up: Seq Scan → Hash Join → Group Aggregate
-- Tuples flow upward through the pipeline
```

#### SIMULATOR SPEC: Pipeline vs Materialize

**Purpose:** Show the SAME query plan executed two ways — materialized (with
intermediate temp files) vs pipelined (tuples flowing through) — so the student
sees why pipelining saves I/O.

**Inputs:**
- A 3-operation query plan (fixed presets):
  1. σ(salary > 50000) on Employee → ⋈ with Department → π(name, dname)
  2. σ(dno = 5) on Employee → ⋈ with Project → π(pname, hours)
- Toggle: Materialized / Pipelined / Side-by-side

**Animation — Materialized:**
1. Show query tree with 3 nodes
2. Execute bottom node (σ): scan blocks, produce result
3. WRITE result to disk (show temp file appearing, disk I/O counter spikes)
4. Execute middle node (⋈): READ temp file from disk + read other table
5. WRITE result to disk again
6. Execute top node (π): READ temp file, produce final result
7. Highlight: look how many extra disk writes/reads happened!

**Animation — Pipelined:**
1. Show same query tree
2. Tuples flow upward: σ produces a tuple → immediately passed to ⋈ → 
   if match, immediately passed to π → output
3. NO temp files appear on disk
4. Disk I/O counter stays much lower
5. Show "pipeline" as animated arrows with tuples traveling along them

**Split view (recommended):**
- Left: materialized execution with growing temp files and high I/O counter
- Right: pipelined execution with flowing tuples and low I/O counter
- Shared data, same query, dramatic cost difference

**Stats panel:**
- Disk I/Os: materialized vs pipelined (side by side)
- Intermediate bytes written: materialized = X, pipelined = 0
- Speedup factor

---

## Chapter 19: Query Optimization

### Overview

Chapter 19 answers: "Given many possible execution strategies, how does the
optimizer pick the best one?" Two main approaches:
1. **Heuristic (rule-based):** Apply transformation rules to improve the query tree
2. **Cost-based:** Estimate the cost of each plan, pick the cheapest

---

### TOPIC CARD 19.1 — Heuristic (Rule-Based) Optimization

**Book section:** 19.1  
**Slug:** `heuristic-optimization`  
**Has simulator:** YES — Query Tree Transformer  
**Key concepts to cover:**

1. **Equivalence rules for relational algebra** (the 12 rules):

   **Selections:**
   - R1: Cascade: σ_{c1 AND c2}(R) ≡ σ_{c1}(σ_{c2}(R))
   - R2: Commute: σ_{c1}(σ_{c2}(R)) ≡ σ_{c2}(σ_{c1}(R))
   
   **Projections:**
   - R3: Cascade: only the final projection matters (drop intermediate projections
     that include all needed attributes)
   
   **Join/Cartesian:**
   - R4: Commute joins: R ⋈ S ≡ S ⋈ R
   - R5: Associativity: (R ⋈ S) ⋈ T ≡ R ⋈ (S ⋈ T)
   
   **Selection distribution:**
   - R6: σ over ⋈: if condition involves only R's attributes,
     push σ into R: σ_c(R ⋈ S) ≡ σ_c(R) ⋈ S
   - R7: σ over ×: σ_{c}(R × S) ≡ R ⋈_c S (convert to join!)
   
   **Projection distribution:**
   - R8: π over ⋈: push projection down, keeping join attributes
   
   **Set operations:**
   - R9-R12: Commute/associate unions and intersections, distribute σ over ∪

2. **The heuristic optimization algorithm (5 steps):**
   1. Break conjunctive selections into cascade (R1)
   2. Push selections as far down the tree as possible (R2, R6)
   3. Rearrange leaf nodes so most restrictive selections execute first
   4. Convert cartesian product + selection into join (R7)
   5. Push projections down, adding intermediate projections where useful (R3, R8)

3. **Before vs After example:**
   
   Naive tree for: `SELECT name FROM employee, department WHERE dno = dnumber AND salary > 50000`
   ```
   π_name
     σ_{dno=dnumber AND salary>50000}
       ×
        employee  department
   ```
   
   After optimization:
   ```
   π_name
     ⋈_{dno=dnumber}
       σ_{salary>50000}     department
         employee
   ```
   
   The σ pushed down BELOW the join, and × + σ_{join condition} became ⋈. 
   This is dramatically cheaper because the join operates on fewer tuples.

#### SIMULATOR SPEC: Query Tree Transformer

**Purpose:** THE key simulator for Chapter 19. User sees a naive query tree
transform step-by-step into an optimized tree via the heuristic rules.

**Inputs:**
- Preset queries (start here):
  1. Two-table join with selection on one table
  2. Three-table join with selections on two tables
  3. Query with cartesian product that should become a join
  4. Query with projections that can be pushed down
- "Custom" mode: user builds a simple query tree by dragging operations
- Step mode: manual (click "Apply Rule") or auto-play

**Animation states (this is the critical sequence):**

For each transformation step:
1. **Highlight** the part of the tree being transformed (glow/pulse)
2. **Show the rule** being applied (e.g., "Rule 6: Push σ below ⋈")
3. **Animate the transformation:** 
   - Node moves down the tree (for pushdown)
   - Two nodes merge (for × + σ → ⋈)
   - Node splits (for cascade of σ)
4. **Show cost estimate change** (optional: estimated result size at each node)

**Visual design:**
- Tree displayed top-down with smooth layout transitions (use d3-hierarchy or similar)
- Each node shows: operation type (icon + symbol), condition/attributes, 
  estimated cardinality (tuples)
- Rule panel on the right: lists all applicable rules for current tree state,
  user picks which to apply (or "auto" picks the next heuristic step)
- History panel: list of applied rules, user can undo/rewind

**The "killer" detail:**
At each step, show the estimated cost (total block I/Os) of the current plan.
User watches the cost DROP as rules are applied. This makes the optimization
tangible, not just abstract tree shuffling.

**Quality criteria:**
- Tree layout must re-animate smoothly when topology changes (no jumps)
- Must correctly handle pushing σ below ⋈ only when the condition references 
  only one relation's attributes
- Must show the × → ⋈ conversion explicitly (this is the biggest win)
- Must handle 3-table queries (5-node trees at least)
- Rule panel must only show APPLICABLE rules (not all 12 always)

---

### TOPIC CARD 19.2/19.3 — Cost Estimation & Catalog Statistics

**Book sections:** 19.2, 19.3  
**Slug:** `cost-estimation`  
**Has simulator:** YES — Cost Calculator  
**Key concepts to cover:**

1. **Catalog information the optimizer uses:**
   - n_R = number of tuples in relation R
   - b_R = number of blocks of R
   - bfr_R = blocking factor (tuples per block)
   - l_R = tuple size in bytes
   - For each attribute A:
     - NDV(A, R) = number of distinct values of A in R
     - min(A, R), max(A, R)
     - Selection cardinality sl(A, R) = n_R / NDV(A, R) for equality
   - For each index I:
     - x_I = number of levels (height)
     - f_I = fan-out
     - Number of leaf blocks

2. **Selectivity estimation:**
   - Equality on key: sl = 1
   - Equality on non-key: sl = n_R / NDV(A, R)
   - Range A > a: sl = (max(A) - a) / (max(A) - min(A)) × n_R
   - Conjunction (AND): multiply individual selectivities (independence assumption!)
   - Disjunction (OR): sl = sl1 + sl2 - sl1 × sl2

3. **Join cardinality estimation:**
   - R ⋈ S on A: |R ⋈ S| ≤ n_R × n_S / max(NDV(A,R), NDV(A,S))
   - If A is a key of S and foreign key in R: |R ⋈ S| = n_R

4. **Cost functions for each algorithm** (recap from Ch 18 but now with
   selectivity plugged in):
   - The optimizer enumerates algorithm choices for each operation
   - Computes estimated cost using catalog stats
   - Picks the cheapest overall plan

#### SIMULATOR SPEC: Cost Calculator

**Purpose:** Interactive cost computation. User sets catalog statistics, picks
an operation and algorithm → sees the formula evaluated step by step.

**Inputs:**
- Relation statistics panel:
  - Table R: n_R, b_R, tuple size (auto-computes bfr)
  - Table S: n_S, b_S, tuple size
  - Attributes: NDV, min, max for each relevant attribute
- Operation selector:
  - SELECT with condition type (equality/range/conjunction)
  - JOIN with algorithm (nested-loop/sort-merge/hash)
  - PROJECT with/without duplicate elimination
- Index info: type, height, available or not

**Animation (formula walkthrough):**
1. Show the cost formula template: e.g., `Cost = bR + ⌈bR/(nB-2)⌉ × bS`
2. Highlight each variable → show its value from the stats panel (draw an arrow)
3. Compute step by step: `= 100 + ⌈100/(5-2)⌉ × 200 = 100 + 34 × 200 = 6900`
4. Final result highlighted with comparison to other algorithms

**Interactive what-if:**
- User drags a slider to change n_R → ALL costs recalculate live
- Shows crossover points: "Hash join becomes cheaper than sort-merge when bR > X"
- Plot: cost vs relation size for each algorithm (line chart)

**Quality criteria:**
- Every formula must match the textbook formulas exactly
- Selectivity computation must show the independence assumption being applied
- Must support at least: equality selection, range selection, block nested-loop join,
  sort-merge join, hash join

---

### TOPIC CARD 19.4 — Dynamic Programming Optimization (Join Ordering)

**Book section:** 19.4  
**Slug:** `dp-optimization`  
**Has simulator:** YES — Join Order Optimizer  
**Key concepts to cover:**

1. **The join ordering problem:**
   - n tables → (2(n-1))! / (n-1)! possible join tree shapes (astronomical)
   - Even restricting to left-deep trees: n! orderings
   - Exhaustive enumeration impossible for large n → need DP

2. **System R dynamic programming approach:**
   - Build optimal plans bottom-up by number of tables:
     - Size 1: best access path for each single table
     - Size 2: for each pair, try all join algorithms
     - Size k: combine best plan for (k-1) tables with remaining table
   - Prune: keep only the cheapest plan for each set of tables
     (plus plans with "interesting orders" that might help later joins/sorts)
   
3. **Left-deep vs bushy trees:**
   - Left-deep: right child of every join is a base table → pipeline-friendly
   - Bushy: both children can be intermediate results → more options, harder to pipeline
   - Most optimizers restrict to left-deep to keep search space manageable

4. **Interesting orders:**
   - A plan that produces output sorted on a useful attribute may be worth keeping
     even if it's not the cheapest, because it saves a sort later
   - Example: sort-merge join produces sorted output → useful if ORDER BY matches

#### SIMULATOR SPEC: Join Order Optimizer

**Purpose:** Visualize the DP algorithm filling in optimal plans for
increasingly large subsets of tables.

**Inputs:**
- Number of tables: 3, 4, or 5 (dropdown)
- For each table: name, size in blocks, key attribute
- Join predicates: which pairs of tables can be joined (and on which attributes)
- Toggle: left-deep only vs bushy trees allowed

**Animation:**
1. **Step 1:** Show all single-table access plans (one card per table with cost)
2. **Step 2:** Show all pairs. For each pair:
   - Show the two possible join orders (R⋈S vs S⋈R) × algorithm choices
   - Animate cost computation for each
   - Highlight the winner, grey out the losers
3. **Step 3:** Show all triples. For each triple:
   - Show the possible decompositions: {AB}⋈C, {AC}⋈B, {BC}⋈A (left-deep)
   - Look up the best plan for {AB}, {AC}, {BC} from step 2
   - Compute costs, pick winner
4. Continue until all tables joined

**Visual design:**
- DP table displayed as a grid: rows = subset size, columns = subsets
- Each cell shows: the best plan as a mini-tree, the cost
- Clicking a cell expands it to show all alternatives that were considered
- Active cell being computed glows
- Final answer: full join tree highlighted in green

**Also show:**
- Search space counter: "Considered X plans out of Y possible"
- Left-deep constraint toggle: user sees the search space shrink/expand
- Join tree visualization: the winning plan as an actual tree diagram

**Quality criteria:**
- DP table must fill in correct order (increasing subset size)
- Cost values must match formulas from 19.2
- Must handle 4 tables correctly (this is the sweet spot for visualization — 
  3 is too simple, 5 is too crowded)
- Interesting orders: at minimum, mention in the explanation; ideally, show
  a case where keeping a more expensive sorted plan pays off later

---

### TOPIC CARD 19.5/19.6 — Semantic Optimization & Query Plan Overview

**Book sections:** 19.5, 19.6  
**Slug:** `semantic-optimization`  
**Has simulator:** NO (conceptual page with diagrams)  
**Key concepts to cover:**

1. **Semantic query optimization:**
   - Use integrity constraints to simplify queries
   - Example: if CHECK (salary > 0), then WHERE salary > 0 is always true → remove it
   - Example: if FOREIGN KEY (dno) REFERENCES department(dnumber), then
     a join that only needs department attributes can skip employee entirely
   - Rarely implemented fully in practice, but conceptually important

2. **Query execution plan (QEP) overview:**
   - The complete specification: which algorithm for each operation, which indexes,
     in what order, with what pipelining
   - What EXPLAIN shows you in PostgreSQL

3. **Plan caching and recompilation:**
   - Preparing a query: optimize once, cache the plan
   - Parameterized queries reuse the plan
   - Statistics changes → stale plans → need re-optimization

**PostgreSQL tie-in:**
```sql
-- See the full QEP
EXPLAIN (ANALYZE, BUFFERS, FORMAT YAML)
SELECT e.name, d.dname, p.pname
FROM employee e 
JOIN department d ON e.dno = d.dnumber
JOIN project p ON d.dnumber = p.dnum
WHERE e.salary > 50000;

-- Prepared statement: plan is cached
PREPARE emp_dept(int) AS
SELECT e.name, d.dname 
FROM employee e JOIN department d ON e.dno = d.dnumber
WHERE e.salary > $1;

EXPLAIN EXECUTE emp_dept(50000);
```

---

## Appendix: Reusable Component Specs

These components should be extracted from existing simulators or built once:

### TreeVisualizer
- Takes: `{ nodes: [{id, label, type, children}], highlighted: id[] }`
- Renders: top-down tree with smooth layout transitions
- Supports: node addition/removal with animation, edge highlighting,
  node click handlers
- Used by: Query Tree Builder, Query Tree Transformer, Join Order Optimizer

### StepController
- Takes: `{ totalSteps, onStep, onReset, onPlay }`
- Renders: ◀ Prev | ▶ Next | ▶▶ Play | ⟲ Reset | Speed slider
- Used by: every simulator

### BlockGrid
- Takes: `{ blocks: [{id, keys, highlighted, label}], columns }`
- Renders: grid of "disk blocks" that can highlight, pulse, move
- Used by: External Sort, SELECT comparator, Join animator

### CostFormulaPanel
- Takes: `{ formula: string, variables: {name, value}[], result: number }`
- Renders: formula with values plugged in, step-by-step computation
- Supports: live-updating when variables change
- Used by: Cost Calculator, JOIN comparator, SELECT comparator

### ComparisonGrid
- Takes: `{ columns: [{title, content: ReactNode}] }`  
- Renders: 2-4 column layout for side-by-side algorithm comparison
- Used by: JOIN animator, SELECT comparator, Pipeline vs Materialize
