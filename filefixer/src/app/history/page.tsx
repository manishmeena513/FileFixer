"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Trash2,
  TrendingDown,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { getAllHistory, clearAllHistory, deleteHistoryRecord, HistoryRecord } from "@/lib/storage/history";
import { formatBytes } from "@/lib/file-utils";

export default function HistoryPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const list = await getAllHistory();
      setRecords(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
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
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" />
            Clear Local Data
          </Button>
        )}
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">
            Files Processed Locally
          </span>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
            {records.length}
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">
            Total Bandwidth Saved
          </span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatBytes(totalSavedBytes)}
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">
            Privacy Status
          </span>
          <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Zero Cloud Persistence
          </p>
        </div>
      </div>

      {/* Records list */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-[hsl(var(--muted-foreground))]">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading IndexedDB history...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <HardDrive className="h-8 w-8 text-[hsl(var(--muted-foreground))] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">No processing history yet</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Files you optimize or convert in FileFixer will log statistics locally here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 text-xs gap-4 transition-colors hover:bg-[hsl(var(--secondary)/0.3)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[hsl(var(--foreground))] truncate max-w-sm">
                      {r.filename}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {r.tool}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                    {new Date(r.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[hsl(var(--muted-foreground))]">{formatBytes(r.originalSize)}</span>
                    <span>→</span>
                    <span className="font-bold text-emerald-400">{formatBytes(r.outputSize)}</span>
                    {r.savingsPct > 0 && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        -{r.savingsPct}%
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteOne(r.id)}
                  className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
