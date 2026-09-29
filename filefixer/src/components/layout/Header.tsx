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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "@/components/branding/Logo";
import { useFileStore } from "@/stores/fileStore";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "All Tools" },
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
  {
    label: "Batch",
    href: "/batch",
    children: [
      { href: "/batch", label: "Batch Multi-Pipeline" },
      { href: "/batch-rename", label: "Batch Rename" },
      { href: "/inspect", label: "File Inspector" },
    ],
  },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];

const mobileLinks = [
  { href: "/tools", label: "All Tools Directory", icon: LayoutGrid },
  { href: "/compress-image", label: "Compress Image", icon: ImageIcon },
  { href: "/resize-image", label: "Resize Image", icon: ImageIcon },
  { href: "/convert-image", label: "Convert Image", icon: ImageIcon },
  { href: "/crop-image", label: "Crop & Rotate", icon: ImageIcon },
  { href: "/smart-compress", label: "Smart Under-X-MB", icon: Sparkles },
  { href: "/image-metadata", label: "EXIF Stripper", icon: Shield },
  { href: "/pdf-merge", label: "Merge PDFs", icon: FileText },
  { href: "/pdf-split", label: "Split PDF", icon: FileText },
  { href: "/pdf-compress", label: "Compress PDF", icon: FileText },
  { href: "/pdf-workspace", label: "PDF Workspace", icon: Layers },
  { href: "/images-to-pdf", label: "Images to PDF", icon: FileText },
  { href: "/batch", label: "Batch Pipeline", icon: Layers },
  { href: "/batch-rename", label: "Batch Rename", icon: Layers },
  { href: "/inspect", label: "File Inspector", icon: FileSearch },
  { href: "/history", label: "Local History", icon: Clock },
  { href: "/privacy", label: "Privacy Center", icon: Shield },
  { href: "/about", label: "About FileFixer", icon: Info },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { files, toggleWorkspace } = useFileStore();

  const fileCount = files.length;

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.92)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center group transition-opacity hover:opacity-95"
          aria-label="FileFixer Home"
        >
          <Logo variant="full" size="md" />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="group relative">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
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
                          "block px-4 py-2 text-sm transition-colors",
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
                  "rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
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
          {/* Workspace Trigger Button */}
          <button
            type="button"
            onClick={toggleWorkspace}
            className={cn(
              "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              fileCount > 0
                ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.18)]"
                : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
            )}
            aria-label={`Open Session Workspace (${fileCount} files)`}
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
          </button>

          <ThemeToggle />

          {/* Privacy badge */}
          <Link
            href="/privacy"
            className="hidden items-center gap-1.5 xl:inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            100% Client-Side
          </Link>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] md:hidden max-h-[80vh] overflow-y-auto animate-fade-in">
          <nav
            className="mx-auto max-w-7xl px-4 py-4"
            aria-label="Mobile navigation"
          >
            <div className="grid grid-cols-2 gap-2">
              {mobileLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
                    pathname === href
                      ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]"
                      : "bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

