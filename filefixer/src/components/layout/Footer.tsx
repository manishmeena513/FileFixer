import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, HardDrive } from "lucide-react";
import { Logo } from "@/components/branding/Logo";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity" aria-label="FileFixer Home">
              <Logo variant="full" size="sm" showTagline={false} />
            </Link>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Fix your files. Keep them private. Zero file uploads to external servers. In-browser digital workshop.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Client-side processing</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--foreground))] tracking-wider uppercase">Image Utilities</h3>
            <ul className="mt-3 space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li>
                <Link href="/compress-image" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Compress Images
                </Link>
              </li>
              <li>
                <Link href="/resize-image" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Resize & Scale
                </Link>
              </li>
              <li>
                <Link href="/convert-image" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Convert (JPG, PNG, WebP)
                </Link>
              </li>
              <li>
                <Link href="/crop-image" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Crop & Rotate
                </Link>
              </li>
              <li>
                <Link href="/image-metadata" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  EXIF & GPS Stripper
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--foreground))] tracking-wider uppercase">PDF Utilities</h3>
            <ul className="mt-3 space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li>
                <Link href="/pdf-merge" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Merge PDFs
                </Link>
              </li>
              <li>
                <Link href="/pdf-split" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Split & Extract Pages
                </Link>
              </li>
              <li>
                <Link href="/pdf-compress" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link href="/pdf-workspace" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Visual Page Workspace
                </Link>
              </li>
              <li>
                <Link href="/images-to-pdf" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Images to PDF
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--foreground))] tracking-wider uppercase">Power Tools</h3>
            <ul className="mt-3 space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li>
                <Link href="/smart-compress" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Smart Under-X-MB
                </Link>
              </li>
              <li>
                <Link href="/batch" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Batch Multi-Pipeline
                </Link>
              </li>
              <li>
                <Link href="/batch-rename" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Batch Sequence Rename
                </Link>
              </li>
              <li>
                <Link href="/inspect" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Universal File Inspector
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  IndexedDB History
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--foreground))] tracking-wider uppercase">Legal & Architecture</h3>
            <ul className="mt-3 space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li>
                <Link href="/tools" className="hover:text-[hsl(var(--foreground))] transition-colors font-medium text-[hsl(var(--primary))]">
                  All Tools Directory
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  About FileFixer
                </Link>
              </li>
              <li>
                <Link href="/branding" className="hover:text-[hsl(var(--foreground))] transition-colors text-sky-400 font-medium">
                  Brand Identity & Assets
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Privacy Policy & Guarantee
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[hsl(var(--foreground))] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                <Cpu className="h-3 w-3" /> Canvas & WebAssembly
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[hsl(var(--border))] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <p>© {new Date().getFullYear()} FileFixer. Open and privacy-first.</p>
          <div className="flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
            <span>Developed by</span>
            <span className="rounded-md border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.1)] px-2.5 py-0.5 font-semibold text-[hsl(var(--primary))] shadow-sm">
              Manish Meena
            </span>
          </div>
          <p>Fix your files. Keep them private.</p>
        </div>
      </div>
    </footer>
  );
}
