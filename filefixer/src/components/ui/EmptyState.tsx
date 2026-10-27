import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-dashed border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md shadow-xs",
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] mb-4">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-sm leading-relaxed mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
