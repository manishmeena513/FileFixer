"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Download,
  Archive,
  Eye,
  FileText,
  Sliders,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toaster";
import { formatBytes, getExtension, stripExtension, triggerDownload } from "@/lib/file-utils";
import { downloadAsZip } from "@/lib/zip";

interface RenameItem {
  id: string;
  file: File;
}

export default function BatchRenamePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<RenameItem[]>([]);

  // Template options
  const [template, setTemplate] = useState("Project_###");
  const [startingNumber, setStartingNumber] = useState(1);
  const [lowercase, setLowercase] = useState(false);
  const [replaceSpaces, setReplaceSpaces] = useState(false);
  const [spaceReplacement, setSpaceReplacement] = useState("_");
  const [includeDate, setIncludeDate] = useState(false);

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    const newItems = files.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  // Preview generated names
  const previewList = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    return items.map((it, idx) => {
      const origName = it.file.name;
      const ext = getExtension(origName);
      const base = stripExtension(origName);

      const num = startingNumber + idx;

      // Count hash marks in template
      const hashMatch = template.match(/#+/);
      const padding = hashMatch ? hashMatch[0].length : 3;
      const paddedNum = String(num).padStart(padding, "0");

      let newBase = template.replace(/#+/, paddedNum);
      if (includeDate) {
        newBase = `${todayStr}_${newBase}`;
      }

      if (replaceSpaces) {
        newBase = newBase.replace(/\s+/g, spaceReplacement);
      }

      let finalName = ext ? `${newBase}.${ext}` : newBase;

      if (lowercase) {
        finalName = finalName.toLowerCase();
      }

      return {
        id: it.id,
        origName,
        finalName,
        file: it.file,
      };
    });
  }, [items, template, startingNumber, lowercase, replaceSpaces, spaceReplacement, includeDate]);

  const handleDownloadZip = async () => {
    if (previewList.length === 0) return;

    const entries = previewList.map((item) => ({
      filename: item.finalName,
      blob: item.file,
    }));

    await downloadAsZip(entries, "renamed_files.zip");
    toast({
      title: "Batch rename complete",
      description: `Downloaded ZIP with ${entries.length} renamed files.`,
      variant: "success",
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[hsl(var(--foreground))]">
              Batch Rename Files
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Standardize messy filenames like IMG_2938.jpg into structured sequences with live previews.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Files & Live Preview */}
        <div className="space-y-6 lg:col-span-2">
          {items.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              label="Drop any files here to batch rename"
              sublabel="Photos, documents, or assets of any file extension"
              className="py-16"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[hsl(var(--primary))]" /> Live Rename Preview ({items.length} files)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.multiple = true;
                      input.onchange = (e: any) => handleFiles(Array.from(e.target.files || []));
                      input.click();
                    }}
                  >
                    Add More
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setItems([])}>
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Preview table */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                <div className="max-h-[460px] overflow-y-auto divide-y divide-[hsl(var(--border))]">
                  {previewList.map((it, idx) => (
                    <div key={it.id} className="flex items-center justify-between p-3 gap-4 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[hsl(var(--muted-foreground))]">
                          {it.origName}
                        </p>
                      </div>
                      <span className="text-[hsl(var(--muted-foreground))] font-mono">→</span>
                      <div className="min-w-0 flex-1 text-right">
                        <p className="truncate font-semibold text-[hsl(var(--primary))] font-mono">
                          {it.finalName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Template & Config */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Naming Rules
            </h2>

            {/* Template input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Rename Pattern
              </label>
              <input
                type="text"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="e.g. Asset_### or Photo_#"
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Use <code className="text-[hsl(var(--primary))]">###</code> for 001, 002 padding; <code className="text-[hsl(var(--primary))]">##</code> for 01.
              </p>
            </div>

            {/* Starting number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Starting Number
              </label>
              <input
                type="number"
                min={0}
                value={startingNumber}
                onChange={(e) => setStartingNumber(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--foreground))]">All Lowercase</span>
                <Switch checked={lowercase} onCheckedChange={setLowercase} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--foreground))]">Prepend Today&apos;s Date</span>
                <Switch checked={includeDate} onCheckedChange={setIncludeDate} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--foreground))]">Replace Spaces</span>
                <Switch checked={replaceSpaces} onCheckedChange={setReplaceSpaces} />
              </div>
            </div>

            <Button
              size="lg"
              disabled={items.length === 0}
              onClick={handleDownloadZip}
              className="w-full bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"
            >
              <Archive className="h-4 w-4 mr-2" />
              Download All Renamed (ZIP)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
