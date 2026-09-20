"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minimize2,
  Maximize2,
  RefreshCw,
  FilePlus,
  Scissors,
  Images,
  Shield,
  Zap,
  HardDrive,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck,
  Layers,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFileStore } from "@/stores/fileStore";
import { isPDFFile, isImageFile } from "@/lib/file-utils";
import { LogoMark } from "@/components/branding/Logo";

const quickTools = [
  {
    title: "Smart 'Under X MB'",
    desc: "Signature multi-pass optimizer that progressively tests compression levels until your target size is reached.",
    href: "/smart-compress",
    icon: Sparkles,
    badge: "Signature",
    color: "from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    title: "Batch Multi-Pipeline",
    desc: "Execute multi-stage image processing (Resize → Convert → Compress → Rename) in one pass.",
    href: "/batch",
    icon: Layers,
    badge: "Bulk Hub",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
  },
  {
    title: "Compress Image",
    desc: "Reduce JPG, PNG, and WebP file size by up to 80% without losing visual quality.",
    href: "/compress-image",
    icon: Minimize2,
    badge: "Fast",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
  },
  {
    title: "PDF Visual Workspace",
    desc: "Reorder, rotate, duplicate, and delete PDF pages interactively with visual thumbnails.",
    href: "/pdf-workspace",
    icon: Layers,
    badge: "Workspace",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
  {
    title: "Merge PDFs",
    desc: "Combine multiple PDF documents into one cleanly organized file in seconds.",
    href: "/pdf-merge",
    icon: FilePlus,
    badge: "Popular",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Split & Extract PDF",
    desc: "Extract specific pages or ranges from any PDF without uploading to a third party.",
    href: "/pdf-split",
    icon: Scissors,
    badge: "Clean",
    color: "from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30",
  },
  {
    title: "Universal File Inspector",
    desc: "Inspect dimensions, EXIF camera tags, GPS location presence, and PDF metadata dictionaries.",
    href: "/inspect",
    icon: FileCheck,
    badge: "Inspect",
    color: "from-emerald-500/20 to-cyan-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Resize Image",
    desc: "Scale dimensions with aspect ratio lock or choose standard social media & passport presets.",
    href: "/resize-image",
    icon: Maximize2,
    badge: "Presets",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
  },
  {
    title: "Convert Image",
    desc: "Switch between JPG, PNG, and WebP instantly in single or bulk batches.",
    href: "/convert-image",
    icon: RefreshCw,
    badge: "Convert",
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30",
  },
];

const faqs = [
  {
    q: "Are my files uploaded to your servers?",
    a: "No! FileFixer processes files directly in your web browser using HTML5 Canvas, Web Workers, and WebAssembly. Your files never leave your device.",
  },
  {
    q: "Do I need to create an account or subscribe?",
    a: "Never. All core tools are completely free, open, and work instantly without registration, email, or passwords.",
  },
  {
    q: "Can I process multiple files at once?",
    a: "Yes! Batch processing is built into every image tool and PDF merge tool, complete with ZIP download when generating multiple outputs.",
  },
  {
    q: "Does FileFixer work on mobile devices?",
    a: "Yes, FileFixer is fully responsive on iOS and Android phones and tablets, supporting both touch file selection and native mobile file managers.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const addFiles = useFileStore((s) => s.addFiles);
  const [routedAction, setRoutedAction] = useState<string | null>(null);

  const handleDroppedFiles = (files: File[]) => {
    if (files.length === 0) return;
    addFiles(files);

    const hasPdfs = files.some(isPDFFile);
    const hasImages = files.some(isImageFile);

    if (hasPdfs && files.length > 1) {
      router.push("/pdf-merge");
    } else if (hasPdfs) {
      router.push("/pdf-split");
    } else if (hasImages) {
      router.push("/compress-image");
    } else {
      router.push("/compress-image");
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 blur-3xl pointer-events-none">
          <div className="h-[450px] w-[600px] rounded-full bg-gradient-to-tr from-[hsl(var(--primary)/0.3)] to-purple-600/20" />
        </div>

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-1.5 text-xs font-medium text-[hsl(var(--primary))] mb-6">
            <LogoMark size={15} animated={false} />
            <span>Browser-native file workshop</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Fix your files.{" "}
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Keep them private.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-[hsl(var(--muted-foreground))] leading-relaxed sm:text-xl">
            Compress, convert, resize, merge, and split files locally in your browser.
            No server uploads, no accounts, zero tracking.
          </p>

          {/* Quick Universal DropZone */}
          <div className="mx-auto mt-10 max-w-3xl">
            <DropZone
              onFiles={handleDroppedFiles}
              label="Drop any image or PDF here to fix it immediately"
              sublabel="Files are processed directly in your browser. Nothing is uploaded."
              className="py-12 shadow-2xl border-2"
            />
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <Shield className="h-4 w-4 text-emerald-400" /> 100% Client-side
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <Zap className="h-4 w-4 text-[hsl(var(--primary))]" /> Instant Processing
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <HardDrive className="h-4 w-4 text-purple-400" /> No Account Needed
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <FileCheck className="h-4 w-4 text-blue-400" /> Batch Processing Ready
            </span>
          </div>
        </div>
      </section>

      {/* Quick Tools Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
            Everyday File Utilities
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Pick a specialized tool to solve your immediate file problem.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[hsl(var(--primary)/0.5)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.05)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg border bg-gradient-to-br ${tool.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold tracking-wider">
                      {tool.badge}
                    </Badge>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] group-hover:underline">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Explore All Tools CTA */}
        <div className="mt-12 rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--card))] via-[hsl(var(--secondary)/0.5)] to-[hsl(var(--card))] p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
              Explore all tools
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Find the right tool for your file.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/tools">
              <Button size="lg" className="w-full sm:w-auto font-semibold">
                View All Tools <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              How FileFixer Works
            </h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Simple 3-step digital workshop workflow with complete privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-mono font-bold text-lg mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Drop Your Files</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Drag-and-drop or browse files from your computer or phone. Files stay in browser memory.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-mono font-bold text-lg mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Fix & Optimize</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Compress, convert, resize, or merge using Web Workers without freezing your screen.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-mono font-bold text-lg mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Compare & Download</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Inspect visual before-and-after savings, then download single files or a bundled ZIP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] uppercase tracking-wider mb-2">
            <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
            Clear Answers, No Asterisks
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
            >
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{faq.q}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
