"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, FolderOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  className?: string;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  formats?: string[];
}

export function DropZone({
  onFiles,
  accept,
  multiple = true,
  className,
  label = "Drop files here or tap to select",
  sublabel = "Processed 100% locally in your browser — never uploaded",
  disabled = false,
  formats,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isDragging) setIsDragging(true);
    },
    [disabled, isDragging]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onFiles(files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFiles]
  );

  const acceptStr = accept?.join(",");

  const displayFormats =
    formats ??
    (accept
      ? accept
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
        !disabled &&
          "cursor-pointer hover:border-[hsl(var(--primary)/0.75)] hover:bg-[hsl(var(--primary)/0.03)] active:scale-[0.995]",
        className
      )}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="File upload area"
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple={multiple}
        accept={acceptStr}
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
      />

      <div
        className={cn(
          "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] transition-all duration-200",
          isDragging &&
            "scale-110 border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] shadow-lg shadow-[hsl(var(--primary)/0.2)]"
        )}
      >
        {isDragging ? (
          <Sparkles className="h-7 w-7 text-[hsl(var(--primary))] animate-pulse" />
        ) : (
          <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-[hsl(var(--primary))]" />
        )}
      </div>

      <div className="space-y-1.5 max-w-md">
        <p
          className={cn(
            "text-base sm:text-lg font-bold tracking-tight transition-colors",
            isDragging
              ? "text-[hsl(var(--primary))] uppercase tracking-wider"
              : "text-[hsl(var(--foreground))]"
          )}
        >
          {isDragging ? "DROP FILE TO START" : label}
        </p>
        {sublabel && (
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            {sublabel}
          </p>
        )}
      </div>

      {displayFormats.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {displayFormats.map((fmt) => (
            <span
              key={fmt}
              className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.7)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
            >
              {fmt}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex gap-2">
        <Button
          variant="default"
          size="md"
          className="min-h-[44px] px-5 font-semibold shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={disabled}
          aria-label="Select files"
        >
          <FolderOpen className="h-4 w-4" />
          Select Files
        </Button>
      </div>
    </div>
  );
}

