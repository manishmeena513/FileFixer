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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] backdrop-blur-md pb-safe lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </Link>

        {/* Workspace */}
        <Link
          href="/workspace"
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/workspace"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
          aria-label={`Workspace (${fileCount} files)`}
        >
          <div className="relative">
            <FolderKanban className="h-5 w-5" />
            {fileCount > 0 && (
              <span
                className={cn(
                  "absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-xs",
                  doneCount > 0 ? "bg-emerald-500" : "bg-[hsl(var(--primary))]"
                )}
              >
                {fileCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium leading-none">Workspace</span>
        </Link>

        {/* Command Center Modal Button */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] transition-colors"
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
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/tools"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Tools</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/history"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">History</span>
        </Link>
      </div>
    </nav>
  );
}
