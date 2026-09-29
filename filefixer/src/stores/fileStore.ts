"use client";

import { create } from "zustand";
import type { ManagedFile, ProcessingStatus } from "@/types";

let idCounter = 0;
function genId() {
  return `file-${Date.now()}-${idCounter++}`;
}

function probeImageDimensions(
  file: File,
  id: string,
  onDimensions: (id: string, width: number, height: number) => void
) {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const img = new window.Image();
  img.onload = () => {
    if (img.naturalWidth && img.naturalHeight) {
      onDimensions(id, img.naturalWidth, img.naturalHeight);
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

interface FileStore {
  files: ManagedFile[];
  isWorkspaceOpen: boolean;
  setWorkspaceOpen: (open: boolean) => void;
  toggleWorkspace: () => void;
  addFiles: (rawFiles: File[]) => ManagedFile[];
  replaceFiles: (rawFiles: File[]) => ManagedFile[];
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearCompleted: () => void;
  resetStatuses: () => void;
  retryFailed: () => void;
  promoteOutputToInput: (id: string) => void;
  updateStatus: (id: string, status: ProcessingStatus, error?: string) => void;
  setOutput: (
    id: string,
    outputBlob: Blob,
    outputName: string,
    outputSize: number,
    outputWidth?: number,
    outputHeight?: number
  ) => void;
  setThumbnail: (id: string, thumbnailUrl: string) => void;
  setDimensions: (id: string, width: number, height: number) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  isWorkspaceOpen: false,

  setWorkspaceOpen: (open) => set({ isWorkspaceOpen: open }),
  toggleWorkspace: () => set((s) => ({ isWorkspaceOpen: !s.isWorkspaceOpen })),

  addFiles: (rawFiles) => {
    const now = Date.now();
    const newFiles: ManagedFile[] = rawFiles.map((file) => ({
      id: genId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : ""),
      status: "idle",
      addedAt: now,
    }));

    set((state) => ({ files: [...state.files, ...newFiles] }));

    for (const mf of newFiles) {
      probeImageDimensions(mf.file, mf.id, get().setDimensions);
    }
    return newFiles;
  },

  replaceFiles: (rawFiles) => {
    const now = Date.now();
    const newFiles: ManagedFile[] = rawFiles.map((file) => ({
      id: genId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : ""),
      status: "idle",
      addedAt: now,
    }));

    set({ files: newFiles });

    for (const mf of newFiles) {
      probeImageDimensions(mf.file, mf.id, get().setDimensions);
    }
    return newFiles;
  },

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  clearFiles: () => set({ files: [] }),

  clearCompleted: () =>
    set((state) => ({
      files: state.files.filter((f) => f.status !== "done"),
    })),

  resetStatuses: () =>
    set((state) => ({
      files: state.files.map((f) => ({
        ...f,
        status: "idle" as ProcessingStatus,
        error: undefined,
        outputBlob: undefined,
        outputName: undefined,
        outputSize: undefined,
      })),
    })),

  retryFailed: () =>
    set((state) => ({
      files: state.files.map((f) =>
        f.status === "error"
          ? { ...f, status: "idle" as ProcessingStatus, error: undefined }
          : f
      ),
    })),

  promoteOutputToInput: (id) => {
    const target = get().files.find((f) => f.id === id);
    if (!target || !target.outputBlob) return;
    const nextName = target.outputName || target.name;
    const nextType = target.outputBlob.type || target.type;
    const nextFile = new File([target.outputBlob], nextName, {
      type: nextType,
      lastModified: Date.now(),
    });

    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              file: nextFile,
              name: nextName,
              size: nextFile.size,
              type: nextType,
              status: "idle",
              error: undefined,
              outputBlob: undefined,
              outputName: undefined,
              outputSize: undefined,
              width: f.outputWidth ?? f.width,
              height: f.outputHeight ?? f.height,
              outputWidth: undefined,
              outputHeight: undefined,
            }
          : f
      ),
    }));

    probeImageDimensions(nextFile, id, get().setDimensions);
  },

  updateStatus: (id, status, error) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    })),

  setOutput: (id, outputBlob, outputName, outputSize, outputWidth, outputHeight) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              outputBlob,
              outputName,
              outputSize,
              outputWidth: outputWidth ?? f.outputWidth,
              outputHeight: outputHeight ?? f.outputHeight,
              status: "done",
            }
          : f
      ),
    })),

  setThumbnail: (id, thumbnailUrl) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, thumbnailUrl } : f
      ),
    })),

  setDimensions: (id, width, height) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, width, height } : f
      ),
    })),
}));

