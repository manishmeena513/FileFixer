"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";

interface ToolPageShellProps {
  icon: LucideIcon;
  iconColor?: string; // Tailwind bg+text class e.g. "bg-blue-500/10 text-blue-400"
  title: string;
  description: string;
  /** Optional back link destination (defaults to /tools) */
  backHref?: string;
  /** Optional back link label */
  backLabel?: string;
  /** Format badges shown inline with the heading, e.g. ["JPG","PNG","WEBP"] */
  formats?: string[];
  children: React.ReactNode;
}

/**
 * Consistent header shell for every tool page.
 * Renders a back breadcrumb, icon, title, description, optional format badges,
 * and a full-width content area below.
 */
export function ToolPageShell({
  icon: Icon,
  iconColor = "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]",
  title,
  description,
  backHref = "/tools",
  backLabel = "All Tools",
  formats = [],
  children,
}: ToolPageShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-6 group"
      >
        <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        {backLabel}
      </Link>

      {/* Tool Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              {title}
            </h1>
            {formats.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[hsl(var(--muted-foreground))] uppercase"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}

/**
 * A card-style section panel used within tool pages for settings, results, etc.
 */
interface ToolSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ToolSection({
  title,
  description,
  children,
  className = "",
}: ToolSectionProps) {
  return (
    <div
      className={`rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
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
      )}
      {children}
    </div>
  );
}

/**
 * A labelled form field row for settings panels.
 */
interface FieldRowProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FieldRow({ label, htmlFor, hint, children }: FieldRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="sm:w-40 shrink-0">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="text-xs font-medium text-[hsl(var(--foreground))] cursor-pointer"
          >
            {label}
          </label>
        ) : (
          <span className="text-xs font-medium text-[hsl(var(--foreground))]">
            {label}
          </span>
        )}
        {hint && (
          <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))] leading-tight">
            {hint}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/**
 * Processing state indicator — honest indeterminate spinner with label.
 */
interface ProcessingStateProps {
  label?: string;
}

export function ProcessingState({
  label = "Processing…",
}: ProcessingStateProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-[hsl(var(--muted-foreground))]">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(var(--primary)/0.3)] border-t-[hsl(var(--primary))]"
        role="status"
        aria-label={label}
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
