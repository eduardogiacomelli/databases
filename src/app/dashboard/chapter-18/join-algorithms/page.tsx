import { ShuffleIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 18 · §4"
      title="Algorithms for JOIN"
      description="Block nested-loop (J2), index nested-loop (J3), sort-merge (J4), and hash join (J5) — the four workhorse algorithms with an animator that runs all four on the same data and compares their block I/O cost."
      icon={<ShuffleIcon />}
    />
  );
}
