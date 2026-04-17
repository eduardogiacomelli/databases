import { BookOpenIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 19 · §5–§6"
      title="Semantic Optimization & QEPs"
      description="Using integrity constraints to simplify queries (CHECK, FOREIGN KEY), the full Query Execution Plan that EXPLAIN reveals, and plan caching with PREPARE / EXECUTE."
      icon={<BookOpenIcon />}
    />
  );
}
