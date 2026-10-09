"use client";

import React, { useEffect } from "react";
import { X, Keyboard, Sparkles } from "lucide-react";
import { useFileStore } from "@/stores/fileStore";

const SHORTCUTS = [
  { key: "Ctrl + K / ⌘ + K", description: "Open Universal Command Center" },
  { key: "Ctrl + O / ⌘ + O", description: "Add files to Session Workspace" },
  { key: "Ctrl + Z / ⌘ + Z", description: "Undo last file operation" },
  { key: "Ctrl + Shift + Z", description: "Redo undone file operation" },
  { key: "Ctrl + Enter / ⌘ + ↵", description: "Run current tool or workflow" },
  { key: "Delete / Backspace", description: "Remove selected item from Workspace" },
  { key: "Esc", description: "Close open modal or drawer" },
  { key: "?", description: "Open this Keyboard Shortcuts cheat sheet" },
];

export function KeyboardShortcutsModal() {
  const { isShortcutsOpen, setShortcutsOpen } = useFileStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(!isShortcutsOpen);
      } else if (e.key === "Escape" && isShortcutsOpen) {
        setShortcutsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsOpen, setShortcutsOpen]);

  if (!isShortcutsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in"
      onClick={() => setShortcutsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Keyboard Shortcuts</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Accelerate your FileFixer 3.0 workspace flow
              </p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
            aria-label="Close shortcuts modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="divide-y divide-[hsl(var(--border)/0.5)] p-2">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-3 py-2.5 text-xs"
            >
              <span className="text-[hsl(var(--muted-foreground))] font-medium">
                {item.description}
              </span>
              <kbd className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-1 font-mono text-[11px] font-semibold text-[hsl(var(--foreground))] shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] px-5 py-3 text-center">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Press <kbd className="font-mono bg-[hsl(var(--secondary))] px-1 py-0.5 rounded">Esc</kbd> or click anywhere outside to close.
          </p>
        </div>
      </div>
    </div>
  );
}
