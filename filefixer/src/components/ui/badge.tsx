import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]",
  success: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]",
  warning: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]",
  destructive: "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]",
  outline: "border border-[hsl(var(--border))] text-[hsl(var(--foreground))] bg-transparent",
};

export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
