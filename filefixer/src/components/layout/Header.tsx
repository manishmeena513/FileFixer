"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Image as ImageIcon,
  FileText,
  Layers,
  Info,
  Shield,
  Clock,
  Sparkles,
  FileSearch,
  LayoutGrid,
  ChevronDown,
  FolderKanban,
  Search,
  Command,
  Workflow,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "@/components/branding/Logo";
import { useFileStore } from "@/stores/fileStore";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/workspace", label: "Workspace" },
  {
    label: "Studios",
    href: "/image-studio",
    children: [
      { href: "/image-studio", label: "Image Studio" },
      { href: "/pdf-studio", label: "PDF Studio" },
      { href: "/batch", label: "Batch Studio" },
      { href: "/workflows", label: "Workflow Builder" },
      { href: "/privacy-cleaner", label: "Privacy Cleaner" },
    ],
  },
  {
    label: "Images",
    href: "/compress-image",
    children: [
      { href: "/compress-image", label: "Compress Image" },
      { href: "/resize-image", label: "Resize Image" },
      { href: "/convert-image", label: "Convert Image" },
      { href: "/crop-image", label: "Crop & Rotate" },
      { href: "/smart-compress", label: "Exact Size (Under X MB)" },
      { href: "/image-metadata", label: "EXIF & GPS Stripper" },
    ],
  },
  {
    label: "PDF",
    href: "/pdf-merge",
    children: [
      { href: "/pdf-merge", label: "Merge PDFs" },
      { href: "/pdf-split", label: "Split & Extract" },
      { href: "/pdf-compress", label: "Compress PDF" },
      { href: "/pdf-workspace", label: "Visual Page Workspace" },
      { href: "/images-to-pdf", label: "Images to PDF" },
    ],
  },
  { href: "/tools", label: "All Tools" },
  { href: "/history", label: "History" },
];

const mobileLinks = [
  { href: "/workspace", label: "File Workspace 3.0", icon: FolderKanban },
  { href: "/image-studio", label: "Image Studio", icon: ImageIcon },
  { href: "/pdf-studio", label: "PDF Studio", icon: FileText },
  { href: "/batch", label: "Batch Studio", icon: Layers },
  { href: "/workflows", label: "Workflow Builder", icon: Workflow },
  { href: "/privacy-cleaner", label: "Privacy Cleaner", icon: Shield },
  { href: "/tools", label: "All Tools Directory", icon: LayoutGrid },
  { href: "/compress-image", label: "Compress Image", icon: ImageIcon },
  { href: "/smart-compress", label: "Smart Under-X-MB", icon: Sparkles },
  { href: "/pdf-merge", label: "Merge PDFs", icon: FileText },
  { href: "/pdf-split", label: "Split PDF", icon: FileText },
  { href: "/pdf-compress", label: "Compress PDF", icon: FileText },
  { href: "/inspect", label: "File Inspector", icon: FileSearch },
  { href: "/history", label: "Local History", icon: Clock },
  { href: "/privacy", label: "Privacy Center", icon: Shield },
  { href: "/about", label: "About FileFixer", icon: Info },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { files, setCommandCenterOpen, setShortcutsOpen } = useFileStore();

  const fileCount = files.length;

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.92)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center group transition-opacity hover:opacity-95 mr-4"
          aria-label="FileFixer Home"
        >
          <Logo variant="full" size="md" />
        </Link>

        {/* Universal Command Center Search Trigger */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:text-[hsl(var(--foreground))] transition-all shadow-xs"
          aria-label="Open Command Center (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
          <span className="hidden sm:inline">Search tools & actions...</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            Ctrl+K
          </kbd>
        </button>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-0.5 lg:flex ml-2"
          aria-label="Main navigation"
        >
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="group relative">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors",
                    link.children.some((c) => pathname === c.href)
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-150 group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 top-full hidden w-56 pt-1.5 group-hover:block group-focus-within:block">
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1.5 shadow-xl animate-scale-in">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-4 py-2 text-xs xl:text-sm transition-colors",
                          pathname === child.href
                            ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))] font-medium"
                            : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Right side tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Workspace Route Link with live badge */}
          <Link
            href="/workspace"
            className={cn(
              "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              fileCount > 0
                ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.18)]"
                : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
            )}
            aria-label={`Open Workspace (${fileCount} files)`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workspace</span>
            <span
              className={cn(
                "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                fileCount > 0
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {fileCount}
            </span>
          </Link>

          {/* Shortcuts Modal Trigger */}
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 pb-6 pt-3 lg:hidden max-h-[80vh] overflow-y-auto animate-slide-up">
          <div className="space-y-1">
            {mobileLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
