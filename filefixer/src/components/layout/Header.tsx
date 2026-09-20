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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "@/components/branding/Logo";

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
    label: "Batch Tools",
    href: "/batch",
    children: [
      { href: "/batch", label: "Batch Multi-Pipeline" },
      { href: "/batch-rename", label: "Batch Rename" },
    ],
  },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];

const mobileLinks = [
  { href: "/tools", label: "All Tools", icon: LayoutGrid },
  { href: "/compress-image", label: "Compress Image", icon: ImageIcon },
  { href: "/resize-image", label: "Resize Image", icon: ImageIcon },
  { href: "/convert-image", label: "Convert Image", icon: ImageIcon },
  { href: "/crop-image", label: "Crop & Rotate", icon: ImageIcon },
  { href: "/image-metadata", label: "EXIF Stripper", icon: Shield },
  { href: "/pdf-merge", label: "Merge PDFs", icon: FileText },
  { href: "/pdf-split", label: "Split PDF", icon: FileText },
  { href: "/pdf-compress", label: "Compress PDF", icon: FileText },
  { href: "/pdf-workspace", label: "PDF Workspace", icon: Layers },
  { href: "/images-to-pdf", label: "Images to PDF", icon: FileText },
  { href: "/smart-compress", label: "Smart Under-X-MB", icon: Sparkles },
  { href: "/batch", label: "Batch Pipeline", icon: Layers },
  { href: "/batch-rename", label: "Batch Rename", icon: Layers },
  { href: "/inspect", label: "File Inspector", icon: FileSearch },
  { href: "/history", label: "Local History", icon: Clock },
  { href: "/about", label: "About", icon: Info },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] backdrop-blur">
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
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
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
                </button>
                <div className="absolute left-0 top-full hidden w-52 pt-2 group-hover:block">
                  <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1.5 shadow-xl">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors",
                          pathname === child.href
                            ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
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
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Privacy badge */}
          <div className="hidden items-center gap-2 lg:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              100% Client-Side
            </span>
          </div>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] md:hidden max-h-[80vh] overflow-y-auto">
          <nav className="mx-auto max-w-7xl px-4 py-4" aria-label="Mobile navigation">
            <div className="grid grid-cols-2 gap-2">
              {mobileLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-xs font-medium transition-colors",
                    pathname === href
                      ? "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />
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
