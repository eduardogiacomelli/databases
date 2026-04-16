import { SearchIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 18 · §3"
      title="Algorithms for SELECT"
      description="The nine textbook strategies S1–S9 for evaluating σ — linear scan, binary search, primary/clustering/secondary index lookups, and the conjunctive-selection variants — with their exact block I/O formulas."
      icon={<SearchIcon />}
    />
  );
}
