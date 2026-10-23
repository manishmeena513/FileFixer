"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useFileStore } from "@/stores/fileStore";

export function SupportBanner() {
  const { openSupportModal } = useFileStore();

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left shadow-xs">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
            Support Free, Private Tools
          </h3>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-lg leading-relaxed">
            FileFixer is completely free, open, and private with zero ads or tracking. If FileFixer helps your workflow, voluntary support helps keep it independent.
          </p>
        </div>
        <Button
          onClick={openSupportModal}
          className="shrink-0 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold text-xs shadow-xs min-h-[44px] px-5 cursor-pointer touch-manipulation"
        >
          ❤️ Support FileFixer
        </Button>
      </div>
    </section>
  );
}
