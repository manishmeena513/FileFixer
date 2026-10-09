"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  FileImage,
  FileText,
  File as FileIcon,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Crop,
  Shield,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  HardDrive,
  Cpu,
  Workflow,
  Sliders,
  Check,
} from "lucide-react";
import { useFileStore } from "@/stores/fileStore";
import { formatBytes } from "@/lib/utils";
import { computeOptimizationScore } from "@/lib/score";
import { compressImage } from "@/lib/image/compress";
import { resizeImage } from "@/lib/image/resize";
import { convertImage } from "@/lib/image/convert";
import { transformImage } from "@/lib/image/transform";
import { stripImageMetadata, readImageMetadata } from "@/lib/image/metadata";
import { smartCompress } from "@/lib/smartCompress";
import { compressPDF } from "@/lib/pdf/compress";
import { triggerDownload, SupportedImageFormat } from "@/lib/file-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { BeforeAfterStats, CompareSlider } from "@/components/results/BeforeAfter";

type WorkspaceTab = "optimize" | "transform" | "convert" | "privacy" | "deliver";

export function WorkspaceView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files,
    activeFileId,
    setActiveFileId,
    addFiles,
    removeFile,
    clearFiles,
    promoteOutputToInput,
    undo,
    redo,
    pushFileHistory,
    pushDownload,
    setLatestDeliveredFile,
    projects,
    activeProjectId,
    createProject,
    setActiveProjectId,
  } = useFileStore();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("optimize");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  // Operation parameters
  const [qualityPct, setQualityPct] = useState<number>(82);
  const [targetSizeMB, setTargetSizeMB] = useState<number>(1);
  const [useTargetSize, setUseTargetSize] = useState<boolean>(false);
  const [targetWidth, setTargetWidth] = useState<number>(1920);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>("image/webp");
  const [metadataExif, setMetadataExif] = useState<any>(null);
  const [metadataScanned, setMetadataScanned] = useState(false);

  // Active file reference
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Sync dimensions when active file changes
  useEffect(() => {
    if (activeFile && activeFile.width && activeFile.height) {
      setTargetWidth(activeFile.width);
      setTargetHeight(activeFile.height);
    }
  }, [activeFile?.id, activeFile?.width, activeFile?.height]);

  // Scan EXIF when privacy tab is selected
  useEffect(() => {
    if (activeTab === "privacy" && activeFile && activeFile.type.startsWith("image/")) {
      readImageMetadata(activeFile.file)
        .then((exif) => {
          setMetadataExif(exif);
          setMetadataScanned(true);
        })
        .catch(() => {
          setMetadataExif(null);
          setMetadataScanned(true);
        });
    }
  }, [activeTab, activeFile?.id]);

  // Filtered files by active project
  const displayedFiles = useMemo(() => {
    if (!activeProjectId) return files;
    return files.filter((f) => f.projectId === activeProjectId);
  }, [files, activeProjectId]);

  // Compute live optimization score
  const score = useMemo(() => {
    if (!activeFile) return null;
    return computeOptimizationScore({
      name: activeFile.name,
      size: activeFile.size,
      type: activeFile.type,
      width: activeFile.width,
      height: activeFile.height,
      outputSize: activeFile.outputSize,
      outputType: activeFile.outputBlob?.type,
      hasExif: Boolean(metadataExif),
      hasGps: Boolean(metadataExif?.latitude || metadataExif?.longitude),
      metadataCleaned: activeFile.name.includes("_clean"),
    });
  }, [activeFile, metadataExif]);

  // Undo / Redo capabilities
  const canUndo = activeFile && (activeFile.historyIndex ?? 0) > 0;
  const canRedo =
    activeFile &&
    activeFile.historyStack &&
    (activeFile.historyIndex ?? 0) < activeFile.historyStack.length - 1;

  // Local URL for previewing active file
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activeOutputUrl, setActiveOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFile) {
      setActivePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(activeFile.file);
    setActivePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activeFile?.file]);

  useEffect(() => {
    if (!activeFile?.outputBlob) {
      setActiveOutputUrl(null);
      return;
    }
    const url = URL.createObjectURL(activeFile.outputBlob);
    setActiveOutputUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [activeFile?.outputBlob]);

  // Add files handler
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files), activeProjectId || undefined);
      e.target.value = "";
    }
  };

  // Run Operations
  const handleRunOperation = async () => {
    if (!activeFile) return;
    setIsProcessing(true);

    try {
      const isImg = activeFile.type.startsWith("image/");
      const isPdf = activeFile.type === "application/pdf" || activeFile.name.toLowerCase().endsWith(".pdf");

      let resultBlob: Blob = activeFile.file;
      let outputName = activeFile.name;
      let actionLabel = "Processed";
      let nextW = activeFile.width;
      let nextH = activeFile.height;

      if (activeTab === "optimize") {
        if (useTargetSize) {
          actionLabel = `Smart Compress to ${targetSizeMB} MB`;
          const smartRes = await smartCompress(activeFile.file, targetSizeMB);
          resultBlob = smartRes.bestBlob;
        } else if (isImg) {
          actionLabel = `Compress (${qualityPct}%)`;
          const res = await compressImage(activeFile.file, {
            mode: "quality",
            quality: qualityPct / 100,
          });
          resultBlob = res.blob;
        } else if (isPdf) {
          actionLabel = "Compress PDF";
          const res = await compressPDF(activeFile.file);
          resultBlob = res.blob;
        }
      } else if (activeTab === "transform" && isImg) {
        actionLabel = `Resize to ${targetWidth}×${targetHeight}`;
        const res = await resizeImage(activeFile.file, {
          width: targetWidth,
          height: targetHeight,
          maintainAspectRatio: maintainAspect,
        });
        resultBlob = res.blob;
        nextW = res.width;
        nextH = res.height;
      } else if (activeTab === "convert" && isImg) {
        actionLabel = `Convert to ${targetFormat.replace("image/", "").toUpperCase()}`;
        const res = await convertImage(activeFile.file, {
          targetFormat,
          quality: qualityPct / 100,
        });
        resultBlob = res.blob;
        outputName = res.outputFilename;
      } else if (activeTab === "privacy" && isImg) {
        actionLabel = "Strip Privacy Metadata";
        const res = await stripImageMetadata(activeFile.file);
        resultBlob = res.blob;
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, "")}_clean.${activeFile.name.split(".").pop()}`;
      }

      // Update store with output and push to history
      const nextFile = new File([resultBlob], outputName, {
        type: resultBlob.type || activeFile.type,
      });

      pushFileHistory(
        activeFile.id,
        actionLabel,
        nextFile,
        resultBlob,
        outputName,
        nextW,
        nextH
      );

      useFileStore.getState().setOutput(
        activeFile.id,
        resultBlob,
        outputName,
        resultBlob.size,
        nextW,
        nextH
      );

      // Push to Download Queue
      const savingsPct =
        activeFile.size > resultBlob.size
          ? ((activeFile.size - resultBlob.size) / activeFile.size) * 100
          : 0;

      pushDownload({
        fileName: outputName,
        originalSize: activeFile.size,
        outputSize: resultBlob.size,
        savingsPct,
        status: "ready",
        blob: resultBlob,
      });

      setActiveTab("deliver");
    } catch (err: any) {
      console.error(err);
      alert(`Operation failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliverDownload = () => {
    if (!activeFile || !activeFile.outputBlob) return;
    const name = activeFile.outputName || activeFile.name;
    triggerDownload(activeFile.outputBlob, name);

    setLatestDeliveredFile({
      id: `deliv-${Date.now()}`,
      fileName: name,
      originalSize: activeFile.size,
      outputSize: activeFile.outputSize || activeFile.outputBlob.size,
      status: "downloaded",
      blob: activeFile.outputBlob,
      timestamp: Date.now(),
    });
  };

  const handleRotate = async (angle: 90 | 180 | 270) => {
    if (!activeFile || !activeFile.type.startsWith("image/")) return;
    setIsProcessing(true);
    try {
      const blob = await transformImage(activeFile.file, { rotation: angle });
      const nextFile = new File([blob], activeFile.name, { type: blob.type || activeFile.type });
      pushFileHistory(activeFile.id, `Rotate ${angle}°`, nextFile, blob, activeFile.name);
      useFileStore.getState().setOutput(activeFile.id, blob, activeFile.name, blob.size);
    } catch (err: any) {
      alert(`Rotation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlip = async (axis: "horizontal" | "vertical") => {
    if (!activeFile || !activeFile.type.startsWith("image/")) return;
    setIsProcessing(true);
    try {
      const blob = await transformImage(activeFile.file, {
        flipH: axis === "horizontal",
        flipV: axis === "vertical",
      });
      const nextFile = new File([blob], activeFile.name, { type: blob.type || activeFile.type });
      pushFileHistory(activeFile.id, `Flip ${axis}`, nextFile, blob, activeFile.name);
      useFileStore.getState().setOutput(activeFile.id, blob, activeFile.name, blob.size);
    } catch (err: any) {
      alert(`Flip failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-[hsl(var(--background))] divide-y lg:divide-y-0 lg:divide-x divide-[hsl(var(--border))]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,application/pdf"
        onChange={handleAddFiles}
        className="hidden"
      />

      {/* ─────────────────────────────────────────────────────────────
          1. LEFT COLUMN: FILE TRAY & PROJECTS MANAGER
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col bg-[hsl(var(--card)/0.5)] max-h-[35vh] lg:max-h-none overflow-hidden">
        {/* Project Selector Bar */}
        <div className="p-3.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.7)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderKanban className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
            <select
              value={activeProjectId || ""}
              onChange={(e) => setActiveProjectId(e.target.value || null)}
              className="bg-transparent text-xs font-semibold truncate rounded px-1 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="">All Projects ({files.length} files)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewProjectInput(!showNewProjectInput)}
            className="text-[11px] font-medium text-[hsl(var(--primary))] hover:underline shrink-0"
          >
            + New
          </button>
        </div>

        {/* New Project Input */}
        {showNewProjectInput && (
          <div className="p-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] flex items-center gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name (e.g. Website Assets)..."
              className="w-full text-xs rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 focus:outline-none"
            />
            <button
              onClick={() => {
                if (newProjectName.trim()) {
                  createProject(newProjectName.trim());
                  setNewProjectName("");
                  setShowNewProjectInput(false);
                }
              }}
              className="text-xs font-semibold px-2 py-1 rounded bg-[hsl(var(--primary))] text-white"
            >
              Save
            </button>
          </div>
        )}

        {/* Files Action Toolbar */}
        <div className="px-3.5 py-2.5 border-b border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Files ({displayedFiles.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 font-semibold text-[hsl(var(--primary))] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
            {displayedFiles.length > 0 && (
              <button
                onClick={clearFiles}
                className="hover:text-[hsl(var(--destructive))] transition-colors"
                title="Clear all files"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* File Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {displayedFiles.length === 0 ? (
            <div className="py-10 text-center space-y-2 px-4">
              <FolderKanban className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground)/0.4)]" />
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                No files in workspace
              </p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Drag photos or PDFs here, or click Add.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Files
              </Button>
            </div>
          ) : (
            displayedFiles.map((file) => {
              const isSelected = file.id === activeFile?.id;
              const isImage = file.type.startsWith("image/");
              const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`group flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-xs"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--border)/0.8)] hover:bg-[hsl(var(--secondary)/0.4)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-[hsl(var(--primary))] text-white"
                          : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                      }`}
                    >
                      {isImage ? (
                        <FileImage className="h-4 w-4" />
                      ) : isPdf ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <FileIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-[hsl(var(--foreground))]">
                        {file.outputName || file.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                        <span>{formatBytes(file.outputSize || file.size)}</span>
                        {file.width && file.height && (
                          <span>• {file.width}×{file.height}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-opacity"
                    aria-label="Remove file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTER COLUMN: CANVAS & LIVE WORKSPACE PREVIEW
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--background))] overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="px-4 py-2.5 border-b border-[hsl(var(--border))] flex items-center justify-between gap-3 bg-[hsl(var(--background)/0.8)]">
          {/* File details & Undo / Redo */}
          <div className="flex items-center gap-3 min-w-0">
            {activeFile ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold truncate text-[hsl(var(--foreground))]">
                  {activeFile.name}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  {formatBytes(activeFile.size)}
                </Badge>
                {activeFile.width && activeFile.height && (
                  <Badge variant="secondary" className="text-[10px] font-mono shrink-0 hidden sm:inline-flex">
                    {activeFile.width}×{activeFile.height}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                No active file selected
              </span>
            )}
          </div>

          {/* Canvas Controls: Undo/Redo & Zoom */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => activeFile && undo(activeFile.id)}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] disabled:opacity-40 hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => activeFile && redo(activeFile.id)}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] disabled:opacity-40 hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-[hsl(var(--border))] mx-1" />

            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--secondary))] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--secondary))] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Live File Canvas Stage */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-[hsl(var(--secondary)/0.2)]">
          {activeFile ? (
            <div
              className="relative flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {activeFile.type.startsWith("image/") && activePreviewUrl ? (
                activeOutputUrl ? (
                  /* Before / After comparison slider if output is ready */
                  <div className="w-[85vw] max-w-lg sm:max-w-xl">
                    <CompareSlider
                      originalUrl={activePreviewUrl}
                      outputUrl={activeOutputUrl}
                      beforeLabel="Original"
                      afterLabel="Processed"
                    />
                  </div>
                ) : (
                  /* Standard Image Preview */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activePreviewUrl}
                    alt={activeFile.name}
                    className="max-h-[60vh] max-w-[85vw] rounded-xl shadow-2xl border border-[hsl(var(--border))] object-contain bg-[hsl(var(--card))]"
                  />
                )
              ) : activeFile.type === "application/pdf" || activeFile.name.endsWith(".pdf") ? (
                /* PDF Representation */
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 sm:p-12 text-center shadow-xl space-y-3 max-w-md">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                    {activeFile.name}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    PDF Document • {formatBytes(activeFile.size)}
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <Link
                      href="/pdf-studio"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
                    >
                      Open in PDF Studio <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <FileIcon className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))]" />
                  <p className="text-sm font-semibold">{activeFile.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                    {formatBytes(activeFile.size)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty Canvas State */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] text-center max-w-md cursor-pointer hover:border-[hsl(var(--primary))] transition-all"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] mb-4">
                <FolderKanban className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1">
                Drop Files into Workspace
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-xs leading-relaxed mb-4">
                Bring multiple images or PDFs into your local browser workspace to inspect, optimize, and export without re-uploading.
              </p>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Select Files
              </Button>
            </div>
          )}
        </div>

        {/* Optimization Score Bar */}
        {score && (
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                  {score.overall}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                      File Optimization: {score.rating}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                      ({score.overall}/100)
                    </span>
                  </div>
                  {score.suggestions[0] && (
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                      💡 {score.suggestions[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Breakdown Pills */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                  Size: {score.breakdown.size}/35
                </span>
                <span className="px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                  Format: {score.breakdown.format}/25
                </span>
                <span className="px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                  Privacy: {score.breakdown.privacy}/20
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT COLUMN: OPERATIONS DOCK & INSPECTOR
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col bg-[hsl(var(--card))] overflow-hidden border-t lg:border-t-0">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-2 bg-[hsl(var(--background)/0.8)]">
          <button
            onClick={() => setActiveTab("optimize")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "optimize"
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Optimize
          </button>
          <button
            onClick={() => setActiveTab("transform")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "transform"
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Transform
          </button>
          <button
            onClick={() => setActiveTab("convert")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "convert"
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Convert
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "privacy"
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab("deliver")}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "deliver"
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            Deliver
          </button>
        </div>

        {/* Tab Controls Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: OPTIMIZE */}
          {activeTab === "optimize" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Compression Quality</span>
                  <span className="font-mono font-bold text-[hsl(var(--primary))]">
                    {qualityPct}%
                  </span>
                </div>
                <Slider
                  value={[qualityPct]}
                  onValueChange={(val) => setQualityPct(val[0])}
                  min={10}
                  max={100}
                  step={1}
                />
              </div>

              {/* Exact Target Size Toggle */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                    Target Exact File Size
                  </span>
                  <Switch
                    checked={useTargetSize}
                    onCheckedChange={setUseTargetSize}
                  />
                </div>

                {useTargetSize && (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      Automatically runs multi-pass trials until file meets:
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.1, 0.5, 1, 2].map((mb) => (
                        <button
                          key={mb}
                          onClick={() => setTargetSizeMB(mb)}
                          className={`rounded-lg py-1.5 text-xs font-mono font-semibold border transition-colors ${
                            targetSizeMB === mb
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white"
                              : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                          }`}
                        >
                          {mb < 1 ? `${mb * 1000} KB` : `${mb} MB`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* One-Click Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Optimization Presets
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setQualityPct(75);
                      setUseTargetSize(true);
                      setTargetSizeMB(1);
                    }}
                    className="p-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left hover:border-[hsl(var(--primary))] transition-colors"
                  >
                    <p className="font-bold">WhatsApp / Chat</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Under 1 MB</p>
                  </button>
                  <button
                    onClick={() => {
                      setQualityPct(70);
                      setTargetWidth(1280);
                    }}
                    className="p-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left hover:border-[hsl(var(--primary))] transition-colors"
                  >
                    <p className="font-bold">Email Safe</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">70% • 1280px</p>
                  </button>
                  <button
                    onClick={() => {
                      setQualityPct(82);
                      setTargetFormat("image/webp");
                    }}
                    className="p-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left hover:border-[hsl(var(--primary))] transition-colors"
                  >
                    <p className="font-bold">Web Standard</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">WebP • 82%</p>
                  </button>
                  <button
                    onClick={() => {
                      setQualityPct(95);
                    }}
                    className="p-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-left hover:border-[hsl(var(--primary))] transition-colors"
                  >
                    <p className="font-bold">High Quality</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Print • 95%</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSFORM */}
          {activeTab === "transform" && (
            <div className="space-y-5">
              {/* Dimensions */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Resize Dimensions
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">Width (px)</label>
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) => setTargetWidth(Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">Height (px)</label>
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) => setTargetHeight(Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Lock Aspect Ratio</span>
                  <Switch
                    checked={maintainAspect}
                    onCheckedChange={setMaintainAspect}
                  />
                </div>
              </div>

              {/* Rotate & Flip */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Rotate & Orientation
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate(90)}
                  >
                    Rotate 90° CW
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotate(270)}
                  >
                    Rotate 90° CCW
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFlip("horizontal")}
                  >
                    Flip Horizontal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFlip("vertical")}
                  >
                    Flip Vertical
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONVERT */}
          {activeTab === "convert" && (
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Select Output Format
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { format: "image/webp", label: "WebP", sub: "Recommended modern format • 30% smaller" },
                  { format: "image/jpeg", label: "JPEG / JPG", sub: "Universal compatibility for all platforms" },
                  { format: "image/png", label: "PNG", sub: "Lossless crisp edges and transparent background" },
                ].map((f) => (
                  <button
                    key={f.format}
                    onClick={() => setTargetFormat(f.format as SupportedImageFormat)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors ${
                      targetFormat === f.format
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--secondary)/0.5)]"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[hsl(var(--foreground))]">{f.label}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{f.sub}</p>
                    </div>
                    {targetFormat === f.format && (
                      <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold">Metadata Audit</span>
                </div>

                {metadataExif ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      ⚠️ Sensitive metadata found in file!
                    </div>
                    <ul className="space-y-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                      {metadataExif.latitude && (
                        <li>• GPS Coordinates: Embedded physical location</li>
                      )}
                      {metadataExif.Make && (
                        <li>• Camera Make: {metadataExif.Make}</li>
                      )}
                      {metadataExif.Model && (
                        <li>• Device Model: {metadataExif.Model}</li>
                      )}
                      {metadataExif.DateTimeOriginal && (
                        <li>• Capture Date: {String(metadataExif.DateTimeOriginal)}</li>
                      )}
                    </ul>
                  </div>
                ) : metadataScanned ? (
                  <p className="text-xs text-emerald-400 font-medium">
                    ✓ Clean: No sensitive GPS or camera metadata detected.
                  </p>
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Scanning file for metadata...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DELIVER */}
          {activeTab === "deliver" && (
            <div className="space-y-4">
              {activeFile?.outputBlob ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
                    <h4 className="text-sm font-bold text-[hsl(var(--foreground))]">
                      File Delivered & Ready
                    </h4>
                    <p className="text-xs font-mono text-emerald-400">
                      {activeFile.outputName || activeFile.name}
                    </p>
                  </div>

                  <BeforeAfterStats
                    originalSize={activeFile.size}
                    outputSize={activeFile.outputSize || activeFile.outputBlob.size}
                    originalDimensions={
                      activeFile.width && activeFile.height
                        ? `${activeFile.width}×${activeFile.height}`
                        : undefined
                    }
                    outputDimensions={
                      activeFile.outputWidth && activeFile.outputHeight
                        ? `${activeFile.outputWidth}×${activeFile.outputHeight}`
                        : undefined
                    }
                  />

                  <Button
                    onClick={handleDeliverDownload}
                    className="w-full min-h-[46px] font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    Download Finished File
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => promoteOutputToInput(activeFile.id)}
                    className="w-full min-h-[42px]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reuse as Next Input
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Sparkles className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground)/0.4)]" />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Run an operation first using the button below to generate a deliverable output.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Execution Footer Bar */}
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.8)] space-y-2">
          <Button
            onClick={handleRunOperation}
            disabled={!activeFile || isProcessing}
            className="w-full min-h-[48px] font-bold text-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Locally...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run {activeTab.toUpperCase()} & Deliver
              </>
            )}
          </Button>

          <p className="text-[11px] text-center text-[hsl(var(--muted-foreground))] font-mono">
            Ctrl + Enter to run • 100% In-Browser
          </p>
        </div>
      </div>
    </div>
  );
}
