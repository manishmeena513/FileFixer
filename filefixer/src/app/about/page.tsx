import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, ArrowRight, HardDrive, Lock, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/branding/Logo";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About FileFixer — The Private Browser-Native File Workshop",
  description: "Learn about the mission, architecture, and technology behind FileFixer.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About FileFixer — The Private Browser-Native File Workshop",
    description: "Learn about the mission, architecture, and technology behind FileFixer.",
    url: "/about",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "About FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About FileFixer — The Private Browser-Native File Workshop",
    description: "Learn about the mission, architecture, and technology behind FileFixer.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-1.5 text-xs font-medium text-[hsl(var(--primary))]">
          <LogoMark size={16} animated={false} />
          <span>Our Mission</span>
        </div>
        <h1 className="text-3xl font-extrabold sm:text-5xl text-[hsl(var(--foreground))]">
          Fix your files. Keep them private.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
          FileFixer bridges the gap between clunky desktop software and shady online utility websites that force you to upload sensitive documents to their servers.
        </p>
      </div>

      {/* Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Zero Server Uploads</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            All compression, conversion, page splitting, and resizing executes locally on your device using Web Workers, HTML5 Canvas, and modern Web APIs.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">No Accounts Needed</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            Never sign up, provide your email, or wait in an artificial server queue. Open the webpage, drag your files, get your results instantly.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-[hsl(var(--foreground))]">Complete Control</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            Batch process entire collections of photos or documents with single-click ZIP downloads, aspect ratio locks, and presets.
          </p>
        </div>
      </div>

      {/* Architecture overview */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 space-y-4">
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
          <Cpu className="h-5 w-5 text-[hsl(var(--primary))]" /> Under the Hood
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
          FileFixer is built with Next.js App Router, TypeScript, Tailwind CSS, pdf-lib for client-side PDF document manipulation, and browser-image-compression with Canvas hardware acceleration for high-fidelity image processing.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/privacy">
            <Button variant="outline" size="sm">
              Read Our Privacy Policy <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href="/branding">
            <Button variant="outline" size="sm" className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
              <Palette className="h-3.5 w-3.5 mr-1.5" /> Brand Identity &amp; Assets
            </Button>
          </Link>
        </div>
      </div>

      {/* Developer Credit */}
      <div className="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.04)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-[hsl(var(--primary))]">Creator &amp; Lead Engineer</span>
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mt-0.5">Manish Meena</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Built FileFixer to provide students, creators, and professionals a fast, privacy-first digital workshop without cloud lock-in.
          </p>
        </div>
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-mono font-medium text-[hsl(var(--foreground))] shadow-sm">
          manishmeena
        </div>
      </div>
    </div>
  );
}
