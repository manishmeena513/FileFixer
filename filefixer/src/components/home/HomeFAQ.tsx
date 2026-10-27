"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Are my files uploaded to your servers?",
    a: "No. FileFixer processes supported files directly in your web browser using HTML5 Canvas, Web Workers, and WebAssembly. Your files remain exclusively in your device's local memory.",
  },
  {
    q: "Do I need to create an account or subscribe?",
    a: "Never. All tools are completely free, open, and work immediately without registration, email signups, telemetry trackers, or paywalls.",
  },
  {
    q: "How does the Temporary File Workspace work?",
    a: "When you drop or select files, they are held in your browser's temporary memory session. You can switch between compatible tools (like Compress → Resize → Convert) without re-uploading, and everything clears automatically when you close the tab.",
  },
  {
    q: "Does FileFixer work on mobile phones and as an installed PWA?",
    a: "Yes. FileFixer is built equally for desktop browsers, mobile phones, and Chrome-installed PWAs with full touch support and offline app-shell caching.",
  },
];

export function HomeFAQ() {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] uppercase tracking-wider mb-2">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
          Clear Answers, No Asterisks
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FAQS.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md p-5 sm:p-6 shadow-md hover:border-[var(--glass-border-luminous)] transition-all"
          >
            <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))]">
              {faq.q}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
