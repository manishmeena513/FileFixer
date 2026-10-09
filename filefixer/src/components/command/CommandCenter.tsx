"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Sparkles,
  Command,
  ArrowRight,
  FileText,
  FileImage,
  FolderKanban,
  Layers,
  Minimize2,
  Maximize2,
  RefreshCw,
  Crop,
  Shield,
  FilePlus,
  Scissors,
  FileDown,
  Gauge,
  Workflow,
  Download,
  Trash2,
} from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";

interface CommandItem {
  id: string;
  category: "Tools & Studios" | "Quick Actions" | "Session Files" | "Workflows" | "Presets";
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords: string[];
}

export function CommandCenter() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    isCommandCenterOpen,
    setCommandCenterOpen,
    files,
    setActiveFileId,
    setWorkspaceOpen,
  } = useFileStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandCenterOpen(!isCommandCenterOpen);
      } else if (e.key === "Escape" && isCommandCenterOpen) {
        setCommandCenterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandCenterOpen, setCommandCenterOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandCenterOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandCenterOpen]);

  const navigateTo = (path: string) => {
    setCommandCenterOpen(false);
    router.push(path);
  };

  // Build searchable items
  const allItems: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Studios & Workstations
      {
        id: "nav-workspace",
        category: "Tools & Studios",
        title: "File Workspace",
        subtitle: "Central multi-pane workspace with preview, projects & inspector",
        icon: FolderKanban,
        action: () => navigateTo("/workspace"),
        keywords: ["workspace", "station", "canvas", "project", "studio", "all"],
      },
      {
        id: "nav-workflows",
        category: "Tools & Studios",
        title: "Visual Workflow Builder",
        subtitle: "Build draggable multi-step pipelines (Resize → Convert → Compress)",
        icon: Workflow,
        action: () => navigateTo("/workflows"),
        keywords: ["workflow", "pipeline", "builder", "chain", "automation", "steps"],
      },
      {
        id: "nav-batch-studio",
        category: "Tools & Studios",
        title: "Batch Studio",
        subtitle: "Automate bulk files across Resize, WebP, Compress, and Rename",
        icon: Layers,
        action: () => navigateTo("/batch"),
        keywords: ["batch", "bulk", "multiple", "many", "pipeline", "all"],
      },
      {
        id: "nav-image-studio",
        category: "Tools & Studios",
        title: "Image Studio",
        subtitle: "Unified image workstation (Crop, Resize, Compress, Convert, EXIF)",
        icon: FileImage,
        action: () => navigateTo("/image-studio"),
        keywords: ["image", "photo", "studio", "editor", "picture", "edit"],
      },
      {
        id: "nav-pdf-studio",
        category: "Tools & Studios",
        title: "PDF Studio",
        subtitle: "Reorder pages, merge, split, rotate, and compress documents",
        icon: FileText,
        action: () => navigateTo("/pdf-studio"),
        keywords: ["pdf", "pages", "document", "reorder", "organize"],
      },
      {
        id: "nav-privacy-cleaner",
        category: "Tools & Studios",
        title: "Privacy Cleaner",
        subtitle: "Scrub GPS location tags, camera metadata, and document histories",
        icon: Shield,
        action: () => navigateTo("/privacy-cleaner"),
        keywords: ["privacy", "clean", "exif", "gps", "scrub", "metadata", "wipe"],
      },

      // Quick Actions
      {
        id: "action-compress-img",
        category: "Quick Actions",
        title: "Compress Image",
        subtitle: "Shrink image file weight while preserving high visual quality",
        icon: Minimize2,
        action: () => navigateTo("/compress-image"),
        keywords: ["compress", "shrink", "reduce", "smaller", "opti", "image", "jpg", "png", "webp"],
      },
      {
        id: "action-smart-compress",
        category: "Quick Actions",
        title: "Compress to Exact Size (Under X MB)",
        subtitle: "Target exact portal limits: Under 100KB, 500KB, 1MB, 2MB",
        icon: Gauge,
        action: () => navigateTo("/smart-compress"),
        keywords: ["under", "target", "mb", "kb", "exact", "limit", "portal", "smart compress"],
      },
      {
        id: "action-resize",
        category: "Quick Actions",
        title: "Resize Image Dimensions",
        subtitle: "Scale pixel width/height with aspect ratio lock or social presets",
        icon: Maximize2,
        action: () => navigateTo("/resize-image"),
        keywords: ["resize", "scale", "dimension", "width", "height", "pixels", "social"],
      },
      {
        id: "action-convert",
        category: "Quick Actions",
        title: "Convert Image Format",
        subtitle: "Switch between WebP, JPG, and PNG formats",
        icon: RefreshCw,
        action: () => navigateTo("/convert-image"),
        keywords: ["convert", "format", "webp", "jpg", "png", "switch", "extension"],
      },
      {
        id: "action-crop",
        category: "Quick Actions",
        title: "Crop & Rotate",
        subtitle: "Trim borders, straighten orientations, and rotate or flip photos",
        icon: Crop,
        action: () => navigateTo("/crop-image"),
        keywords: ["crop", "rotate", "trim", "aspect", "flip", "straighten"],
      },
      {
        id: "action-pdf-merge",
        category: "Quick Actions",
        title: "Merge PDFs",
        subtitle: "Combine multiple PDF documents into a single sequential file",
        icon: FilePlus,
        action: () => navigateTo("/pdf-merge"),
        keywords: ["merge", "combine", "join", "concatenate", "pdf", "unite"],
      },
      {
        id: "action-pdf-split",
        category: "Quick Actions",
        title: "Split & Extract PDF",
        subtitle: "Extract individual pages or custom page ranges into new PDFs",
        icon: Scissors,
        action: () => navigateTo("/pdf-split"),
        keywords: ["split", "extract", "pages", "divide", "separate", "cut", "pdf"],
      },
      {
        id: "action-pdf-compress",
        category: "Quick Actions",
        title: "Compress PDF",
        subtitle: "Optimize internal PDF streams to meet upload size limits",
        icon: FileDown,
        action: () => navigateTo("/pdf-compress"),
        keywords: ["pdf compress", "shrink pdf", "reduce pdf", "small pdf"],
      },
      {
        id: "action-images-to-pdf",
        category: "Quick Actions",
        title: "Images to PDF",
        subtitle: "Convert scans, receipts, or photos into a clean multi-page PDF",
        icon: FileText,
        action: () => navigateTo("/images-to-pdf"),
        keywords: ["images to pdf", "photos to pdf", "scans", "receipts", "make pdf"],
      },

      // Starter Workflows
      {
        id: "wf-website",
        category: "Workflows",
        title: "Website Images Pipeline",
        subtitle: "Resize 1920px → Convert WebP → Compress 82% → Strip EXIF",
        icon: Workflow,
        action: () => navigateTo("/workflows?preset=website"),
        keywords: ["website", "web", "seo", "online", "fast", "pipeline"],
      },
      {
        id: "wf-whatsapp",
        category: "Workflows",
        title: "WhatsApp & Chat Optimizer",
        subtitle: "Compress Under 1 MB → Strip GPS Location Data",
        icon: Workflow,
        action: () => navigateTo("/workflows?preset=whatsapp"),
        keywords: ["whatsapp", "chat", "messaging", "phone", "strip gps"],
      },
      {
        id: "wf-email",
        category: "Workflows",
        title: "Email Attachment Safe",
        subtitle: "Resize 1280px → Compress 70% → Standard JPG",
        icon: Workflow,
        action: () => navigateTo("/workflows?preset=email"),
        keywords: ["email", "outlook", "gmail", "attachment", "light"],
      },
      {
        id: "wf-pdf-cleanup",
        category: "Workflows",
        title: "PDF Privacy & Size Cleanup",
        subtitle: "Remove Metadata → Stream Compaction → Optimize",
        icon: Workflow,
        action: () => navigateTo("/workflows?preset=pdf-cleanup"),
        keywords: ["pdf cleanup", "document cleanup", "clean pdf"],
      },

      // Presets
      {
        id: "preset-under-100kb",
        category: "Presets",
        title: "Target: Under 100 KB",
        subtitle: "Strict government and portal upload size requirement",
        icon: Gauge,
        action: () => navigateTo("/smart-compress?target=0.1"),
        keywords: ["100kb", "portal", "govt", "passport", "tiny", "strict"],
      },
      {
        id: "preset-under-1mb",
        category: "Presets",
        title: "Target: Under 1 MB",
        subtitle: "Perfect threshold for email attachments and web forums",
        icon: Gauge,
        action: () => navigateTo("/smart-compress?target=1"),
        keywords: ["1mb", "email", "one mb", "megabyte"],
      },
      {
        id: "preset-instagram",
        category: "Presets",
        title: "Instagram Square (1080×1080)",
        subtitle: "Scale and format for Instagram feed posts",
        icon: Maximize2,
        action: () => navigateTo("/resize-image?w=1080&h=1080"),
        keywords: ["instagram", "square", "1080", "feed", "social"],
      },
    ];

    // Add active session files as direct navigable items
    if (files.length > 0) {
      files.forEach((f) => {
        list.push({
          id: `file-${f.id}`,
          category: "Session Files",
          title: f.name,
          subtitle: `${formatBytes(f.size)}${f.width && f.height ? ` • ${f.width}×${f.height}` : ""} • ${f.status.toUpperCase()}`,
          icon: f.type.startsWith("image/") ? FileImage : FileText,
          action: () => {
            setActiveFileId(f.id);
            setCommandCenterOpen(false);
            router.push("/workspace");
          },
          keywords: [f.name.toLowerCase(), f.type.toLowerCase(), "active", "file", "loaded"],
        });
      });
    }

    return list;
  }, [files, setActiveFileId, setCommandCenterOpen, router]);

  // Filter items deterministically
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allItems;

    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) => k.includes(q));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [allItems, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) current.action();
    }
  };

  if (!isCommandCenterOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 pt-[10vh] animate-fade-in"
      onClick={() => setCommandCenterOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Center"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[hsl(var(--border))] px-4 py-3.5 bg-[hsl(var(--background)/0.8)]">
          <Search className="h-5 w-5 text-[hsl(var(--primary))] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to do? (e.g. compress, webp, merge pdf, under 1mb, clean)..."
            className="w-full bg-transparent text-sm sm:text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
            aria-label="Search tools, actions, files, or workflows"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mr-2"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[hsl(var(--border)/0.5)]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground)/0.5)]" />
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                No matching actions or tools
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Try searching for &quot;compress&quot;, &quot;pdf&quot;, &quot;resize&quot;, &quot;convert&quot;, or &quot;workspace&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--primary)/0.3)]"
                      : "hover:bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))]"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[hsl(var(--primary))] text-white"
                          : "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected
                        ? "translate-x-0.5 text-[hsl(var(--primary))]"
                        : "opacity-0"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] px-4 py-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-3">
            <span>
              Use <kbd className="font-mono bg-[hsl(var(--secondary))] px-1 py-0.5 rounded">↑</kbd>{" "}
              <kbd className="font-mono bg-[hsl(var(--secondary))] px-1 py-0.5 rounded">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono bg-[hsl(var(--secondary))] px-1.5 py-0.5 rounded">↵</kbd> to execute
            </span>
          </div>
          <span className="font-mono text-emerald-500 font-medium">
            100% In-Browser • Zero Uploads
          </span>
        </div>
      </div>
    </div>
  );
}
