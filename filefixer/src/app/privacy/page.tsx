import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Check,
  AlertCircle,
  HardDrive,
  Laptop,
  Cpu,
  Download,
  WifiOff,
  Terminal,
  Lock,
  ArrowRight,
  Trash2,
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Center — FileFixer",
  description:
    "How FileFixer processes images and PDFs 100% locally in your browser without ever uploading your files to a server.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Center — FileFixer",
    description:
      "How FileFixer processes images and PDFs 100% locally in your browser without ever uploading your files to a server.",
    url: "/privacy",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "FileFixer Privacy Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Center — FileFixer",
    description:
      "How FileFixer processes images and PDFs 100% locally in your browser without ever uploading your files to a server.",
    images: ["/branding/filefixer-og.png"],
  },
};

const FLOW_STEPS = [
  {
    step: "01",
    title: "YOUR FILE",
    subtitle: "Selected from your device",
    description:
      "Your image or PDF is read directly into a local browser File/ArrayBuffer reference. Zero network requests are initiated.",
    icon: HardDrive,
  },
  {
    step: "02",
    title: "YOUR BROWSER",
    subtitle: "Isolated memory sandbox",
    description:
      "The file stays inside your browser tab's sandboxed memory. Even our own web hosting servers cannot see or access it.",
    icon: Laptop,
  },
  {
    step: "03",
    title: "LOCAL PROCESSING",
    subtitle: "Canvas, PDF-lib & Web APIs",
    description:
      "Your device's CPU and GPU execute the compression, resizing, conversion, or PDF manipulation right on your hardware.",
    icon: Cpu,
  },
  {
    step: "04",
    title: "YOUR DOWNLOAD",
    subtitle: "Saved straight to disk",
    description:
      "A local Blob URL is generated and saved directly to your device. Closing the tab immediately purges temporary session memory.",
    icon: Download,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>FileFixer Privacy Center</span>
        </div>
        <h1 className="text-3xl font-extrabold sm:text-5xl tracking-tight text-[hsl(var(--foreground))]">
          Your files never leave your device.
        </h1>
        <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed">
          FileFixer is architected from the ground up as a local-first browser workspace. We don&apos;t have a file-processing server—your browser does all the work.
        </p>
      </div>

      {/* Visual Architecture Flow */}
      <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Zero-Upload Architecture
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              How Local Browser Processing Works
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 self-start sm:self-auto">
            <WifiOff className="h-4 w-4" />
            Works 100% Offline After Load
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLOW_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] p-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                      STEP {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight text-[hsl(var(--foreground))]">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-[hsl(var(--primary))] mt-0.5">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed mt-3">
                    {item.description}
                  </p>
                </div>

                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:flex items-center justify-end mt-4 text-[hsl(var(--muted-foreground)/0.5)]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* What Stays vs What We Never Collect */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
              What Stays Strictly On Your Device
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <li className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">All source files:</strong> Photos, scans, contracts, tax PDFs, and personal documents.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">All processed outputs:</strong> Compressed images, merged PDFs, extracted pages, and ZIP bundles.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">File metadata & EXIF:</strong> GPS coordinates, camera serials, and PDF properties inspected or stripped locally.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">Local job history:</strong> Stored in your browser&apos;s IndexedDB so you can review past compression savings—and clearable in one click.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
              What We Never Do
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <li className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">Zero cloud file uploads:</strong> We do not have S3 buckets, remote worker queues, or server endpoints that accept your files.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">No accounts or sign-ups:</strong> You never need to hand over an email address or password to use any FileFixer tool.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">No AI training on your data:</strong> Because your files never touch our servers, they can never be scraped, indexed, or used to train models.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[hsl(var(--foreground))]">No watermarks or artificial limits:</strong> Your output files belong 100% to you.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Don't Trust Us — Verify It Yourself */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
              Don&apos;t Take Our Word For It — Verify It in 30 Seconds
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Anyone can verify FileFixer&apos;s zero-upload architecture using standard browser tools:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 space-y-1.5">
            <span className="font-mono font-bold text-[hsl(var(--primary))]">
              Test 1: Airplane Mode
            </span>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Open any FileFixer tool, turn off your Wi-Fi or enable Airplane Mode, and drop a file. Compression, resizing, and PDF tools continue working at full speed.
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 space-y-1.5">
            <span className="font-mono font-bold text-[hsl(var(--primary))]">
              Test 2: Network Inspector
            </span>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Press <kbd className="rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 font-mono">F12</kbd> to open DevTools → <strong>Network</strong> tab. Process any image or PDF and confirm zero outbound <code className="font-mono">POST</code> or payload requests occur.
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 space-y-1.5">
            <span className="font-mono font-bold text-[hsl(var(--primary))]">
              Test 3: Local Storage Control
            </span>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Visit the <Link href="/history" className="text-[hsl(var(--primary))] underline">History</Link> tab or open the Session Workspace drawer to clear all local IndexedDB records and in-memory blobs immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
