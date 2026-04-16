import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  as?: "h2" | "h3" | "h4";
  id?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionHeading({
  as: Tag = "h2",
  id,
  children,
  className,
}: SectionHeadingProps) {
  const headingId =
    id ?? (typeof children === "string" ? children.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <Tag
      id={headingId}
      className={cn(
        "font-heading scroll-mt-20 tracking-tight",
        Tag === "h2" && "text-2xl font-bold",
        Tag === "h3" && "text-xl font-semibold",
        Tag === "h4" && "text-lg font-medium",
        className
      )}
    >
      {children}
    </Tag>
  );
}
