"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  FileQuestion,
} from "lucide-react";
import { TOOLS, CATEGORIES, ToolCategoryKey, ToolItem } from "@/lib/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TabularNum } from "@/components/ui/TabularNum";
import { cn } from "@/lib/utils";

export function ToolsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryKey>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Category counts computed dynamically from master catalog
  const categoryCounts = useMemo(() => {
    const counts: Record<ToolCategoryKey, number> = {
      all: TOOLS.length,
      images: 0,
      pdf: 0,
      batch: 0,
      utilities: 0,
    };
    for (const tool of TOOLS) {
      if (counts[tool.categoryKey] !== undefined) {
        counts[tool.categoryKey]++;
      }
    }
    return counts;
  }, []);

  // Multi-term search & category filter pipeline
  const filteredTools = useMemo(() => {
    const rawQ = searchQuery.toLowerCase().trim();
    const queryTerms = rawQ ? rawQ.split(/\s+/) : [];

    return TOOLS.filter((tool) => {
      // 1. Category Matching
      if (selectedCategory !== "all" && tool.categoryKey !== selectedCategory) {
        return false;
      }

      // 2. Multi-term Search Query Matching
      if (queryTerms.length > 0) {
        const toolName = tool.name.toLowerCase();
        const toolDesc = tool.description.toLowerCase();
        const toolCat = tool.category.toLowerCase();
        const toolBadge = (tool.badge || "").toLowerCase();
        const toolIndicator = (tool.featureIndicator || "").toLowerCase();
        const toolFormats = (tool.supportedFormats || []).map((f) => f.toLowerCase());

        return queryTerms.every((term) => {
          return (
            toolName.includes(term) ||
            toolDesc.includes(term) ||
            toolCat.includes(term) ||
            toolBadge.includes(term) ||
            toolIndicator.includes(term) ||
            toolFormats.some((fmt) => fmt.includes(term))
          );
        });
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Popular tools list for top quick access
  const popularTools = useMemo(() => {
    return TOOLS.filter((t) => t.isPopular);
  }, []);

  // Category groupings when in "All" view with no search
  const isDefaultView = selectedCategory === "all" && !searchQuery.trim();

  const groupedCategories: { key: ToolCategoryKey; label: string; tools: ToolItem[] }[] = useMemo(() => {
    const cats: ToolCategoryKey[] = ["images", "pdf", "batch", "utilities"];
    return cats.map((key) => {
      const label =
        key === "images"
          ? "Image Tools"
          : key === "pdf"
          ? "PDF Tools"
          : key === "batch"
          ? "Batch Tools"
          : "File Utilities";

      return {
        key,
        label,
        tools: TOOLS.filter((t) => t.categoryKey === key),
      };
    });
  }, []);

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    searchInputRef.current?.focus();
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-20">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1 text-xs font-medium text-[hsl(var(--primary))]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Central Tool Directory</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[hsl(var(--foreground))]">
          Everything you need to fix your files.
        </h1>

        <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed max-w-2xl mx-auto">
          Compress, convert, resize, organize and manage your files with simple browser-based tools. 100% private.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Search Input Bar */}
        <div className="relative w-full">
          <label htmlFor="tools-catalog-search" className="sr-only">
            Search tools by name, action, or format
          </label>
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))] pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="tools-catalog-search"
            ref={searchInputRef}
            type="text"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
              }
            }}
            placeholder="Search tools by name, action (e.g. compress, merge), or format (PDF, JPG, PNG)..."
            className="w-full min-h-[48px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-12 pr-12 py-3 text-sm text-[hsl(var(--foreground))] shadow-xs transition-all focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)] placeholder:text-[hsl(var(--muted-foreground))]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors cursor-pointer touch-manipulation"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Chips & Metrics Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Category Chips Toolbar */}
          <div
            role="toolbar"
            aria-label="Filter tools by category"
            className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const count = categoryCounts[cat.key];
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={cn(
                    "flex min-h-[44px] sm:min-h-[38px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer touch-manipulation",
                    isActive
                      ? "border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xs"
                      : "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  )}
                  aria-pressed={isActive}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums",
                      isActive
                        ? "bg-[hsl(var(--primary-foreground)/0.2)] text-[hsl(var(--primary-foreground))]"
                        : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    <TabularNum value={count} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tabular Tool Counter */}
          <div
            className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] font-mono tabular-nums"
            aria-live="polite"
            role="status"
          >
            <span>Showing</span>
            <TabularNum value={filteredTools.length} className="font-bold text-[hsl(var(--foreground))]" />
            <span>of</span>
            <TabularNum value={TOOLS.length} className="font-bold text-[hsl(var(--foreground))]" />
            <span>tools</span>
          </div>
        </div>
      </div>

      {/* Popular Tools Strip (Shown on default view) */}
      {isDefaultView && (
        <div className="max-w-6xl mx-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Popular Tools
            </span>
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">Quick Access</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {popularTools.map((pt) => {
              const Icon = pt.icon;
              return (
                <Link
                  key={pt.id}
                  href={pt.slug}
                  className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 text-xs font-medium text-[hsl(var(--foreground))] transition-colors hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
                >
                  <Icon className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" aria-hidden="true" />
                  <span className="truncate">{pt.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tools Catalog */}
      <div className="max-w-6xl mx-auto">
        {/* Empty State */}
        {filteredTools.length === 0 ? (
          <div className="max-w-md mx-auto my-12" role="status" aria-live="polite">
            <EmptyState
              icon={FileQuestion}
              title="No matching tools found"
              description={
                searchQuery.trim() && selectedCategory !== "all"
                  ? `No tools match "${searchQuery}" under the "${CATEGORIES.find((c) => c.key === selectedCategory)?.label}" category. Try clearing filters or broadening your search.`
                  : searchQuery.trim()
                  ? `No tools match "${searchQuery}". Try searching by action (e.g. compress, convert, merge) or file format (e.g. PDF, JPG, WebP).`
                  : `No tools currently found in this category.`
              }
              action={
                <Button
                  variant="default"
                  size="md"
                  onClick={handleClear}
                  className="min-h-[44px] cursor-pointer"
                >
                  Clear all filters
                </Button>
              }
            />
          </div>
        ) : isDefaultView ? (
          /* Grouped by Category on Default View */
          <div className="space-y-12">
            {groupedCategories.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2.5">
                  <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
                    <span>{group.label}</span>
                    <Badge variant="outline" className="text-[11px] font-mono font-normal">
                      <TabularNum value={group.tools.length} />
                    </Badge>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {group.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Filtered or Searched Grid */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2.5">
              <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
                {searchQuery ? `Search Results for "${searchQuery}"` : `${CATEGORIES.find((c) => c.key === selectedCategory)?.label || selectedCategory} Tools`}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono tabular-nums">
                  Showing <TabularNum value={filteredTools.length} className="font-bold text-[hsl(var(--foreground))]" /> of <TabularNum value={TOOLS.length} />
                </span>
                {(searchQuery.trim() || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex min-h-[44px] sm:min-h-[32px] items-center text-xs font-semibold text-[hsl(var(--primary))] hover:underline cursor-pointer touch-manipulation"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tagline */}
      <div className="text-center pt-8 border-t border-[hsl(var(--border))] max-w-xl mx-auto space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
          Explore FileFixer
        </p>
        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
          Fix your files. Keep them private.
        </p>
      </div>
    </div>
  );
}
