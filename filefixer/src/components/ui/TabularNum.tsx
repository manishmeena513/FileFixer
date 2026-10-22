import * as React from "react";
import { cn, formatBytes as formatBytesUtil, calcSavings as calcSavingsUtil } from "@/lib/utils";

export interface TabularNumProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string | number;
  prefix?: string;
  suffix?: string;
}

/**
 * TabularNum: Enforces tabular-nums font features to eliminate CLS during numeric updates.
 */
export function TabularNum({
  value,
  prefix,
  suffix,
  className,
  children,
  ...props
}: TabularNumProps) {
  return (
    <span
      className={cn("tabular-nums inline-block font-feature-tnum", className)}
      {...props}
    >
      {prefix}
      {value !== undefined ? value : children}
      {suffix}
    </span>
  );
}

export interface FormatBytesProps extends React.HTMLAttributes<HTMLSpanElement> {
  bytes: number;
  decimals?: number;
}

/**
 * FormatBytes: Formats numeric bytes with guaranteed tabular figures.
 */
export function FormatBytes({
  bytes,
  decimals = 2,
  className,
  ...props
}: FormatBytesProps) {
  return (
    <span
      className={cn("tabular-nums font-feature-tnum inline-block", className)}
      {...props}
    >
      {formatBytesUtil(bytes, decimals)}
    </span>
  );
}

export interface SavingsPctProps extends React.HTMLAttributes<HTMLSpanElement> {
  original: number;
  optimized: number;
  prefix?: string;
}

/**
 * SavingsPct: Computes and renders percentage savings with tabular figures.
 */
export function SavingsPct({
  original,
  optimized,
  prefix = "-",
  className,
  ...props
}: SavingsPctProps) {
  return (
    <span
      className={cn("tabular-nums font-feature-tnum inline-block", className)}
      {...props}
    >
      {prefix}{calcSavingsUtil(original, optimized)}
    </span>
  );
}
