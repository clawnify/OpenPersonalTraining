import type { ComponentChildren } from "preact";
import { cn } from "@/lib/utils";

/**
 * A chip is a FACT (DESIGN.md signature #4): surface-sunken fill, hairline
 * border, 4px radius, 11px muted text. Use for enumerable metadata — muscle,
 * equipment, category, method. Attention states use <StatusBadge> instead.
 */
export function Chip({
  children,
  className,
}: {
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-muted px-2 py-0.5 text-[0.6875rem] font-normal text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
