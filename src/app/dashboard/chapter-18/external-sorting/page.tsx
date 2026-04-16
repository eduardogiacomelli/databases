import { ArrowDownUpIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 18 · §2"
      title="External Sorting"
      description="The sort-merge algorithm that underpins ORDER BY, DISTINCT, GROUP BY, and sort-merge join. Initial run creation, (nB−1)-way merging, and the exact I/O formula for any b and nB."
      icon={<ArrowDownUpIcon />}
    />
  );
}
