import { GitBranchIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 18 · §1"
      title="SQL to Relational Algebra"
      description="How a SELECT-FROM-WHERE block is translated into a relational-algebra expression tree — query blocks, cascades of σ, nested-query rewriting, and the choice between query trees and query graphs."
      icon={<GitBranchIcon />}
    />
  );
}
