"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Trash2,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/toaster";
import {
  getAllHistory,
  clearAllHistory,
  deleteHistoryRecord,
  HistoryRecord,
} from "@/lib/storage/history";
import { formatBytes } from "@/lib/file-utils";

const TOOL_HREFS: Record<string, string> = {
  "Batch": "/batch",
  "Batch Image": "/batch",
  "Batch Rename": "/batch-rename",
  "Workflows": "/workflows",
  "Workflow Pipeline": "/workflows",
  "Privacy Cleaner": "/privacy-cleaner",
  "Compress Image": "/compress-image",
  "Smart Compress": "/smart-compress",
  "Resize Image": "/resize-image",
  "Convert Image": "/convert-image",
  "Crop Image": "/crop-image",
  "Image Metadata": "/image-metadata",
  "Image Studio": "/image-studio",
  "PDF Merge": "/pdf-merge",
  "PDF Split": "/pdf-split",
  "PDF Compress": "/pdf-compress",
  "PDF Workspace": "/pdf-workspace",
  "Images to PDF": "/images-to-pdf",
  "PDF Studio": "/pdf-studio",
  "File Inspector": "/inspect",
};

function getToolHref(toolName: string): string {
  if (TOOL_HREFS[toolName]) return TOOL_HREFS[toolName];
  const lower = toolName.toLowerCase();
  for (const [k, v] of Object.entries(TOOL_HREFS)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
      return v;
    }
  }
  return "/tools";
}

export default function HistoryPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAllHistory()
      .then((list) => {
        if (mounted) {
          setRecords(list);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleClearAll = async () => {
    await clearAllHistory();
    setRecords([]);
    toast({
      title: "History Cleared",
      description: "All local processing records have been removed from your browser.",
      variant: "success",
    });
  };

  const handleDeleteOne = async (id: string) => {
    await deleteHistoryRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const totalSavedBytes = records.reduce(
    (acc, r) => acc + Math.max(0, r.originalSize - r.outputSize),
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Local Processing History
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Session logs stored locally in your browser&apos;s IndexedDB. Source files are never retained.
            </p>
          </div>
        </div>

        {records.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            className="flex items-center gap-2 self-start sm:self-auto min-h-[44px] touch-manipulation"
          >
            <Trash2 className="h-4 w-4" />
            Clear Local Data
          </Button>
        )}
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold tracking-wider">
            Files Processed Locally
          </span>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1 tabular-nums font-mono">
            {records.length}
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold tracking-wider">
            Total Bandwidth Saved
          </span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums font-mono">
            {formatBytes(totalSavedBytes)}
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold tracking-wider">
            Privacy Status
          </span>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Zero Cloud Persistence
          </p>
        </div>
      </div>

      {/* Records list */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-[hsl(var(--muted-foreground))]">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading IndexedDB history...
          </div>
        ) : records.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={HardDrive}
              title="No processing history yet"
              description="Files you optimize, convert, or inspect in FileFixer will log bandwidth and compression statistics locally in your browser."
            />
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 text-xs gap-3 transition-colors hover:bg-[hsl(var(--secondary)/0.5)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[hsl(var(--foreground))] truncate max-w-sm" title={r.filename}>
                      {r.filename}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {r.tool}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 tabular-nums font-mono">
                    {new Date(r.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <div className="flex items-center justify-end gap-2 tabular-nums font-mono">
                    <span className="text-[hsl(var(--muted-foreground))]">{formatBytes(r.originalSize)}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">→</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatBytes(r.outputSize)}</span>
                    {r.savingsPct > 0 && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums font-mono">
                        -{r.savingsPct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Replay / Reopen Tool + Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={getToolHref(r.tool)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors min-h-[44px] touch-manipulation"
                    title={`Reopen in ${r.tool}`}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    <span>Reopen</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteOne(r.id)}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-colors touch-manipulation"
                    title="Delete record"
                    aria-label={`Delete record for ${r.filename}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
