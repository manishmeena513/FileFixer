import React from "react";
import { ShieldCheck, Check, AlertCircle } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FileFixer",
  description: "Learn how FileFixer protects your data with local, in-browser processing.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy — FileFixer",
    description: "Learn how FileFixer protects your data with local, in-browser processing.",
    url: "/privacy",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "FileFixer Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — FileFixer",
    description: "Learn how FileFixer protects your data with local, in-browser processing.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Privacy by Design</span>
        </div>
        <h1 className="text-3xl font-extrabold sm:text-5xl text-[hsl(var(--foreground))]">
          Your files never leave your machine.
        </h1>
        <p className="text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="space-y-8 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">1. The Core Principle</h2>
          <p>
            Traditional file converter and compressor websites upload your sensitive files (legal documents, personal photos, tax returns, contracts) to their cloud servers, process them remotely, and provide a temporary download link.
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">FileFixer does NOT operate this way.</strong> Every operation supported in FileFixer runs 100% inside your web browser using HTML5 Canvas, Web Workers, and pure JavaScript libraries.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">2. What We Collect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs uppercase tracking-wider">
                <Check className="h-4 w-4" /> What Stays On Your Device
              </span>
              <ul className="space-y-1 text-xs">
                <li>• Your uploaded files and images</li>
                <li>• Processed output files and ZIP archives</li>
                <li>• File names, EXIF data, and document contents</li>
                <li>• Processing settings and options</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-2">
              <span className="flex items-center gap-1.5 font-bold text-[hsl(var(--foreground))] text-xs uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--primary))]" /> What We Never Collect
              </span>
              <ul className="space-y-1 text-xs">
                <li>• Zero file content transmission</li>
                <li>• No user accounts or login credentials</li>
                <li>• No tracking cookies or advertising pixels</li>
                <li>• No permanent server-side file logs</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">3. Offline Availability</h2>
          <p>
            Because processing occurs locally, once the application assets are cached by your browser, FileFixer continues to function smoothly without active internet connectivity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">4. Contact & Transparency</h2>
          <p>
            If you have questions about how file operations are isolated inside your browser, you can inspect the browser&apos;s DevTools Network tab while processing any file to verify that no network requests are dispatched.
          </p>
        </section>
      </div>
    </div>
  );
}
