"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, FolderKanban, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/stores/fileStore";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { files, isWorkspaceOpen, toggleWorkspace, setWorkspaceOpen } =
    useFileStore();

  const fileCount = files.length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] backdrop-blur-md pb-safe md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center px-2">
        {/* Home */}
        <Link
          href="/"
          onClick={() => setWorkspaceOpen(false)}
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/" && !isWorkspaceOpen
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[11px] font-medium leading-none">Home</span>
        </Link>

        {/* All Tools */}
        <Link
          href="/tools"
          onClick={() => setWorkspaceOpen(false)}
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/tools" && !isWorkspaceOpen
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[11px] font-medium leading-none">Tools</span>
        </Link>

        {/* Workspace Drawer Trigger */}
        <button
          type="button"
          onClick={toggleWorkspace}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            isWorkspaceOpen
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
                  "absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs",
                  doneCount > 0 ? "bg-emerald-500" : "bg-[hsl(var(--primary))]"
                )}
              >
                {fileCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">Workspace</span>
        </button>

        {/* History */}
        <Link
          href="/history"
          onClick={() => setWorkspaceOpen(false)}
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/history" && !isWorkspaceOpen
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[11px] font-medium leading-none">History</span>
        </Link>
      </div>
    </nav>
  );
}
