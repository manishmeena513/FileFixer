"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { files, setCommandCenterOpen, setShortcutsOpen } = useFileStore();

  const fileCount = files.length;

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
    setMobileOpen(false);
  }

  // Click outside listener for navigation dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--header-glass-bg)] backdrop-blur-xl shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center group transition-opacity hover:opacity-95 mr-2 sm:mr-4 shrink-0"
          aria-label="FileFixer Home"
        >
          <div className="sm:hidden">
            <Logo variant="full" size="xs" />
          </div>
          <div className="hidden sm:block">
            <Logo variant="full" size="md" />
          </div>
        </Link>

        {/* Universal Command Center Search Trigger */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex min-h-[44px] h-11 items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md px-2.5 sm:px-3.5 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:border-[var(--glass-border-luminous)] hover:text-[hsl(var(--foreground))] hover:shadow-[0_0_15px_rgba(96,165,250,0.2)] transition-all shadow-xs cursor-pointer touch-manipulation"
          aria-label="Open Command Center (Ctrl+K)"
        >
          <Search className="h-4 w-4 text-[hsl(var(--primary))]" />
          <span className="hidden md:inline">Search tools & actions...</span>
          <span className="hidden sm:inline md:hidden font-medium">Search</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            Ctrl+K
          </kbd>
        </button>

        {/* Desktop nav */}
        <nav
          ref={navRef}
          className="hidden items-center gap-0.5 lg:flex ml-2"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => {
            const isDropdownOpen = openDropdown === link.label;
            const dropdownId = `nav-dropdown-${link.label.toLowerCase()}`;
            const buttonId = `nav-btn-${link.label.toLowerCase()}`;

            return link.children ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                  aria-controls={dropdownId}
                  onClick={() => setOpenDropdown(isDropdownOpen ? null : link.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpenDropdown(link.label);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setOpenDropdown(null);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors cursor-pointer",
                    link.children.some((c) => pathname === c.href) || isDropdownOpen
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  {link.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-60 transition-transform duration-150",
                      isDropdownOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  id={dropdownId}
                  role="menu"
                  aria-labelledby={buttonId}
                  aria-orientation="vertical"
                  className={cn(
                    "absolute left-0 top-full w-56 pt-1.5 transition-all z-50",
                    isDropdownOpen ? "block" : "hidden"
                  )}
                >
                  <div className="rounded-2xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl py-1.5 shadow-2xl animate-scale-in">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          "min-h-[44px] flex items-center px-4 py-2 text-xs xl:text-sm rounded-xl mx-1 transition-colors",
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
            );
          })}
        </nav>

        {/* Right side tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Workspace Route Link with live badge */}
          <Link
            href="/workspace"
            className={cn(
              "inline-flex min-h-[44px] h-11 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer touch-manipulation",
              fileCount > 0
                ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.18)]"
                : "border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[var(--glass-border-luminous)]"
            )}
            aria-label={`Open Workspace (${fileCount} files)`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workspace</span>
            <span
              className={cn(
                "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                fileCount > 0
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {fileCount}
            </span>
          </Link>

          {/* Privacy Indicator */}
          <Link
            href="/privacy"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/15 transition-colors"
            title="Local browser processing — files never leave your device"
            aria-label="Local browser processing: files stay on your device"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>On-Device</span>
          </Link>

          {/* Shortcuts Modal Trigger */}
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[var(--glass-border-luminous)] transition-colors touch-manipulation cursor-pointer"
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
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] lg:hidden cursor-pointer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-[var(--glass-border)] bg-[var(--header-glass-bg)] backdrop-blur-2xl px-4 pb-6 pt-3 lg:hidden max-h-[80vh] overflow-y-auto animate-slide-up">
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
