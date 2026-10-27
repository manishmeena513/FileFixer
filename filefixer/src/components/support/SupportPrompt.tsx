"use client";

import React, { useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SupportPrompt() {
  const {
    isSupportPromptVisible,
    openSupportModal,
    dismissSupportPrompt,
    downloadQueue,
  } = useFileStore();

  const hasDownloads = downloadQueue.length > 0;

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
      className={cn(
        "fixed left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm md:bottom-6 z-40 animate-slide-up pointer-events-auto transition-all duration-300",
        hasDownloads ? "bottom-80 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
      )}
    >
      <div className="overflow-hidden rounded-3xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(59,130,246,0.18)] backdrop-blur-2xl transition-all">
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
            className="flex h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors shrink-0 touch-manipulation cursor-pointer"
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
            variant="accent"
            onClick={openSupportModal}
            className="flex-1 font-semibold text-xs shadow-xs"
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
