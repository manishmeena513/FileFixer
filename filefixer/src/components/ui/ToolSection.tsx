import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToolSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * ToolSection: High-clarity frosted glass container for workstation panels.
 * Default styling: bg-[var(--glass-surface)] backdrop-blur-md border border-[var(--glass-border)] shadow-[var(--glass-shadow)] rounded-3xl
 */
export function ToolSection({
  title,
  description,
  action,
  children,
  className,
  ...props
}: ToolSectionProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md shadow-[var(--glass-shadow)] p-5 sm:p-6 transition-all duration-200",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export default ToolSection;
