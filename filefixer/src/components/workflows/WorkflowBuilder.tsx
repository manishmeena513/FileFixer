"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Workflow,
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Minimize2,
  Maximize2,
  RefreshCw,
  Shield,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useFileStore } from "@/stores/fileStore";
import { WorkflowStep } from "@/types";
import { resizeImage } from "@/lib/image/resize";
import { convertImage } from "@/lib/image/convert";
import { compressImage } from "@/lib/image/compress";
import { stripImageMetadata } from "@/lib/image/metadata";
import { downloadAsZip } from "@/lib/zip";
import { formatBytes, getExtensionFromMime } from "@/lib/file-utils";

const STARTER_PRESETS: { name: string; description: string; steps: WorkflowStep[] }[] = [
  {
    name: "Website Images",
    description: "Resize to 1920px → Convert WebP → Compress 82% → Strip EXIF",
    steps: [
      {
        id: "step-1",
        type: "resize",
        label: "Resize to Max 1920px",
        description: "Scale resolution down to optimal standard desktop dimensions",
        config: { targetWidth: 1920, targetHeight: 1080 },
      },
      {
        id: "step-2",
        type: "convert",
        label: "Convert to WebP",
        description: "Switch to high-performance modern web format",
        config: { targetFormat: "image/webp" },
      },
      {
        id: "step-3",
        type: "compress",
        label: "Compress (82% Quality)",
        description: "Balanced compression preserving visual sharpness",
        config: { qualityPct: 82 },
      },
      {
        id: "step-4",
        type: "strip_metadata",
        label: "Strip Privacy Metadata",
        description: "Eliminate camera and GPS tags before publishing",
        config: { stripExif: true },
      },
    ],
  },
  {
    name: "Email Safe Images",
    description: "Resize to 1280px → Compress 70% → Standard JPG",
    steps: [
      {
        id: "step-1",
        type: "resize",
        label: "Resize to 1280px",
        description: "Ensure image fits standard email viewport",
        config: { targetWidth: 1280, targetHeight: 720 },
      },
      {
        id: "step-2",
        type: "compress",
        label: "Compress (70% Quality)",
        description: "Lightweight file weight for fast sending",
        config: { qualityPct: 70 },
      },
      {
        id: "step-3",
        type: "convert",
        label: "Convert to JPG",
        description: "Universal compatibility with Outlook & Apple Mail",
        config: { targetFormat: "image/jpeg" },
      },
    ],
  },
  {
    name: "WhatsApp / Chat",
    description: "Compress 75% → Strip GPS Location Data",
    steps: [
      {
        id: "step-1",
        type: "compress",
        label: "Compress (75% Quality)",
        description: "Under 1 MB threshold for fast mobile sharing",
        config: { qualityPct: 75 },
      },
      {
        id: "step-2",
        type: "strip_metadata",
        label: "Strip GPS Location",
        description: "Prevent physical location leakage in group chats",
        config: { stripGps: true },
      },
    ],
  },
  {
    name: "Fast Upload & Rename",
    description: "Resize 1024px → WebP → Rename sequence (asset_###)",
    steps: [
      {
        id: "step-1",
        type: "resize",
        label: "Resize to 1024px",
        description: "Compact web thumbnail resolution",
        config: { targetWidth: 1024, targetHeight: 768 },
      },
      {
        id: "step-2",
        type: "convert",
        label: "Convert to WebP",
        description: "Modern web image format",
        config: { targetFormat: "image/webp" },
      },
      {
        id: "step-3",
        type: "rename",
        label: "Sequential Rename",
        description: "Standardize file naming pattern",
        config: { renamePattern: "asset_###" },
      },
    ],
  },
];

export function WorkflowBuilder() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files: storeFiles, addFiles, pushDownload, setLatestDeliveredFile } = useFileStore();

  const [steps, setSteps] = useState<WorkflowStep[]>(STARTER_PRESETS[0].steps);
  const [workflowFiles, setWorkflowFiles] = useState<File[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentFileIdx, setCurrentFileIdx] = useState<number>(-1);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [completedResults, setCompletedResults] = useState<{ name: string; blob: Blob; size: number }[]>([]);

  // Auto-populate from workspace
  useEffect(() => {
    if (workflowFiles.length === 0 && storeFiles.length > 0) {
      const imgs = storeFiles.filter((f) => f.type.startsWith("image/")).map((f) => f.file);
      if (imgs.length > 0) setWorkflowFiles(imgs);
    }
  }, [storeFiles, workflowFiles.length]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const added = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
      addFiles(added);
      setWorkflowFiles((prev) => [...prev, ...added]);
      e.target.value = "";
    }
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const copy = [...steps];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setSteps(copy);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomStep = (type: WorkflowStep["type"]) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      label:
        type === "resize"
          ? "Resize Dimensions"
          : type === "convert"
          ? "Convert Format"
          : type === "compress"
          ? "Compress Quality"
          : type === "strip_metadata"
          ? "Strip Metadata"
          : "Sequential Rename",
      description: "Custom pipeline operation",
      config:
        type === "resize"
          ? { targetWidth: 1920, targetHeight: 1080 }
          : type === "convert"
          ? { targetFormat: "image/webp" }
          : type === "compress"
          ? { qualityPct: 80 }
          : type === "rename"
          ? { renamePattern: "processed_###" }
          : { stripExif: true },
    };
    setSteps((prev) => [...prev, newStep]);
  };

  const runWorkflow = async () => {
    if (workflowFiles.length === 0 || steps.length === 0) return;
    setIsExecuting(true);
    setCompletedResults([]);

    const outputs: { name: string; blob: Blob; size: number }[] = [];

    for (let fIdx = 0; fIdx < workflowFiles.length; fIdx++) {
      setCurrentFileIdx(fIdx);
      let curFile = workflowFiles[fIdx];
      let curBlob: Blob = curFile;
      let curName = curFile.name;

      for (let sIdx = 0; sIdx < steps.length; sIdx++) {
        setCurrentStepIdx(sIdx);
        const step = steps[sIdx];

        try {
          if (step.type === "resize" && step.config.targetWidth && step.config.targetHeight) {
            const res = await resizeImage(curFile, {
              width: step.config.targetWidth,
              height: step.config.targetHeight,
              maintainAspectRatio: true,
            });
            curBlob = res.blob;
            curFile = new File([curBlob], curName, { type: curBlob.type });
          } else if (step.type === "convert" && step.config.targetFormat) {
            const res = await convertImage(curFile, {
              targetFormat: step.config.targetFormat,
              quality: (step.config.qualityPct || 85) / 100,
            });
            curBlob = res.blob;
            curName = res.outputFilename;
            curFile = new File([curBlob], curName, { type: step.config.targetFormat });
          } else if (step.type === "compress") {
            const res = await compressImage(curFile, {
              mode: "quality",
              quality: (step.config.qualityPct || 80) / 100,
            });
            curBlob = res.blob;
            curFile = new File([curBlob], curName, { type: curBlob.type });
          } else if (step.type === "strip_metadata") {
            const res = await stripImageMetadata(curFile);
            curBlob = res.blob;
            curFile = new File([curBlob], curName, { type: curBlob.type });
          } else if (step.type === "rename" && step.config.renamePattern) {
            const ext = curName.split(".").pop() || "jpg";
            const num = fIdx + 1;
            const hashMatch = step.config.renamePattern.match(/#+/);
            const padding = hashMatch ? hashMatch[0].length : 3;
            const paddedNum = String(num).padStart(padding, "0");
            curName = `${step.config.renamePattern.replace(/#+/, paddedNum)}.${ext}`;
          }
        } catch (err) {
          console.error(`Workflow step failed for ${curName}:`, err);
        }
      }

      outputs.push({ name: curName, blob: curBlob, size: curBlob.size });
    }

    setCompletedResults(outputs);
    setIsExecuting(false);
    setCurrentFileIdx(-1);
    setCurrentStepIdx(-1);

    // Automatically package ZIP
    if (outputs.length > 0) {
      await downloadAsZip(
        outputs.map((o) => ({ filename: o.name, blob: o.blob })),
        "filefixer-workflow-output.zip"
      );
    }
  };

  const totalInputSize = workflowFiles.reduce((acc, f) => acc + f.size, 0);
  const totalOutputSize = completedResults.reduce((acc, f) => acc + f.size, 0);
  const totalSaved = totalInputSize > totalOutputSize ? totalInputSize - totalOutputSize : 0;
  const savedPct = totalInputSize > 0 ? (totalSaved / totalInputSize) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
          <Workflow className="h-4 w-4" />
          <span>Visual Workflow Builder</span>
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-[hsl(var(--foreground))]">
          Automate Multi-Step File Pipelines
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Chain operations together in sequence. Resize, convert, compress, and strip metadata in one automated browser run.
        </p>
      </div>

      {/* Starter Presets Bar */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-4 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Starter Workflows
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {STARTER_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setSteps(p.steps)}
              className="p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left hover:border-[hsl(var(--primary))] transition-all group"
            >
              <p className="text-xs font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
                {p.name}
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Chain Stage */}
      <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
              Pipeline Steps ({steps.length})
            </h2>
            <Badge variant="outline" className="text-xs font-mono">
              Executes Top-to-Bottom
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSteps(STARTER_PRESETS[0].steps)}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isCurrent = isExecuting && currentStepIdx === idx;
            return (
              <div
                key={step.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] ring-2 ring-[hsl(var(--primary)/0.3)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] font-mono text-xs font-bold text-[hsl(var(--primary))]">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                      {step.label}
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Inline config adjustment */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {step.type === "compress" && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Quality:</span>
                      <span className="font-mono font-bold text-[hsl(var(--primary))]">
                        {step.config.qualityPct}%
                      </span>
                    </div>
                  )}

                  {/* Move Up / Down Buttons */}
                  <div className="flex items-center gap-1 border-l border-[hsl(var(--border))] pl-2">
                    <button
                      onClick={() => moveStep(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-[hsl(var(--border))] disabled:opacity-30 hover:bg-[hsl(var(--secondary))]"
                      aria-label="Move step up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveStep(idx, "down")}
                      disabled={idx === steps.length - 1}
                      className="p-1.5 rounded-lg border border-[hsl(var(--border))] disabled:opacity-30 hover:bg-[hsl(var(--secondary))]"
                      aria-label="Move step down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeStep(idx)}
                      className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))]"
                      aria-label="Remove step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Step Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mr-1">
            + Add Operation:
          </span>
          <button
            onClick={() => addCustomStep("resize")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            + Resize
          </button>
          <button
            onClick={() => addCustomStep("convert")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            + Convert WebP
          </button>
          <button
            onClick={() => addCustomStep("compress")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            + Compress
          </button>
          <button
            onClick={() => addCustomStep("strip_metadata")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            + Strip Metadata
          </button>
          <button
            onClick={() => addCustomStep("rename")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
          >
            + Sequential Rename
          </button>
        </div>
      </div>

      {/* Target Files & Execution Box */}
      <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleAddFiles}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
              Target Files ({workflowFiles.length})
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {workflowFiles.length > 0
                ? `${formatBytes(totalInputSize)} total input weight`
                : "Select images to run through this workflow"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Images
            </Button>
            {workflowFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWorkflowFiles([])}
                className="text-[hsl(var(--destructive))]"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Execution Summary / Progress */}
        {isExecuting && (
          <div className="rounded-2xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] p-4 space-y-2 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing File {currentFileIdx + 1} of {workflowFiles.length}...
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Running step: {steps[currentStepIdx]?.label || "Processing"}
            </p>
          </div>
        )}

        {/* Finished Delivery Card */}
        {completedResults.length > 0 && !isExecuting && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                  Pipeline Complete • {completedResults.length} Files Delivered
                </span>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-400 font-mono">
                Saved {formatBytes(totalSaved)} ({savedPct.toFixed(0)}%)
              </Badge>
            </div>

            <Button
              onClick={() =>
                downloadAsZip(
                  completedResults.map((o) => ({ filename: o.name, blob: o.blob })),
                  "filefixer-workflow-output.zip"
                )
              }
              className="w-full min-h-[46px]"
            >
              <Archive className="h-4 w-4 mr-2" /> Download Output ZIP
            </Button>
          </div>
        )}

        {/* Primary Run Button */}
        <Button
          onClick={runWorkflow}
          disabled={workflowFiles.length === 0 || steps.length === 0 || isExecuting}
          className="w-full min-h-[50px] font-bold text-sm"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running Pipeline...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Workflow on {workflowFiles.length} {workflowFiles.length === 1 ? "File" : "Files"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
