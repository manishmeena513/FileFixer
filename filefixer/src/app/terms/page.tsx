import React from "react";
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — FileFixer",
  description: "Terms and conditions for using FileFixer browser utilities.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service — FileFixer",
    description: "Terms and conditions for using FileFixer browser utilities.",
    url: "/terms",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "FileFixer Terms of Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service — FileFixer",
    description: "Terms and conditions for using FileFixer browser utilities.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]">
          <FileText className="h-3.5 w-3.5" />
          <span>Legal &amp; Usage</span>
        </div>
        <h1 className="text-3xl font-extrabold sm:text-5xl text-[hsl(var(--foreground))]">
          Terms of Service
        </h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Effective date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="space-y-6 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">1. Acceptance of Terms</h2>
          <p>
            By accessing or using FileFixer, you agree to these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">2. Client-Side Execution</h2>
          <p>
            FileFixer provides browser-based file conversion, compression, and organization utilities. All operations are executed locally on your computing device using browser APIs and WebAssembly. We do not store, copy, or transmit the contents of your files to external servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">3. User Responsibility &amp; Backups</h2>
          <p>
            While FileFixer strives for maximum reliability, file processing inherently involves transformations. You are encouraged to maintain copies of your original source files prior to processing. FileFixer is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">4. Privacy Policy</h2>
          <p>
            Our handling of data is detailed in our{" "}
            <Link href="/privacy" className="text-[hsl(var(--primary))] hover:underline font-medium">
              Privacy Policy
            </Link>
            . We do not require accounts, track individual files, or harvest user telemetry.
          </p>
        </section>
      </div>
    </div>
  );
}
