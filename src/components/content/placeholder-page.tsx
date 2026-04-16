import type { ReactNode } from "react";
import { PageHeader } from "@/components/content/page-header";
import { InfoCallout } from "@/components/content/info-callout";
import { PageNavigation } from "@/components/content/page-navigation";

type PlaceholderPageProps = {
  badge: string;
  title: string;
  description: string;
  icon: ReactNode;
};

export function PlaceholderPage({
  badge,
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-10">
      <PageHeader
        badge={badge}
        title={title}
        description={description}
        icon={icon}
      />

      <InfoCallout variant="tip" title="Under construction">
        This page is scaffolded and linked into the sidebar. The full content and
        interactive simulator will arrive in the next pass. In the meantime, the
        spec for this page lives in{" "}
        <code className="mx-1 font-mono text-xs">
          content/ch18-19-reference-and-simulator-specs.md
        </code>
        .
      </InfoCallout>

      <PageNavigation />
    </div>
  );
}
