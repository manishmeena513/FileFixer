"use client";

import React, { useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { Button } from "@/components/ui/button";

export function SupportPrompt() {
  const { isSupportPromptVisible, openSupportModal, dismissSupportPrompt } =
    useFileStore();

  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSupportPromptVisible) {
        dismissSupportPrompt();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSupportPromptVisible, dismissSupportPrompt]);

  if (!isSupportPromptVisible) return null;

  return (
    <div
      ref={promptRef}
      role="region"
      aria-live="polite"
      aria-label="Voluntary support prompt"
      className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 animate-slide-up pointer-events-auto"
    >
      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.96)] p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))]">
              Enjoying FileFixer?
            </h3>
          </div>
          <button
            type="button"
            onClick={dismissSupportPrompt}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors shrink-0"
            aria-label="Dismiss support prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
          If FileFixer helped you, consider supporting its development. Your support helps me continue improving free, privacy-focused file tools.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openSupportModal}
            className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(186,100%,36%)] font-semibold text-xs shadow-xs"
          >
            ❤️ Support FileFixer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissSupportPrompt}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
