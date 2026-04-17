import { GitBranchIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 19 · §1"
      title="Heuristic (Rule-Based) Optimization"
      description="The 12 equivalence rules for relational algebra and the five-step heuristic algorithm — cascade conjunctions, push σ down, rearrange leaves, convert × + σ into ⋈, push π down — with a Query Tree Transformer that shows the plan shrink at every step."
      icon={<GitBranchIcon />}
    />
  );
}
