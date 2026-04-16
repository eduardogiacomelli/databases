import { WorkflowIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/content/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      badge="Chapter 18 · §6"
      title="Pipelining vs Materialization"
      description="Materialized evaluation writes every intermediate to disk. Pipelined evaluation streams tuples through the operator tree without touching disk. The iterator (Volcano) model, when pipelining is impossible, and why PostgreSQL is pull-based."
      icon={<WorkflowIcon />}
    />
  );
}
