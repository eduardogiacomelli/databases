import { CalculatorIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 19 · §2–§3"
      title="Cost Estimation & Catalog Statistics"
      description="The catalog information the optimizer actually uses — cardinalities, NDV, min/max, selectivity estimation for equality and range predicates, and join cardinality under the independence assumption — with an interactive cost calculator."
      icon={<CalculatorIcon />}
    />
  );
}
