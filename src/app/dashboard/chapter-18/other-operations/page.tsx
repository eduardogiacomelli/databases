import { LayersIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 18 · §5"
      title="Other Operations"
      description="PROJECT with duplicate elimination, set operations (∪, ∩, −), aggregation with and without GROUP BY, and outer joins — mostly sort-based or hash-based variants of the operators from §3 and §4."
      icon={<LayersIcon />}
    />
  );
}
