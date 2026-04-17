import { Grid3x3Icon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 19 · §4"
      title="Dynamic Programming for Join Ordering"
      description="The System R DP algorithm: build optimal plans bottom-up by subset size, prune to the cheapest plan per subset (plus interesting orders), and choose between left-deep and bushy trees. Visualized as a filling DP table."
      icon={<Grid3x3Icon />}
    />
  );
}
