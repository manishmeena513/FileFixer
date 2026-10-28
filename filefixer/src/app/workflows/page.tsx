"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Workflow,
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  Play,
  Sparkles,
  Layers,
  Loader2,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DropZone } from "@/components/upload/DropZone";
import { ToolPageShell } from "@/components/ui/ToolPageShell";
import { useFileStore } from "@/stores/fileStore";
import { useToast } from "@/components/ui/toaster";
import { resizeImage } from "@/lib/image/resize";
import { convertImage } from "@/lib/image/convert";
import { compressImage } from "@/lib/image/compress";
import { stripImageMetadata } from "@/lib/image/metadata";
import { compressPDF } from "@/lib/pdf/compress";
import { downloadAsZip } from "@/lib/zip";
import { formatBytes } from "@/lib/file-utils";
import { addHistoryRecord } from "@/lib/storage/history";
import { WorkflowStep } from "@/types";

let stepIdCounter = 0;
function generateStepId() {
  return `step-${Date.now()}-${++stepIdCounter}`;
}

function generateDelivId() {
  return `deliv-${Date.now()}`;
}

function getTimestamp() {
  return Date.now();
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  badge?: string;
  steps: WorkflowStep[];
}

const PRECONFIGURED_RECIPES: Recipe[] = [
  {
    id: "web-ready",
    name: "Web Ready Image",
    description: "Resize to 1920px → Convert WebP → Compress 82% → Strip Privacy Metadata",
    badge: "Popular",
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
    id: "social-media",
    name: "Social Media Pack",
    description: "Resize 1080px Square → Convert JPG → Compress 85% → Strip GPS Location",
    badge: "Social",
    steps: [
      {
        id: "step-1",
        type: "resize",
        label: "Resize to 1080×1080 Square",
        description: "Ideal standard dimensions for feed posts",
        config: { targetWidth: 1080, targetHeight: 1080 },
      },
      {
        id: "step-2",
        type: "convert",
        label: "Convert to JPG",
        description: "Universal compatibility with Instagram, X, LinkedIn",
        config: { targetFormat: "image/jpeg" },
      },
      {
        id: "step-3",
        type: "compress",
        label: "Compress (85% Quality)",
        description: "Crisp detail with reduced file weight",
        config: { qualityPct: 85 },
      },
      {
        id: "step-4",
        type: "strip_metadata",
        label: "Strip GPS Location",
        description: "Ensure geographical privacy before posting",
        config: { stripGps: true },
      },
    ],
  },
  {
    id: "document-sanitize",
    name: "Document Sanitize & Compress",
    description: "Strip PDF/Image Metadata → Balanced Compression Pass",
    badge: "Privacy",
    steps: [
      {
        id: "step-1",
        type: "strip_metadata",
        label: "Strip Document & EXIF Metadata",
        description: "Scrub author, producer, title, and GPS coordinates",
        config: { stripExif: true },
      },
      {
        id: "step-2",
        type: "compress",
        label: "Balanced Compression Pass",
        description: "Reduce payload size while keeping full readability",
        config: { qualityPct: 75 },
      },
    ],
  },
  {
    id: "email-safe",
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
        description: "Lightweight file weight for instant email delivery",
        config: { qualityPct: 70 },
      },
      {
        id: "step-3",
        type: "convert",
        label: "Convert to JPG",
        description: "Universal rendering in Outlook, Apple Mail, and Gmail",
        config: { targetFormat: "image/jpeg" },
      },
    ],
  },
  {
    id: "fast-upload-rename",
    name: "Fast Upload & Rename",
    description: "Resize 1024px → Convert WebP → Rename sequence (asset_###)",
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

export default function WorkflowsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files: storeFiles,
    addFiles: addStoreFiles,
    pushDownload,
    setLatestDeliveredFile,
    triggerSupportPrompt,
  } = useFileStore();

  const [files, setFiles] = useState<File[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>(PRECONFIGURED_RECIPES[0].steps);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("web-ready");

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentFileIdx, setCurrentFileIdx] = useState(-1);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [completedResults, setCompletedResults] = useState<
    { name: string; blob: Blob; size: number }[]
  >([]);

  // Sync initial files from store
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiles((prev) => {
        if (prev.length === 0 && storeFiles.length > 0) {
          return storeFiles.map((sf) => sf.file);
        }
        return prev;
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [storeFiles]);

  const handleFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    addStoreFiles(newFiles);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const loadRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setSteps(JSON.parse(JSON.stringify(recipe.steps)));
    setCompletedResults([]);
    toast({
      title: `Recipe loaded: ${recipe.name}`,
      description: recipe.description,
      variant: "success",
    });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const nextSteps = [...steps];
    const temp = nextSteps[index];
    nextSteps[index] = nextSteps[targetIdx];
    nextSteps[targetIdx] = temp;
    setSteps(nextSteps);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addStep = (type: WorkflowStep["type"]) => {
    const newId = generateStepId();
    let newStep: WorkflowStep;

    switch (type) {
      case "resize":
        newStep = {
          id: newId,
          type: "resize",
          label: "Resize Dimensions",
          description: "Scale resolution down to custom max dimensions",
          config: { targetWidth: 1280, targetHeight: 720 },
        };
        break;
      case "convert":
        newStep = {
          id: newId,
          type: "convert",
          label: "Convert Format",
          description: "Encode into a modern web format",
          config: { targetFormat: "image/webp" },
        };
        break;
      case "compress":
        newStep = {
          id: newId,
          type: "compress",
          label: "Compress Quality",
          description: "Reduce payload size preserving sharpness",
          config: { qualityPct: 80 },
        };
        break;
      case "strip_metadata":
        newStep = {
          id: newId,
          type: "strip_metadata",
          label: "Strip Privacy Metadata",
          description: "Remove EXIF, GPS and personal author tags",
          config: { stripExif: true },
        };
        break;
      case "rename":
        newStep = {
          id: newId,
          type: "rename",
          label: "Sequential Rename",
          description: "Apply zero-padded numbering pattern",
          config: { renamePattern: "processed_###" },
        };
        break;
    }

    setSteps((prev) => [...prev, newStep]);
  };

  const runWorkflow = async () => {
    if (files.length === 0 || steps.length === 0) return;
    setIsExecuting(true);
    setCompletedResults([]);

    const outputs: { name: string; blob: Blob; size: number }[] = [];
    const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      setCurrentFileIdx(fIdx);
      const originalFile = files[fIdx];
      let curBlob: Blob = originalFile;
      let curName = originalFile.name;
      let curFile: File = originalFile;

      const isPdf =
        originalFile.type === "application/pdf" ||
        originalFile.name.toLowerCase().endsWith(".pdf");

      for (let sIdx = 0; sIdx < steps.length; sIdx++) {
        setCurrentStepIdx(sIdx);
        const step = steps[sIdx];

        try {
          if (step.type === "resize") {
            if (!isPdf && step.config.targetWidth && step.config.targetHeight) {
              const res = await resizeImage(curFile, {
                width: step.config.targetWidth,
                height: step.config.targetHeight,
                maintainAspectRatio: true,
                fitMode: "cover",
              });
              curBlob = res.blob;
              curFile = new File([curBlob], curName, { type: curBlob.type });
            }
          } else if (step.type === "convert") {
            if (!isPdf && step.config.targetFormat) {
              const res = await convertImage(curFile, {
                targetFormat: step.config.targetFormat,
                quality: (step.config.qualityPct || 85) / 100,
              });
              curBlob = res.blob;
              curName = res.outputFilename;
              curFile = new File([curBlob], curName, { type: step.config.targetFormat });
            }
          } else if (step.type === "compress") {
            if (isPdf) {
              const res = await compressPDF(curFile, {
                level: "balanced",
                removeMetadata: false,
              });
              curBlob = res.blob;
              curFile = new File([curBlob], curName, { type: "application/pdf" });
            } else {
              const res = await compressImage(curFile, {
                mode: "quality",
                quality: (step.config.qualityPct || 80) / 100,
              });
              curBlob = res.blob;
              curFile = new File([curBlob], curName, { type: curBlob.type });
            }
          } else if (step.type === "strip_metadata") {
            if (isPdf) {
              const res = await compressPDF(curFile, {
                level: "balanced",
                removeMetadata: true,
              });
              curBlob = res.blob;
              curFile = new File([curBlob], curName, { type: "application/pdf" });
            } else {
              const res = await stripImageMetadata(curFile);
              curBlob = res.blob;
              curFile = new File([curBlob], curName, { type: curBlob.type });
            }
          } else if (step.type === "rename" && step.config.renamePattern) {
            const ext = curName.split(".").pop() || (isPdf ? "pdf" : "jpg");
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

    if (outputs.length > 0) {
      const totalOutputSize = outputs.reduce((acc, o) => acc + o.size, 0);

      // Push ready downloads
      outputs.forEach((o) => {
        pushDownload({
          fileName: o.name,
          originalSize: o.size,
          outputSize: o.size,
          savingsPct: 0,
          status: "ready",
          blob: o.blob,
        });
      });

      // Record telemetry in history
      await addHistoryRecord({
        filename: `Workflow Pipeline (${outputs.length} files)`,
        tool: "Workflows",
        originalSize: totalInputSize,
        outputSize: totalOutputSize,
      });

      // Set delivered notification
      setLatestDeliveredFile({
        id: generateDelivId(),
        fileName: "filefixer-workflow-output.zip",
        originalSize: totalInputSize,
        outputSize: totalOutputSize,
        status: "downloaded",
        timestamp: getTimestamp(),
      });

      triggerSupportPrompt();

      toast({
        title: "Workflow completed",
        description: `Successfully processed ${outputs.length} file(s) across ${steps.length} pipeline step(s).`,
        variant: "success",
      });
    }
  };

  const handleDownloadZip = async () => {
    if (completedResults.length === 0) return;
    await downloadAsZip(
      completedResults.map((o) => ({ filename: o.name, blob: o.blob })),
      "filefixer-workflow-output.zip"
    );
    triggerSupportPrompt();
  };

  const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalOutputSize = completedResults.reduce((acc, o) => acc + o.size, 0);
  const totalSaved = Math.max(0, totalInputSize - totalOutputSize);
  const savedPct = totalInputSize > 0 && completedResults.length > 0 ? (totalSaved / totalInputSize) * 100 : 0;

  return (
    <ToolPageShell
      icon={Workflow}
      title="Automated File Workflows"
      description="Build multi-stage client-side pipelines. Combine resize, conversion, compression, and privacy scrubbing in a single automated pass."
      backHref="/tools"
      backLabel="All Tools"
      formats={["JPG", "PNG", "WEBP", "PDF"]}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Preconfigured Recipes & File Drop Zone */}
        <div className="space-y-6 lg:col-span-1">
          {/* Recipes Card */}
          <div className="glass-panel-elevated rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                Automation Recipes
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {PRECONFIGURED_RECIPES.length} Presets
              </Badge>
            </div>

            <div className="space-y-2">
              {PRECONFIGURED_RECIPES.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => loadRecipe(recipe)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors min-h-[44px] touch-manipulation ${
                    selectedRecipeId === recipe.id
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] shadow-sm"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--secondary))]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                      {recipe.name}
                    </span>
                    {recipe.badge && (
                      <span className="rounded bg-[hsl(var(--primary)/0.15)] px-1.5 py-0.5 text-[9px] font-bold text-[hsl(var(--primary))]">
                        {recipe.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                    {recipe.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Files Input Card */}
          <div className="glass-panel-elevated rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[hsl(var(--primary))]" />
                Source Files
              </span>
              <span className="text-xs font-mono tabular-nums text-[hsl(var(--muted-foreground))]">
                {files.length} loaded
              </span>
            </div>

            {files.length === 0 ? (
              <DropZone
                onFiles={handleFiles}
                label="Drop files to process"
                sublabel="Images or PDF documents"
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-[hsl(var(--border))]">
                  {files.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center justify-between pt-1.5 text-xs">
                      <span className="truncate max-w-[180px] font-mono text-[hsl(var(--foreground))]" title={f.name}>
                        {f.name}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums font-mono">
                        {formatBytes(f.size)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[44px] touch-manipulation text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Files
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiles([]);
                      setCompletedResults([]);
                    }}
                    className="min-h-[44px] touch-manipulation text-xs text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Pipeline Step Builder & Execution */}
        <div className="space-y-6 lg:col-span-2">
          {/* Steps List */}
          <div className="glass-panel-elevated rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[hsl(var(--primary)/0.06)] rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-4">
              <div>
                <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
                  Pipeline Steps
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Steps execute sequentially from top to bottom on each file
                </p>
              </div>

              {/* Add Step Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { type: "resize", label: "Resize" },
                    { type: "convert", label: "Convert" },
                    { type: "compress", label: "Compress" },
                    { type: "strip_metadata", label: "Strip EXIF" },
                    { type: "rename", label: "Rename" },
                  ] as const
                ).map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addStep(action.type)}
                    className="min-h-[44px] touch-manipulation text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Step Cards */}
            {steps.length === 0 ? (
              <div className="py-12 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No steps in this pipeline. Add a step above or select a pre-configured recipe.
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="glass-panel rounded-xl p-4 space-y-3 transition-colors hover:border-[hsl(var(--primary)/0.3)] shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)] text-xs font-bold text-[hsl(var(--primary))] font-mono tabular-nums">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[hsl(var(--foreground))]">
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Reordering / Removal Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveStep(idx, "up")}
                          disabled={idx === 0}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] disabled:opacity-30 touch-manipulation"
                          aria-label="Move step up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(idx, "down")}
                          disabled={idx === steps.length - 1}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] disabled:opacity-30 touch-manipulation"
                          aria-label="Move step down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] touch-manipulation"
                          aria-label="Remove step"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Configuration Controls */}
                    {step.type === "resize" && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[hsl(var(--border)/0.5)]">
                        <div>
                          <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Max Width (px)</label>
                          <input
                            type="number"
                            value={step.config.targetWidth || 1920}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1920;
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, config: { ...s.config, targetWidth: val } } : s
                                )
                              );
                            }}
                            className="w-full rounded-md glass-input px-2.5 py-1.5 text-xs font-mono min-h-[44px] touch-manipulation tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[hsl(var(--muted-foreground))]">Max Height (px)</label>
                          <input
                            type="number"
                            value={step.config.targetHeight || 1080}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1080;
                              setSteps((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, config: { ...s.config, targetHeight: val } } : s
                                )
                              );
                            }}
                            className="w-full rounded-md glass-input px-2.5 py-1.5 text-xs font-mono min-h-[44px] touch-manipulation tabular-nums"
                          />
                        </div>
                      </div>
                    )}

                    {step.type === "compress" && (
                      <div className="pt-2 border-t border-[hsl(var(--border)/0.5)] space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[hsl(var(--muted-foreground))]">Target Quality</span>
                          <span className="font-bold text-[hsl(var(--primary))] tabular-nums">
                            {step.config.qualityPct || 80}%
                          </span>
                        </div>
                        <Slider
                          min={10}
                          max={100}
                          step={5}
                          value={[step.config.qualityPct || 80]}
                          onValueChange={([val]) => {
                            setSteps((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, config: { ...s.config, qualityPct: val } } : s
                              )
                            );
                          }}
                          className="py-1"
                        />
                      </div>
                    )}

                    {step.type === "convert" && (
                      <div className="pt-2 border-t border-[hsl(var(--border)/0.5)]">
                        <label className="text-[10px] text-[hsl(var(--muted-foreground))] block mb-1">
                          Output Target Format
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["image/webp", "image/jpeg", "image/png"] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => {
                                setSteps((prev) =>
                                  prev.map((s, i) =>
                                    i === idx ? { ...s, config: { ...s.config, targetFormat: fmt } } : s
                                  )
                                );
                              }}
                              className={`rounded-md py-1.5 text-xs font-mono uppercase min-h-[44px] touch-manipulation border transition-colors ${
                                step.config.targetFormat === fmt
                                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-bold"
                                  : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                              }`}
                            >
                              {fmt.replace("image/", "")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.type === "rename" && (
                      <div className="pt-2 border-t border-[hsl(var(--border)/0.5)] space-y-1">
                        <label className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          Rename Pattern (use ### for zero-padded count)
                        </label>
                        <input
                          type="text"
                          value={step.config.renamePattern || "asset_###"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSteps((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, config: { ...s.config, renamePattern: val } } : s
                              )
                            );
                          }}
                          className="w-full rounded-md glass-input px-2.5 py-1.5 text-xs font-mono min-h-[44px] touch-manipulation"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execution Progress Bar */}
          {isExecuting && (
            <div className="rounded-2xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] backdrop-blur-md p-4 space-y-2 text-center animate-fade-in shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing File{" "}
                <span className="tabular-nums font-mono">
                  {currentFileIdx + 1}
                </span>{" "}
                of{" "}
                <span className="tabular-nums font-mono">
                  {files.length}
                </span>
                ...
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Running step: {steps[currentStepIdx]?.label || "Processing"}
              </p>
            </div>
          )}

          {/* Completed Delivery Summary Card */}
          {completedResults.length > 0 && !isExecuting && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 backdrop-blur-md p-5 space-y-4 animate-scale-in shadow-[0_0_24px_rgba(16,185,129,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                    Pipeline Complete • <span className="tabular-nums font-mono">{completedResults.length}</span> Files Delivered
                  </span>
                </div>
                <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  Saved {formatBytes(totalSaved)} ({savedPct.toFixed(0)}%)
                </Badge>
              </div>

              <Button
                onClick={handleDownloadZip}
                className="w-full min-h-[48px] touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-white font-semibold"
              >
                <Archive className="h-4 w-4 mr-2" />
                Download Output ZIP ({completedResults.length})
              </Button>
            </div>
          )}

          {/* Primary Run Trigger */}
          <Button
            onClick={runWorkflow}
            disabled={files.length === 0 || steps.length === 0 || isExecuting}
            className="w-full min-h-[50px] touch-manipulation font-bold text-sm bg-[hsl(var(--primary))] hover:bg-blue-600 text-white"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Running Automated Pipeline...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Workflow on <span className="tabular-nums font-mono mx-1">{files.length}</span>{" "}
                {files.length === 1 ? "File" : "Files"}
              </>
            )}
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
}
