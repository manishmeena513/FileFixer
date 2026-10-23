"use client";

import React from "react";
import Link from "next/link";
import { Lock, FileImage, Shield, Cpu, Download, ArrowRight } from "lucide-react";

export function PrivacyArchitecture() {
  return (
    <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Zero-Upload Guarantee</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
            Why Your Files Stay Private
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Traditional online converters upload your private documents to remote cloud servers. FileFixer runs the entire processing engine inside your browser tab.
          </p>
        </div>

        {/* 4-Step Visual Flow */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] mb-4">
              <FileImage className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[hsl(var(--primary))]">
              Step 01
            </span>
            <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
              Your File
            </h3>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Selected directly from local disk. No payload ever leaves your computer or phone.
            </p>
          </div>

          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400 mb-4">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Step 02
            </span>
            <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
              Browser RAM
            </h3>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Read locally via the HTML5 File API. Zero outbound network requests or server storage.
            </p>
          </div>

          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/12 text-purple-600 dark:text-purple-400 mb-4">
              <Cpu className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
              Step 03
            </span>
            <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
              Local Computation
            </h3>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              HTML5 Canvas, Web Workers, and Wasm transform your files directly on your device CPU/GPU.
            </p>
          </div>

          <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-emerald-500/30 bg-[hsl(var(--background))]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 mb-4">
              <Download className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Step 04
            </span>
            <h3 className="mt-1 text-base font-bold text-[hsl(var(--foreground))]">
              Local Download
            </h3>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Saved back directly to device. Tab close purges temporary session RAM immediately.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/privacy"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer touch-manipulation"
          >
            <span>Visit the Privacy Center &amp; Verify in DevTools</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
