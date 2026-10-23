"use client";

import React, { useCallback } from "react";
import { useFileStore } from "@/stores/fileStore";
import { DropZone } from "@/components/upload/DropZone";
import { StagedFilesSummary } from "@/components/home/StagedFilesSummary";

export function SmartDropZone() {
  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    setWorkspaceOpen,
  } = useFileStore();

  const handleDroppedFiles = useCallback(
    (dropped: File[]) => {
      if (dropped.length === 0) return;
      addFiles(dropped);
    },
    [addFiles]
  );

  if (files.length > 0) {
    return (
      <StagedFilesSummary
        files={files}
        onRemoveFile={removeFile}
        onClearFiles={clearFiles}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
        onAddMoreFiles={handleDroppedFiles}
      />
    );
  }

  return (
    <div className="relative">
      <DropZone
        onFiles={handleDroppedFiles}
        label="Drop files here or tap to select"
        sublabel="Smart auto-detection — images, PDFs, and documents routed instantly"
        formats={["JPG", "PNG", "WEBP", "PDF", "SVG"]}
        className="py-8 sm:py-12 shadow-2xl border-2 border-dashed hover:border-[hsl(var(--primary))] transition-all"
      />
    </div>
  );
}
