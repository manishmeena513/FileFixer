"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, FolderOpen } from "lucide-react";
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
}

export function DropZone({
  onFiles,
  accept,
  multiple = true,
  className,
  label = "Drop your files here",
  sublabel,
  disabled = false,
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onFiles(files);
      // Reset so same file can be selected again
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFiles]
  );

  const acceptStr = accept?.join(",");

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all duration-200",
        "border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        isDragging && "drop-zone-active",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer hover:border-[hsl(var(--primary))] hover:bg-[hsl(186,100%,42%,0.04)]",
        className
      )}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="File upload area"
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
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

      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] transition-colors",
        isDragging && "border-[hsl(var(--primary))] bg-[hsl(186,100%,42%,0.15)]"
      )}>
        <Upload className={cn("h-6 w-6 text-[hsl(var(--muted-foreground))]", isDragging && "text-[hsl(var(--primary))]")} />
      </div>

      <div className="text-center">
        <p className="text-base font-medium text-[hsl(var(--foreground))]">{label}</p>
        {sublabel && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{sublabel}</p>
        )}
        {accept && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            {accept.map((a) => a.replace(".", "")).join(" · ")}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="default"
          size="md"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={disabled}
          aria-label="Browse files"
        >
          <FolderOpen className="h-4 w-4" />
          Browse Files
        </Button>
      </div>
    </div>
  );
}
