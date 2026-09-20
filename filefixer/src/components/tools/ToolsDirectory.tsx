"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileQuestion,
} from "lucide-react";
import { TOOLS, CATEGORIES, ToolCategoryKey, ToolItem } from "@/lib/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ToolsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryKey>("all");

  // Filtered tools
  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return TOOLS.filter((tool) => {
      // Category filter
      if (selectedCategory !== "all" && tool.categoryKey !== selectedCategory) {
        return false;
      }

      // Query filter (name, description, category, formats)
      if (q) {
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchCategory = tool.category.toLowerCase().includes(q);
        const matchFormats = tool.supportedFormats?.some((f) => f.toLowerCase().includes(q));

        return matchName || matchDesc || matchCategory || matchFormats;
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

  // Dynamic count text
  const countText = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredTools.length === 1
        ? "1 tool found"
        : `${filteredTools.length} tools found`;
    }

    if (selectedCategory === "all") {
      return `${TOOLS.length} tools available`;
    }

    const catMap: Record<ToolCategoryKey, string> = {
      all: "tools",
      images: "image tools",
      pdf: "PDF tools",
      batch: "batch tools",
      utilities: "file utilities",
    };

    return `${filteredTools.length} ${catMap[selectedCategory]}`;
  }, [searchQuery, selectedCategory, filteredTools.length]);

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1 text-xs font-medium text-[hsl(var(--primary))]">
          <Sparkles className="h-3.5 w-3.5" />
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
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, action (e.g. compress, merge), or format (PDF, JPG, PNG)..."
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-12 pr-10 py-3.5 text-sm text-[hsl(var(--foreground))] shadow-sm transition-all focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.3)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Chips & Count Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 w-full sm:w-auto">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                      : "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  }`}
                  aria-pressed={isActive}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Tool Count */}
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] font-mono">
            {countText}
          </div>
        </div>
      </div>

      {/* Featured / Popular Tools Strip (Shown on default view) */}
      {isDefaultView && (
        <div className="max-w-6xl mx-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Popular Tools
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
                  className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 text-xs font-medium text-[hsl(var(--foreground))] transition-colors hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
                >
                  <Icon className="h-4 w-4 text-[hsl(var(--primary))] flex-shrink-0" />
                  <span className="truncate">{pt.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tools Catalog */}
      <div className="max-w-6xl mx-auto">
        {/* Empty Search State */}
        {filteredTools.length === 0 ? (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center space-y-4 max-w-md mx-auto my-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] mx-auto">
              <FileQuestion className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">No tools found</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                No tool matches &quot;{searchQuery}&quot;. Try searching for another keyword, file extension, or clear filters.
              </p>
            </div>
            <Button variant="default" size="sm" onClick={handleClear}>
              Clear Search
            </Button>
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
                      {group.tools.length}
                    </Badge>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                {searchQuery ? `Search Results for "${searchQuery}"` : `${selectedCategory.toUpperCase()} Tools`}
              </h2>
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                {countText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tagline as per PRD */}
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
