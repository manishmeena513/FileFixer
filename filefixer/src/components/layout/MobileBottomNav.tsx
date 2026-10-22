"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, FolderKanban, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/stores/fileStore";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { files, setCommandCenterOpen } = useFileStore();

  const fileCount = files.length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.96)] backdrop-blur-md pb-safe lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
        {/* Home */}
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer touch-manipulation",
            pathname === "/"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {pathname === "/" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <Home className="h-5 w-5" />
          <span className="text-[10px] leading-none">Home</span>
        </Link>

        {/* Workspace */}
        <Link
          href="/workspace"
          aria-current={pathname === "/workspace" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer touch-manipulation",
            pathname === "/workspace"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
          aria-label={`Workspace (${fileCount} files)`}
        >
          {pathname === "/workspace" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <div className="relative">
            <FolderKanban className="h-5 w-5" />
            {fileCount > 0 && (
              <span
                className={cn(
                  "absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold shadow-xs tabular-nums",
                  doneCount > 0
                    ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                    : "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                )}
              >
                {fileCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none">Workspace</span>
        </Link>

        {/* Command Center Modal Button */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer touch-manipulation"
          aria-label="Open Universal Command Center"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold leading-none">Search</span>
        </button>

        {/* All Tools */}
        <Link
          href="/tools"
          aria-current={pathname === "/tools" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer touch-manipulation",
            pathname === "/tools"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {pathname === "/tools" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] leading-none">Tools</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          aria-current={pathname === "/history" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer touch-manipulation",
            pathname === "/history"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {pathname === "/history" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <Clock className="h-5 w-5" />
          <span className="text-[10px] leading-none">History</span>
        </Link>
      </div>
    </nav>
  );
}
