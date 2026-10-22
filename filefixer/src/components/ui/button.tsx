import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "ghost"
    | "destructive"
    | "outline"
    | "accent"
    | "link";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-105 active:scale-[0.98] shadow-xs transition-all",
  secondary:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--border))] active:scale-[0.98] transition-all",
  ghost:
    "hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] active:scale-[0.98] transition-colors",
  destructive:
    "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
  outline:
    "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] active:scale-[0.98] transition-all",
  accent:
    "bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent-subtle-foreground,var(--foreground)))] dark:text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
  link: "underline-offset-4 hover:underline text-[hsl(var(--primary))] bg-transparent",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
  sm: "h-8 px-3 text-xs gap-1.5 relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
  md: "h-11 sm:h-10 px-4 py-2 text-sm gap-2 min-h-[44px] sm:min-h-0 touch-manipulation",
  lg: "h-12 px-6 text-base gap-2 touch-manipulation",
  icon: "h-11 w-11 sm:h-9 sm:w-9 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-colors touch-manipulation",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
          "disabled:pointer-events-none disabled:opacity-50",
          "cursor-pointer select-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
