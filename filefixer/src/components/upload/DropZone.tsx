"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, FolderOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DropZoneProps {
  onFiles?: (files: File[]) => void;
  onFilesSelected?: (files: File[]) => void;
  accept?: string[] | Record<string, string[]>;
  multiple?: boolean;
  className?: string;
  label?: string;
  title?: string;
  sublabel?: string;
  description?: string;
  disabled?: boolean;
  formats?: string[];
}

export function DropZone({
  onFiles,
  onFilesSelected,
  accept,
  multiple = true,
  className,
  label,
  title = "Drop files here or tap to select",
  sublabel,
  description = "Processed 100% locally in your browser — never uploaded",
  disabled = false,
  formats,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayTitle = label || title;
  const displayDescription = sublabel || description;

  const emitFiles = useCallback(
    (files: File[]) => {
      if (onFiles) onFiles(files);
      else if (onFilesSelected) onFilesSelected(files);
    },
    [onFiles, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) emitFiles(files);
    },
    [emitFiles, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) emitFiles(files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [emitFiles]
  );

  const acceptList: string[] = Array.isArray(accept)
    ? accept
    : accept
    ? Object.keys(accept)
    : [];
  const acceptStr = acceptList.length > 0 ? acceptList.join(",") : undefined;

  const displayFormats =
    formats ??
    (acceptList.length > 0
      ? acceptList
          .map((a) =>
            a
              .replace("image/", "")
              .replace("application/", "")
              .replace(".", "")
              .toUpperCase()
          )
          .filter((v, i, arr) => v !== "*" && arr.indexOf(v) === i)
      : ["JPG", "PNG", "WEBP", "PDF"]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "drop-zone-idle animate-pulse-glow relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center",
        "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        isDragging && "drop-zone-active",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={acceptStr}
        onChange={handleFileInput}
        disabled={disabled}
        className="sr-only"
        id="dropzone-input"
        aria-label="Upload files"
      />

      {/* Center Icon */}
      <div
        className={cn(
          "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border transition-all duration-200",
          isDragging
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] scale-110"
            : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
        )}
      >
        {isDragging ? (
          <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse text-[hsl(var(--primary))]" />
        ) : (
          <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
        )}
      </div>

      {/* Headings */}
      <div className="space-y-1.5 max-w-md">
        <p className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))]">
          {isDragging ? "DROP FILES TO START" : displayTitle}
        </p>
        <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
          {displayDescription}
        </p>
      </div>

      {/* Button & Formats */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          size="md"
          className="min-h-[44px] px-6 text-sm font-semibold shadow-xs"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Select Files
        </Button>

        {displayFormats.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {displayFormats.slice(0, 5).map((fmt) => (
              <span
                key={fmt}
                className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-0.5 text-[10px] font-mono font-medium text-[hsl(var(--muted-foreground))]"
              >
                {fmt}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
