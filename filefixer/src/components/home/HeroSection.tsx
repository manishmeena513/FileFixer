"use client";

import React from "react";
import { Shield, Lock, HardDrive, FileCheck } from "lucide-react";
import { LogoMark } from "@/components/branding/Logo";
import { TOOLS } from "@/lib/tools";
import { TabularNum } from "@/components/ui/TabularNum";

export function HeroSection() {
  return (
    <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
      {/* 1. Top Zero-Upload Trust Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[hsl(var(--primary))] mb-5 animate-fade-in">
        <LogoMark size={15} animated={false} />
        <span className="font-semibold text-xs tracking-wide">
          100% CLIENT-SIDE • ZERO SERVER UPLOADS
        </span>
      </div>

      {/* 2. Main Hero Headline */}
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up">
        Fix your files.{" "}
        <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-sky-400 to-blue-500 bg-clip-text text-transparent">
          Keep them private.
        </span>
      </h1>

      {/* 3. Subheadline */}
      <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed animate-slide-up">
        Universal, 100% on-device file tools for images, PDFs, and documents. Compress, convert, organize, and inspect with zero server uploads and zero data collection.
      </p>

      {/* 4. High-Contrast Privacy Badges */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] shadow-xs">
          <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>100% In-Browser Execution</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] shadow-xs">
          <Lock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <span>Zero Server Uploads</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] shadow-xs">
          <HardDrive className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          <span>No Account or Tracking</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--foreground))] shadow-xs">
          <FileCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>In-Memory File Safety</span>
        </span>
      </div>

      {/* 5. Dynamic Telemetry & Metric Strip */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] p-3 text-center shadow-xs">
          <div className="tabular-nums font-mono font-extrabold text-xl sm:text-2xl text-[hsl(var(--foreground))]">
            <TabularNum value={TOOLS.length} />
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
            Local Tools
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] p-3 text-center shadow-xs">
          <div className="tabular-nums font-mono font-extrabold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
            0 B
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
            Server Uploads
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] p-3 text-center shadow-xs">
          <div className="tabular-nums font-mono font-extrabold text-xl sm:text-2xl text-[hsl(var(--primary))]">
            100%
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
            Client-Side Execution
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] p-3 text-center shadow-xs">
          <div className="tabular-nums font-mono font-extrabold text-xl sm:text-2xl text-sky-600 dark:text-sky-400">
            <TabularNum value={33} />
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
            Built-in Static Routes
          </p>
        </div>
      </div>
    </div>
  );
}
