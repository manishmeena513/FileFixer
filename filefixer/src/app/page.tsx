"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minimize2,
  Maximize2,
  RefreshCw,
  FilePlus,
  Scissors,
  Shield,
  Zap,
  HardDrive,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck,
  Layers,
  Crop,
  FileText,
  Mail,
  Globe,
  Gauge,
  FolderKanban,
  Trash2,
  Plus,
  Lock,
  Cpu,
  Download,
  FileImage,
  PenLine,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";
import { LogoMark } from "@/components/branding/Logo";

const smartQuickActions = [
  {
    label: "Compress",
    sub: "Shrink file size",
    href: "/compress-image",
    icon: Minimize2,
  },
  {
    label: "Convert",
    sub: "JPG, PNG, WebP",
    href: "/convert-image",
    icon: RefreshCw,
  },
  {
    label: "Resize",
    sub: "Exact px or %",
    href: "/resize-image",
    icon: Maximize2,
  },
  {
    label: "Merge PDF",
    sub: "Combine PDFs",
    href: "/pdf-merge",
    icon: FilePlus,
  },
  {
    label: "Split PDF",
    sub: "Separate pages",
    href: "/pdf-split",
    icon: Scissors,
  },
  {
    label: "Extract Pages",
    sub: "Visual PDF grid",
    href: "/pdf-workspace",
    icon: Layers,
  },
  {
    label: "Remove Metadata",
    sub: "Strip EXIF & GPS",
    href: "/image-metadata",
    icon: Shield,
  },
  {
    label: "Optimize for Email",
    sub: "Fit attachment limits",
    href: "/smart-compress",
    icon: Mail,
  },
  {
    label: "Optimize for Web",
    sub: "Fast loading assets",
    href: "/batch",
    icon: Globe,
  },
  {
    label: "Make Smaller",
    sub: "Target exact KB/MB",
    href: "/smart-compress",
    icon: Gauge,
  },
];

const quickTools = [
  {
    title: "Smart 'Under X MB'",
    desc: "Signature multi-pass optimizer that progressively tests compression levels until your exact target size is reached.",
    href: "/smart-compress",
    icon: Sparkles,
    badge: "Signature",
    color: "from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    title: "Batch Multi-Pipeline",
    desc: "Execute multi-stage image processing (Resize → Convert → Compress → Rename) in one local pass.",
    href: "/batch",
    icon: Layers,
    badge: "Bulk Hub",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
  },
  {
    title: "Compress Image",
    desc: "Reduce JPG, PNG, and WebP file size by up to 80% with live before/after visual comparison.",
    href: "/compress-image",
    icon: Minimize2,
    badge: "Fast",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
  },
  {
    title: "PDF Visual Workspace",
    desc: "Reorder, rotate, duplicate, and extract PDF pages interactively with visual page thumbnails.",
    href: "/pdf-workspace",
    icon: Layers,
    badge: "Workspace",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
  {
    title: "Merge PDFs",
    desc: "Combine multiple PDF documents into one cleanly organized file in seconds.",
    href: "/pdf-merge",
    icon: FilePlus,
    badge: "Popular",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Split & Extract PDF",
    desc: "Extract specific pages or ranges from any PDF without uploading to a third party.",
    href: "/pdf-split",
    icon: Scissors,
    badge: "Clean",
    color: "from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30",
  },
  {
    title: "Universal File Inspector",
    desc: "Inspect dimensions, EXIF camera tags, GPS location presence, and PDF metadata dictionaries.",
    href: "/inspect",
    icon: FileCheck,
    badge: "Inspect",
    color: "from-emerald-500/20 to-cyan-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Resize Image",
    desc: "Scale dimensions with aspect ratio lock or choose standard social media & document presets.",
    href: "/resize-image",
    icon: Maximize2,
    badge: "Presets",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
  },
  {
    title: "Convert Image",
    desc: "Switch between JPG, PNG, and WebP instantly in single or bulk batches.",
    href: "/convert-image",
    icon: RefreshCw,
    badge: "Convert",
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30",
  },
];

const faqs = [
  {
    q: "Are my files uploaded to your servers?",
    a: "No. FileFixer processes supported files directly in your web browser using HTML5 Canvas, Web Workers, and WebAssembly. Your files remain in your device's local memory.",
  },
  {
    q: "Do I need to create an account or subscribe?",
    a: "Never. All tools are completely free, open, and work immediately without registration, email signups, or paywalls.",
  },
  {
    q: "How does the Temporary File Workspace work?",
    a: "When you drop or select files, they are held in your browser's temporary memory session. You can switch between compatible tools (like Compress → Resize → Convert) without re-uploading, and everything clears automatically when you close the tab.",
  },
  {
    q: "Does FileFixer work on mobile phones and as an installed PWA?",
    a: "Yes. FileFixer 2.0 is built equally for desktop browsers, mobile browsers, and Chrome-installed PWAs with full touch support and offline app-shell caching.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    setWorkspaceOpen,
  } = useFileStore();

  const handleDroppedFiles = (dropped: File[]) => {
    if (dropped.length === 0) return;
    addFiles(dropped);
  };

  const hasFiles = files.length > 0;
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  const pdfFiles = files.filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  // Build contextual smart actions based on detected file types
  const detectedActions: {
    label: string;
    desc: string;
    href: string;
    icon: React.ElementType;
    primary?: boolean;
  }[] = [];

  if (imageFiles.length > 0) {
    if (imageFiles.length > 1) {
      detectedActions.push({
        label: "Batch Process All",
        desc: `Resize, convert & compress ${imageFiles.length} images`,
        href: "/batch",
        icon: Layers,
        primary: true,
      });
    }
    detectedActions.push(
      {
        label: "Compress Image",
        desc: "Shrink size with quality slider",
        href: "/compress-image",
        icon: Minimize2,
        primary: imageFiles.length === 1,
      },
      {
        label: "Exact Size (Under X MB)",
        desc: "Hit strict KB/MB upload limits",
        href: "/smart-compress",
        icon: Sparkles,
      },
      {
        label: "Resize Dimensions",
        desc: "Scale pixels, % or presets",
        href: "/resize-image",
        icon: Maximize2,
      },
      {
        label: "Convert Format",
        desc: "Switch to WebP, JPG, or PNG",
        href: "/convert-image",
        icon: RefreshCw,
      },
      {
        label: "Crop & Rotate",
        desc: "Frame aspect ratios & straighten",
        href: "/crop-image",
        icon: Crop,
      },
      {
        label: "Remove Metadata",
        desc: "Strip private EXIF & GPS tags",
        href: "/image-metadata",
        icon: Shield,
      },
      {
        label: "Images to PDF",
        desc: "Compile images into one PDF",
        href: "/images-to-pdf",
        icon: FileText,
      }
    );
  }

  if (pdfFiles.length > 0) {
    if (pdfFiles.length > 1) {
      detectedActions.push({
        label: "Merge PDFs",
        desc: `Combine ${pdfFiles.length} PDFs into one document`,
        href: "/pdf-merge",
        icon: FilePlus,
        primary: true,
      });
    }
    detectedActions.push(
      {
        label: "Compress PDF",
        desc: "Optimize PDF structure & size",
        href: "/pdf-compress",
        icon: Minimize2,
        primary: pdfFiles.length === 1,
      },
      {
        label: "Split & Extract Pages",
        desc: "Extract custom page ranges",
        href: "/pdf-split",
        icon: Scissors,
      },
      {
        label: "PDF Page Workspace",
        desc: "Reorder, rotate & delete pages",
        href: "/pdf-workspace",
        icon: Layers,
      }
    );
    if (pdfFiles.length === 1) {
      detectedActions.push({
        label: "Merge with More PDFs",
        desc: "Combine with other PDF files",
        href: "/pdf-merge",
        icon: FilePlus,
      });
    }
  }

  if (hasFiles) {
    detectedActions.push(
      {
        label: "Inspect File",
        desc: "View deep technical metadata",
        href: "/inspect",
        icon: FileCheck,
      },
      {
        label: "Batch Rename",
        desc: "Pattern & sequence renamer",
        href: "/batch-rename",
        icon: PenLine,
      }
    );
  }

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO + SMART FILE DROP */}
      <section className="relative overflow-hidden pt-6 sm:pt-12 md:pt-16">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 blur-3xl pointer-events-none">
          <div className="h-[420px] w-[580px] rounded-full bg-gradient-to-tr from-[hsl(var(--primary)/0.35)] to-sky-500/20" />
        </div>

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[hsl(var(--primary))] mb-5 animate-fade-in">
            <LogoMark size={15} animated={false} />
            <span>FILEFIXER 3.0 • THE FILE WORKSPACE</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up">
            Fix your files.{" "}
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Keep them private.
            </span>
          </h1>

          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed animate-slide-up">
            Compress, convert, resize, merge, and split files locally in your browser.
            No server uploads. No accounts. Zero tracking.
          </p>

          {/* Smart File Drop Zone OR Smart File Action Selector */}
          <div className="mx-auto mt-7 sm:mt-10 max-w-3xl text-left">
            {!hasFiles ? (
              <DropZone
                onFiles={handleDroppedFiles}
                label="Drop files here or tap to select"
                sublabel="Smart file detection — instantly shows compatible tools for your files"
                formats={["JPG", "PNG", "WEBP", "PDF", "SVG"]}
                className="py-8 sm:py-12 shadow-2xl border-2"
              />
            ) : (
              <div className="animate-scale-in rounded-2xl border-2 border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--card))] p-4 sm:p-6 shadow-2xl space-y-5">
                {/* Workspace Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold">
                          Smart File Drop Ready
                        </h2>
                        <Badge variant="default" className="text-[11px]">
                          {files.length} {files.length === 1 ? "file" : "files"} •{" "}
                          {formatBytes(totalSize)}
                        </Badge>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Choose an action below to open your files directly in that tool
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/workspace"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)] transition-colors"
                    >
                      <FolderKanban className="h-3.5 w-3.5" />
                      Open Full Workspace
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFiles}
                      className="min-h-[38px] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* File Preview List (compact) */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {files.slice(0, 5).map((f) => (
                    <FileCard
                      key={f.id}
                      file={f}
                      onRemove={removeFile}
                      showOutput={true}
                    />
                  ))}
                  {files.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setWorkspaceOpen(true)}
                      className="w-full rounded-lg border border-dashed border-[hsl(var(--border))] py-2 text-center text-xs font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]"
                    >
                      + {files.length - 5} more files in Workspace (Click to view all)
                    </button>
                  )}
                </div>

                {/* Recommended Contextual Actions */}
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Recommended Actions for Your {imageFiles.length > 0 && pdfFiles.length === 0 ? "Images" : pdfFiles.length > 0 && imageFiles.length === 0 ? "PDFs" : "Files"}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {detectedActions.map((act) => {
                      const Icon = act.icon;
                      return (
                        <button
                          key={act.href + act.label}
                          type="button"
                          onClick={() => router.push(act.href)}
                          className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all min-h-[64px] ${
                            act.primary
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] shadow-sm hover:bg-[hsl(var(--primary)/0.15)]"
                              : "border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.6)] hover:bg-[hsl(var(--secondary)/0.6)]"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              act.primary
                                ? "bg-[hsl(var(--primary))] text-white"
                                : "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] truncate">
                                {act.label}
                              </p>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-0.5 group-hover:text-[hsl(var(--primary))]" />
                            </div>
                            <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))] line-clamp-1">
                              {act.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add more dropzone bar */}
                <div className="pt-1">
                  <DropZone
                    onFiles={handleDroppedFiles}
                    label="Add more files to this session"
                    sublabel=""
                    formats={[]}
                    className="py-3 sm:py-4 border border-dashed bg-[hsl(var(--background)/0.5)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Core Trust Badges */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 font-medium text-[hsl(var(--foreground))]">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> 100% Client-side
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 font-medium text-[hsl(var(--foreground))]">
              <Zap className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Instant Processing
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 font-medium text-[hsl(var(--foreground))]">
              <HardDrive className="h-3.5 w-3.5 text-purple-400" /> No Account Needed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 font-medium text-[hsl(var(--foreground))]">
              <FileCheck className="h-3.5 w-3.5 text-sky-400" /> Batch Processing Ready
            </span>
          </div>
        </div>
      </section>

      {/* 2. SMART QUICK ACTIONS: "What do you want to do?" */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                What do you want to do?
              </h2>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                Jump straight into a task or preset workflow.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] hover:underline"
            >
              Browse all 13 tools <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {smartQuickActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="interactive-card group flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 sm:p-3.5 min-h-[56px] hover:border-[hsl(var(--primary)/0.6)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] transition-transform group-hover:scale-105">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                      {item.sub}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. EVERYDAY FILE UTILITIES GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
            Everyday File Utilities
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Specialized, fast browser tools built for both desktop and mobile workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="interactive-card group relative flex flex-col justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 hover:border-[hsl(var(--primary)/0.55)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border bg-gradient-to-br ${tool.color}`}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold tracking-wider"
                    >
                      {tool.badge}
                    </Badge>
                  </div>

                  <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[hsl(var(--border)/0.6)] flex items-center justify-between text-xs font-semibold text-[hsl(var(--primary))]">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Explore All Tools CTA */}
        <div className="mt-10 sm:mt-12 rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--card))] via-[hsl(var(--secondary)/0.5)] to-[hsl(var(--card))] p-6 sm:p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
              Explore all 13 local tools
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Search and filter every image, PDF, and batch utility in one directory.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/tools">
              <Button size="lg" className="w-full sm:w-auto font-semibold min-h-[46px]">
                View All Tools <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. PRIVACY CENTER ARCHITECTURE FLOW */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
              <Lock className="h-3.5 w-3.5" /> Privacy Architecture
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Why Your Files Stay Private
            </h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Traditional converters upload your private documents to remote cloud servers. FileFixer runs the entire processing engine inside your browser tab.
            </p>
          </div>

          {/* 4-Step Visual Flow: YOUR FILE -> YOUR BROWSER -> PROCESSING -> YOUR DOWNLOAD */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] mb-4">
                <FileImage className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[hsl(var(--primary))]">
                Step 01
              </span>
              <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
                Your File
              </h3>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                You select or drop an image or PDF from your device storage.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/12 text-sky-400 mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">
                Step 02
              </span>
              <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
                Your Browser Memory
              </h3>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Read locally via the browser File API. Zero bytes are transmitted over the network.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/12 text-purple-400 mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">
                Step 03
              </span>
              <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
                Local Processing
              </h3>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                HTML5 Canvas, Web Workers, and PDF engines transform your file on your CPU/GPU.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-emerald-500/30 bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400 mb-4">
                <Download className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                Step 04
              </span>
              <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
                Your Download
              </h3>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Saved directly back to your device. Closing the tab wipes temporary memory.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
            >
              Visit the Privacy Center & Verify in DevTools{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] uppercase tracking-wider mb-2">
            <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
            Clear Answers, No Asterisks
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6"
            >
              <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))]">
                {faq.q}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

