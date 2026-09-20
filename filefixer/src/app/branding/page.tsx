"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  Check,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  Palette,
  ExternalLink,
  Shield,
  Zap,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark, LogoWordmark } from "@/components/branding/Logo";

const brandColors = [
  {
    name: "Primary Blue",
    hex: "#2563EB",
    rgb: "37, 99, 235",
    role: "Core Brand Identity & Shell",
    darkClass: "bg-[#2563EB] text-white",
  },
  {
    name: "Accent Blue",
    hex: "#3882F6",
    rgb: "56, 130, 246",
    role: "Wordmark 'Fixer' & Top Gradient",
    darkClass: "bg-[#3882F6] text-white",
  },
  {
    name: "Highlight Cyan",
    hex: "#06B6D4",
    rgb: "6, 182, 212",
    role: "Energy Highlight & Gradients",
    darkClass: "bg-[#06B6D4] text-slate-950",
  },
  {
    name: "Background Navy",
    hex: "#0B1220",
    rgb: "11, 18, 32",
    role: "Dark Canvas & Negative Space",
    darkClass: "bg-[#0B1220] text-white border border-slate-800",
  },
  {
    name: "Surface Slate",
    hex: "#1E293B",
    rgb: "30, 41, 59",
    role: "Cards, Containers, Borders",
    darkClass: "bg-[#1E293B] text-white",
  },
  {
    name: "Muted Cool Gray",
    hex: "#94A3B8",
    rgb: "148, 163, 184",
    role: "Taglines, Secondary Metadata",
    darkClass: "bg-[#94A3B8] text-slate-900",
  },
  {
    name: "Light Text / Crisp White",
    hex: "#F8FAFC",
    rgb: "248, 250, 252",
    role: "Headings, Wrench, Fold Crease",
    darkClass: "bg-[#F8FAFC] text-slate-900 border border-slate-300",
  },
];

const downloadableAssets = [
  {
    title: "Full Primary Logo (Dark)",
    format: "SVG",
    desc: "Complete horizontal vector lockup for dark backgrounds with tagline.",
    path: "/branding/filefixer-logo-dark.svg",
    filename: "filefixer-logo-dark.svg",
  },
  {
    title: "Full Primary Logo (Light)",
    format: "SVG",
    desc: "Complete horizontal vector lockup for light and print backgrounds.",
    path: "/branding/filefixer-logo-light.svg",
    filename: "filefixer-logo-light.svg",
  },
  {
    title: "Logo Mark Only (Dark)",
    format: "SVG",
    desc: "Standalone document + wrench vector symbol for dark mode UI.",
    path: "/branding/filefixer-mark.svg",
    filename: "filefixer-mark.svg",
  },
  {
    title: "Logo Mark Only (Light)",
    format: "SVG",
    desc: "Standalone document + wrench vector symbol for light mode UI.",
    path: "/branding/filefixer-mark-light.svg",
    filename: "filefixer-mark-light.svg",
  },
  {
    title: "Wordmark Only",
    format: "SVG",
    desc: "Typographic lockup without icon for minimal banner headers.",
    path: "/branding/filefixer-wordmark.svg",
    filename: "filefixer-wordmark.svg",
  },
  {
    title: "Optimized Favicon",
    format: "SVG",
    desc: "Calibrated 32x32 vector favicon tuned for desktop and mobile browser tabs.",
    path: "/branding/filefixer-favicon.svg",
    filename: "filefixer-favicon.svg",
  },
  {
    title: "Official App Icon (Squircle)",
    format: "PNG",
    desc: "512x512 rounded squircle app icon for mobile homescreens and PWA install.",
    path: "/branding/filefixer-app-icon.png",
    filename: "filefixer-app-icon.png",
  },
  {
    title: "PWA Launcher Icon (192px)",
    format: "PNG",
    desc: "192x192 raster icon for Android and iOS PWA installation manifest.",
    path: "/branding/filefixer-192.png",
    filename: "filefixer-icon-192.png",
  },
  {
    title: "OpenGraph Social Card",
    format: "PNG",
    desc: "1200x630 high-resolution social preview card with feature badges.",
    path: "/branding/filefixer-og.png",
    filename: "filefixer-og-card.png",
  },
];

export default function BrandingPage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400">
          <Palette className="h-3.5 w-3.5" />
          <span>Brand Identity &amp; Assets</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-[hsl(var(--foreground))]">
          FileFixer Brand System
        </h1>
        <p className="text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
          &ldquo;Fix your files. Keep them private.&rdquo; Explore the official visual design system,
          geometric construction, color tokens, and production-ready vector assets.
        </p>
      </div>

      {/* Primary Logo Showcase */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Logo Lockups</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Available in full lockup, icon mark, and wordmark variants across light and dark contexts.
            </p>
          </div>
          <a href="/branding/filefixer-logo-dark.svg" download="filefixer-logo.svg">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download Full SVG
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dark Background Showcase */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B1220] p-8 flex flex-col justify-between space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-slate-800 text-[10px] font-mono text-slate-400 rounded-bl-lg">
              Dark Canvas (#0B1220)
            </div>
            <div className="py-10 flex items-center justify-center">
              <Logo variant="full" size="xl" showTagline={true} theme="dark" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span className="font-mono">Primary Full Lockup</span>
              <span>Default UI / Dark Mode</span>
            </div>
          </div>

          {/* Light Background Showcase */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col justify-between space-y-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-slate-100 text-[10px] font-mono text-slate-600 rounded-bl-lg">
              Light Canvas (#FFFFFF)
            </div>
            <div className="py-10 flex items-center justify-center">
              <Logo variant="full" size="xl" showTagline={true} theme="light" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-mono">Primary Full Lockup</span>
              <span>Light Mode / Print UI</span>
            </div>
          </div>
        </div>

        {/* Mark, Wordmark, and App Icon Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Standalone Mark */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-28 flex items-center justify-center">
              <LogoMark size={64} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">Logo Mark</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Document + Fixing Wrench
              </p>
            </div>
          </div>

          {/* Wordmark */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-28 flex items-center justify-center">
              <LogoWordmark fontSize="text-3xl" showTagline={true} taglineSize="text-[10px]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">Wordmark Only</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                File (White) + Fixer (Blue)
              </p>
            </div>
          </div>

          {/* App Icon Squircle */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-28 flex items-center justify-center">
              <img
                src="/icons/icon-192.png"
                alt="FileFixer App Icon"
                className="h-20 w-20 rounded-[18px] shadow-lg border border-slate-800"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">App Icon (Squircle)</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                PWA &amp; Mobile Homescreen (512px)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Geometry & Brand Metaphor */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 sm:p-10 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#2563EB]" /> Geometry &amp; Anatomy
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5 leading-relaxed">
            The FileFixer mark seamlessly fuses the concepts of a digital document, the letter &ldquo;F&rdquo;, and precision repair joinery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 p-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-[#3882F6] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-base text-[hsl(var(--foreground))]">The Document &amp; Fold</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              A modern digital document sheet with smooth rounded corners and a 45° chamfered folded corner in crisp white, immediately establishing recognition as a file utility platform.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-base text-[hsl(var(--foreground))]">The Letter &ldquo;F&rdquo; Monogram</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              The vibrant blue shapes form the top bar, middle bar, and vertical spine of a bold capital &ldquo;F&rdquo; for FileFixer, balanced with a 45° chamfered bottom-right corner.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-base text-[hsl(var(--foreground))]">The Active Wrench</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Rising at 45° from the bottom-left, the precision wrench jaws actively grip and adjust the middle bar of the document &ldquo;F&rdquo;, embodying the core promise: fixing your files.
            </p>
          </div>
        </div>
      </section>

      {/* Official Color Swatches */}
      <section className="space-y-6">
        <div className="border-b border-[hsl(var(--border))] pb-3">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Brand Color Palette</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Exact color values from the official FileFixer brand reference board. Click any card to copy HEX.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {brandColors.map((color) => (
            <button
              key={color.hex}
              onClick={() => copyToClipboard(color.hex)}
              type="button"
              className="group text-left rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden transition-all hover:border-[hsl(var(--primary))] hover:shadow-md"
            >
              <div className={`h-20 ${color.darkClass} flex items-end p-2 transition-transform group-hover:scale-[1.02]`}>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 backdrop-blur text-white">
                  {color.hex}
                </span>
              </div>
              <div className="p-2.5 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[hsl(var(--foreground))] truncate">{color.name}</h4>
                  {copiedHex === color.hex ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-[9.5px] text-[hsl(var(--muted-foreground))] truncate">{color.role}</p>
                <p className="text-[8.5px] font-mono text-[hsl(var(--muted-foreground))]">rgb({color.rgb})</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Social / Open Graph Preview Card */}
      <section className="space-y-6">
        <div className="border-b border-[hsl(var(--border))] pb-3">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Social Preview Card (1200 × 630)</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Rendered for link sharing across WhatsApp, Discord, X/Twitter, LinkedIn, and Facebook.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <img
            src="/branding/filefixer-og.png"
            alt="FileFixer OpenGraph Social Card Preview"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Official Assets Download Center */}
      <section className="space-y-6">
        <div className="border-b border-[hsl(var(--border))] pb-3">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Download Official Brand Assets</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Production-ready SVG vector assets and raster PNG packages matching the design reference.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {downloadableAssets.map((asset) => (
            <div
              key={asset.path}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {asset.format}
                  </span>
                  <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                    {asset.filename}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[hsl(var(--foreground))]">{asset.title}</h4>
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {asset.desc}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={asset.path}
                  download={asset.filename}
                  className="w-full"
                >
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" /> Download Asset
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="text-center pt-8 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Ready to fix your files?</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Explore our directory of 15+ browser-native file tools.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/tools">
            <Button size="sm" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              Explore All Tools <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href="/">
            <Button size="sm" variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
