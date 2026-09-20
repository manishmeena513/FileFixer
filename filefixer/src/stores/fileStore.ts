"use client";

import { create } from "zustand";
import type { ManagedFile, ProcessingStatus } from "@/types";

let idCounter = 0;
function genId() {
  return `file-${Date.now()}-${idCounter++}`;
}

interface FileStore {
  files: ManagedFile[];
  addFiles: (rawFiles: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateStatus: (id: string, status: ProcessingStatus, error?: string) => void;
  setOutput: (
    id: string,
    outputBlob: Blob,
    outputName: string,
    outputSize: number
  ) => void;
  setThumbnail: (id: string, thumbnailUrl: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],

  addFiles: (rawFiles) =>
    set((state) => {
      const newFiles: ManagedFile[] = rawFiles.map((file) => ({
        id: genId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "idle",
      }));
      return { files: [...state.files, ...newFiles] };
    }),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  clearFiles: () => set({ files: [] }),

  updateStatus: (id, status, error) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    })),

  setOutput: (id, outputBlob, outputName, outputSize) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, outputBlob, outputName, outputSize, status: "done" } : f
      ),
    })),

  setThumbnail: (id, thumbnailUrl) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, thumbnailUrl } : f
      ),
    })),
}));
