"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Layers,
  Archive,
  Eye,
  Download,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { ToolPageShell } from "@/components/ui/ToolPageShell";
import { formatBytes, triggerDownload } from "@/lib/file-utils";
import { useFileStore } from "@/stores/fileStore";
import { addHistoryRecord } from "@/lib/storage/history";
import {
  RenameRules,
  CaseTransform,
  previewRenames,
  packageRenamedZip,
  RenamePreviewItem,
} from "@/lib/batch/rename";

function generateDelivId() {
  return `deliv-${Date.now()}`;
}

function getTimestamp() {
  return Date.now();
}

const TEMPLATE_PRESETS = [
  { label: "Asset_###", pattern: "Asset_###", hint: "Asset_001, Asset_002" },
  { label: "Photo_####", pattern: "Photo_####", hint: "Photo_0001, Photo_0002" },
  { label: "Document_YYYYMMDD_##", pattern: "Document_YYYYMMDD_##", hint: "Document_20261024_01" },
  { label: "File_###", pattern: "File_###", hint: "File_001, File_002" },
];

const CASE_OPTIONS: { id: CaseTransform; label: string; example: string }[] = [
  { id: "none", label: "Original", example: "My File.jpg" },
  { id: "lowercase", label: "lower", example: "my file.jpg" },
  { id: "uppercase", label: "UPPER", example: "MY FILE.JPG" },
  { id: "titlecase", label: "Title Case", example: "My File.jpg" },
  { id: "kebab", label: "kebab-case", example: "my-file.jpg" },
  { id: "snake", label: "snake_case", example: "my_file.jpg" },
];

export default function BatchRenamePage() {
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
  const [activeTab, setActiveTab] = useState<"template" | "rules" | "findReplace" | "regex">("template");

  // Rule States
  const [template, setTemplate] = useState("Asset_###");
  const [useTemplate, setUseTemplate] = useState(true);

  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");

  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);

  const [numberingEnabled, setNumberingEnabled] = useState(true);
  const [startIndex, setStartIndex] = useState(1);
  const [padding, setPadding] = useState(3);
  const [numberPosition, setNumberPosition] = useState<"suffix" | "prefix" | "replace">("suffix");

  const [caseTransform, setCaseTransform] = useState<CaseTransform>("none");

  const [regexPattern, setRegexPattern] = useState("");
  const [regexReplacement, setRegexReplacement] = useState("");
  const [regexFlags, setRegexFlags] = useState("g");

  const [preserveExtension, setPreserveExtension] = useState(true);
  const [lowercaseExtension, setLowercaseExtension] = useState(false);

  // Sync initial store files if present
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

  const removeSingleFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Compile active rules
  const currentRules = useMemo<RenameRules>(() => {
    const rules: RenameRules = {
      preserveExtension,
      lowercaseExtension,
      caseTransform,
    };

    if (useTemplate && template.trim().length > 0) {
      rules.template = template;
      rules.numbering = {
        enabled: true,
        startIndex,
        padding,
      };
    } else {
      if (prefix.trim().length > 0) rules.prefix = prefix;
      if (suffix.trim().length > 0) rules.suffix = suffix;

      if (numberingEnabled) {
        rules.numbering = {
          enabled: true,
          startIndex,
          padding,
          position: numberPosition,
          separator: "_",
        };
      }
    }

    if (findText.length > 0) {
      rules.findReplace = {
        find: findText,
        replace: replaceText,
        matchCase,
        replaceAll,
      };
    }

    if (regexPattern.length > 0) {
      rules.regex = {
        pattern: regexPattern,
        replacement: regexReplacement,
        flags: regexFlags,
      };
    }

    return rules;
  }, [
    useTemplate,
    template,
    startIndex,
    padding,
    prefix,
    suffix,
    numberingEnabled,
    numberPosition,
    caseTransform,
    findText,
    replaceText,
    matchCase,
    replaceAll,
    regexPattern,
    regexReplacement,
    regexFlags,
    preserveExtension,
    lowercaseExtension,
  ]);

  // Generate live preview list
  const previews = useMemo<RenamePreviewItem[]>(() => {
    return previewRenames(files, currentRules);
  }, [files, currentRules]);

  const handleDownloadSingle = (item: RenamePreviewItem) => {
    triggerDownload(item.file, item.renamed);

    pushDownload({
      fileName: item.renamed,
      originalSize: item.file.size,
      outputSize: item.file.size,
      savingsPct: 0,
      status: "ready",
      blob: item.file,
    });

    setLatestDeliveredFile({
      id: generateDelivId(),
      fileName: item.renamed,
      originalSize: item.file.size,
      outputSize: item.file.size,
      status: "downloaded",
      blob: item.file,
      timestamp: getTimestamp(),
    });

    triggerSupportPrompt();

    toast({
      title: "File downloaded",
      description: `Saved as ${item.renamed}.`,
      variant: "success",
    });
  };

  const handleDownloadAllIndividual = () => {
    if (previews.length === 0) return;

    previews.forEach((item, idx) => {
      setTimeout(() => {
        triggerDownload(item.file, item.renamed);
        pushDownload({
          fileName: item.renamed,
          originalSize: item.file.size,
          outputSize: item.file.size,
          savingsPct: 0,
          status: "ready",
          blob: item.file,
        });
      }, idx * 150);
    });

    triggerSupportPrompt();

    toast({
      title: "Downloading all files",
      description: `Dispatched ${previews.length} renamed files individually.`,
      variant: "success",
    });
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;

    try {
      const zipBlob = await packageRenamedZip(files, currentRules);
      const zipName = "filefixer_renamed_batch.zip";
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);

      triggerDownload(zipBlob, zipName);

      await addHistoryRecord({
        filename: `Batch Renamed (${files.length} files)`,
        tool: "Batch Rename",
        originalSize: totalSize,
        outputSize: zipBlob.size,
      });

      pushDownload({
        fileName: zipName,
        originalSize: totalSize,
        outputSize: zipBlob.size,
        savingsPct: 0,
        status: "ready",
        blob: zipBlob,
      });

      setLatestDeliveredFile({
        id: generateDelivId(),
        fileName: zipName,
        originalSize: totalSize,
        outputSize: zipBlob.size,
        status: "downloaded",
        blob: zipBlob,
        timestamp: getTimestamp(),
      });

      triggerSupportPrompt();

      toast({
        title: "ZIP archive created",
        description: `Packaged ${files.length} renamed files into ${zipName}.`,
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "ZIP creation failed",
        description: err instanceof Error ? err.message : "Failed to package renamed files.",
        variant: "error",
      });
    }
  };

  return (
    <ToolPageShell
      icon={Layers}
      title="Batch Rename Files"
      description="Standardize messy file collections with structured sequences, case normalization, and regex find & replace."
      backHref="/tools"
      backLabel="All Tools"
      formats={["ANY FORMAT"]}
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
        {/* Left: Files & Live Before/After Preview */}
        <div className="space-y-6 lg:col-span-2">
          {files.length === 0 ? (
            <DropZone
              onFiles={handleFiles}
              label="Drop any files here to batch rename"
              sublabel="Photos, documents, or assets of any file extension — 100% locally"
              className="py-16"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-[hsl(var(--border))] pb-3 gap-2">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[hsl(var(--primary))]" />
                  Live Rename Preview (
                  <span className="tabular-nums font-mono">{files.length}</span>{" "}
                  {files.length === 1 ? "file" : "files"})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] touch-manipulation"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add More
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="min-h-[44px] touch-manipulation text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* DESKTOP TABLE VIEW (md and up) */}
              <div className="hidden md:block glass-panel rounded-xl overflow-hidden shadow-lg">
                <div className="grid grid-cols-12 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  <div className="col-span-5">Original Filename</div>
                  <div className="col-span-5">Renamed Output</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="max-h-[500px] overflow-y-auto divide-y divide-[hsl(var(--border))]">
                  {previews.map((item, idx) => (
                    <div
                      key={`${item.original}-${idx}`}
                      className="grid grid-cols-12 items-center p-3 gap-2 text-xs transition-colors hover:bg-[hsl(var(--secondary)/0.3)]"
                    >
                      {/* Original */}
                      <div className="col-span-5 min-w-0">
                        <p className="truncate text-[hsl(var(--foreground))]" title={item.original}>
                          {item.original}
                        </p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] tabular-nums font-mono">
                          {formatBytes(item.file.size)}
                        </p>
                      </div>

                      {/* Renamed */}
                      <div className="col-span-5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`truncate font-semibold font-mono tabular-nums ${
                              item.valid
                                ? "text-[hsl(var(--primary))]"
                                : "text-[hsl(var(--destructive))]"
                            }`}
                            title={item.renamed}
                          >
                            {item.renamed}
                          </p>
                          {!item.valid && (
                            <Badge variant="destructive" className="text-[9px] shrink-0">
                              Invalid
                            </Badge>
                          )}
                        </div>
                        {item.error && (
                          <p className="text-[10px] text-[hsl(var(--destructive))] truncate">
                            {item.error}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSingle(item)}
                          disabled={!item.valid}
                          className="min-h-[44px] min-w-[44px] px-2.5 text-xs touch-manipulation"
                          title={`Save ${item.renamed}`}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                        <button
                          type="button"
                          onClick={() => removeSingleFile(idx)}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-colors touch-manipulation"
                          aria-label={`Remove ${item.original}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOBILE CARDS VIEW (< md) */}
              <div className="md:hidden space-y-3">
                {previews.map((item, idx) => (
                  <div
                    key={`${item.original}-${idx}`}
                    className="glass-panel rounded-xl p-3.5 space-y-2.5 shadow-md"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                        <span>Original</span>
                        <span>{formatBytes(item.file.size)}</span>
                      </div>
                      <p className="truncate text-xs font-medium text-[hsl(var(--foreground))]" title={item.original}>
                        {item.original}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 pt-2 border-t border-[hsl(var(--border))]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[hsl(var(--primary))]">
                        <span>Renamed</span>
                        {!item.valid && (
                          <Badge variant="destructive" className="text-[9px]">
                            Invalid
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`truncate font-semibold font-mono text-xs tabular-nums ${
                          item.valid
                            ? "text-[hsl(var(--primary))]"
                            : "text-[hsl(var(--destructive))]"
                        }`}
                        title={item.renamed}
                      >
                        {item.renamed}
                      </p>
                      {item.error && (
                        <p className="text-[10px] text-[hsl(var(--destructive))] truncate">
                          {item.error}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--border))]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSingle(item)}
                        disabled={!item.valid}
                        className="flex-1 min-h-[44px] text-xs touch-manipulation"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Save Single
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeSingleFile(idx)}
                        className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-colors touch-manipulation"
                        aria-label={`Remove ${item.original}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Comprehensive Rule Engine Controls */}
        <div className="space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary)/0.08)] rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
                Rename Rules
              </h2>
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono tabular-nums">
                {previews.length} target(s)
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl glass-panel p-1 border border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("template");
                  setUseTemplate(true);
                }}
                className={`rounded-lg py-2 text-xs font-semibold min-h-[44px] touch-manipulation transition-colors ${
                  activeTab === "template"
                    ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("rules");
                  setUseTemplate(false);
                }}
                className={`rounded-lg py-2 text-xs font-semibold min-h-[44px] touch-manipulation transition-colors ${
                  activeTab === "rules"
                    ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                Prefix/Seq
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("findReplace")}
                className={`rounded-lg py-2 text-xs font-semibold min-h-[44px] touch-manipulation transition-colors ${
                  activeTab === "findReplace"
                    ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                Find/Repl
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("regex")}
                className={`rounded-lg py-2 text-xs font-semibold min-h-[44px] touch-manipulation transition-colors ${
                  activeTab === "regex"
                    ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                Regex
              </button>
            </div>

            {/* TAB 1: Template Patterns */}
            {activeTab === "template" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_PRESETS.map((p) => (
                      <button
                        key={p.pattern}
                        type="button"
                        onClick={() => {
                          setTemplate(p.pattern);
                          setUseTemplate(true);
                        }}
                        className={`flex flex-col items-start p-2.5 rounded-lg border text-left min-h-[44px] touch-manipulation transition-colors ${
                          template === p.pattern && useTemplate
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-[hsl(var(--foreground))]">
                          {p.label}
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate max-w-full">
                          {p.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Custom Template Pattern
                  </label>
                  <input
                    type="text"
                    value={template}
                    onChange={(e) => {
                      setTemplate(e.target.value);
                      setUseTemplate(true);
                    }}
                    placeholder="e.g. Asset_### or Photo_YYYYMMDD_##"
                    className="w-full rounded-md glass-input px-3 py-2 text-sm font-mono text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] min-h-[44px] touch-manipulation"
                  />
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    <code className="text-[hsl(var(--primary))] font-mono">###</code> = zero-padded count;{" "}
                    <code className="text-[hsl(var(--primary))] font-mono">YYYYMMDD</code> = date;{" "}
                    <code className="text-[hsl(var(--primary))] font-mono">{"{orig}"}</code> = original base.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                      Start Index
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={startIndex}
                      onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-md glass-input px-3 py-2 text-sm font-mono min-h-[44px] touch-manipulation tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                      Zero Padding
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={padding}
                      onChange={(e) => setPadding(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full rounded-md glass-input px-3 py-2 text-sm font-mono min-h-[44px] touch-manipulation tabular-nums"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Prefix, Suffix & Sequential Numbering */}
            {activeTab === "rules" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. 2026_Project_"
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. _reviewed"
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>

                <div className="pt-2 border-t border-[hsl(var(--border))] space-y-3">
                  <div className="flex items-center justify-between min-h-[44px]">
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                      Sequence Numbering
                    </span>
                    <Switch
                      checked={numberingEnabled}
                      onCheckedChange={setNumberingEnabled}
                    />
                  </div>

                  {numberingEnabled && (
                    <div className="space-y-3 pl-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            Start Number
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={startIndex}
                            onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 0)}
                            className="w-full rounded-md glass-input px-2.5 py-1.5 text-xs font-mono min-h-[44px] touch-manipulation tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            Zero Padding
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={padding}
                            onChange={(e) => setPadding(parseInt(e.target.value, 10) || 1)}
                            className="w-full rounded-md glass-input px-2.5 py-1.5 text-xs font-mono min-h-[44px] touch-manipulation tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          Number Placement
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["suffix", "prefix", "replace"] as const).map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => setNumberPosition(pos)}
                              className={`rounded-md py-1.5 text-xs capitalize min-h-[44px] touch-manipulation border transition-colors ${
                                numberPosition === pos
                                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-bold"
                                  : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Find & Replace */}
            {activeTab === "findReplace" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Find Text
                  </label>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder="Text to search for..."
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Replace With
                  </label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Replacement text..."
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-between min-h-[44px] pt-1">
                  <span className="text-xs text-[hsl(var(--foreground))]">
                    Match Case Exactly
                  </span>
                  <Switch checked={matchCase} onCheckedChange={setMatchCase} />
                </div>

                <div className="flex items-center justify-between min-h-[44px]">
                  <span className="text-xs text-[hsl(var(--foreground))]">
                    Replace All Matches
                  </span>
                  <Switch checked={replaceAll} onCheckedChange={setReplaceAll} />
                </div>
              </div>
            )}

            {/* TAB 4: Regex Pattern Matching */}
            {activeTab === "regex" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Regex Pattern
                  </label>
                  <input
                    type="text"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="e.g. ^IMG_\d+ or \s+"
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Replacement
                  </label>
                  <input
                    type="text"
                    value={regexReplacement}
                    onChange={(e) => setRegexReplacement(e.target.value)}
                    placeholder="e.g. photo or _"
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Regex Flags
                  </label>
                  <input
                    type="text"
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    placeholder="e.g. g, i, or gi"
                    className="w-full rounded-md glass-input px-3 py-2 text-xs font-mono min-h-[44px] touch-manipulation"
                  />
                </div>
              </div>
            )}

            {/* Universal Case Transforms */}
            <div className="pt-3 border-t border-[hsl(var(--border))] space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--foreground))]">
                Case Transform
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CASE_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCaseTransform(c.id)}
                    className={`rounded-md p-2 text-left min-h-[44px] touch-manipulation border transition-colors ${
                      caseTransform === c.id
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] font-bold"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground)/0.3)]"
                    }`}
                  >
                    <div className="text-xs">{c.label}</div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate font-mono">
                      {c.example}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Extension options */}
            <div className="pt-2 border-t border-[hsl(var(--border))] space-y-2">
              <div className="flex items-center justify-between min-h-[44px]">
                <span className="text-xs text-[hsl(var(--foreground))]">
                  Preserve File Extensions
                </span>
                <Switch
                  checked={preserveExtension}
                  onCheckedChange={setPreserveExtension}
                />
              </div>

              <div className="flex items-center justify-between min-h-[44px]">
                <span className="text-xs text-[hsl(var(--foreground))]">
                  Lowercase Extension (.jpg)
                </span>
                <Switch
                  checked={lowercaseExtension}
                  onCheckedChange={setLowercaseExtension}
                />
              </div>
            </div>

            {/* Batch Action Buttons */}
            <div className="space-y-2.5 pt-3">
              <Button
                size="lg"
                disabled={files.length === 0}
                onClick={handleDownloadZip}
                className="w-full min-h-[48px] touch-manipulation bg-[hsl(var(--success))] hover:bg-emerald-600 text-white font-semibold"
              >
                <Archive className="h-4 w-4 mr-2" />
                Download All Renamed (ZIP)
              </Button>
              <Button
                variant="outline"
                size="md"
                disabled={files.length === 0}
                onClick={handleDownloadAllIndividual}
                className="w-full min-h-[44px] touch-manipulation"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All Individually
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
