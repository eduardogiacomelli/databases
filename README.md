# Database Internals — Interactive Notes

An interactive companion to the _Fundamentals of Database Systems_ (Elmasri &
Navathe) chapters on storage and query processing. Every concept ships with a
playable simulator instead of a static figure.

🔗 **Live demo:** https://databases-2.vercel.app

## What's inside

- **Chapter 16 — Disk Storage & File Structures.** Schema builder, file-access
  animator (linear vs. binary), hashing simulator with overflow chains.
- **Chapter 17 — Indexing.** B-tree and B+ tree visualizers, multilevel index
  fan-out calculator, primary/secondary/clustering walkthroughs.
- **Chapter 18 — Query Processing.** SQL → relational algebra translator,
  external sort-merge animator, SELECT strategy comparator (S1–S9), JOIN
  algorithm animator (J2–J5), pipelining vs. materialization.
- **Chapter 19 — Query Optimization.** Heuristic rule transformer, cost
  estimator with catalog stats, dynamic-programming join ordering, worked
  examples.

## Screenshots

> _Add screenshots here_ — `docs/screenshots/dashboard.png`,
> `docs/screenshots/join-animator.png`, etc.

## Tech stack

- **Next.js 16** (App Router, React 19, React Compiler)
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui**
- **Framer Motion** for animations · **Zustand** for simulator state
- **KaTeX** for math · **Shiki** for SQL/code · **@xyflow/react** + **@visx** for diagrams

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The dashboard at `/dashboard` is the entry
point; each chapter and topic has its own route.

## Project layout

```
src/app/dashboard/chapter-{16..19}/   # page content (one folder per topic)
src/components/content/               # reusable text/section primitives
src/components/simulators/            # interactive visualizations
src/lib/navigation.ts                 # sidebar / chapter index
content/                              # source notes that drive the pages
```
