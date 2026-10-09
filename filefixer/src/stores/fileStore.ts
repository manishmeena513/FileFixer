"use client";

import { create } from "zustand";
import type {
  ManagedFile,
  ProcessingStatus,
  LocalProject,
  FileHistoryEntry,
  DownloadQueueItem,
  DownloadStatus,
} from "@/types";

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
  activeFileId: string | null;
  isWorkspaceOpen: boolean;

  // Projects
  projects: LocalProject[];
  activeProjectId: string | null;
  createProject: (name: string, description?: string) => LocalProject;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  assignFileToProject: (fileId: string, projectId?: string) => void;

  // Modals & Navigation
  setWorkspaceOpen: (open: boolean) => void;
  toggleWorkspace: () => void;
  setActiveFileId: (id: string | null) => void;

  isCommandCenterOpen: boolean;
  setCommandCenterOpen: (open: boolean) => void;

  isShortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;

  isDownloadCenterOpen: boolean;
  setDownloadCenterOpen: (open: boolean) => void;

  latestDeliveredFile: DownloadQueueItem | null;
  setLatestDeliveredFile: (item: DownloadQueueItem | null) => void;

  // File Management
  addFiles: (rawFiles: File[], targetProjectId?: string) => ManagedFile[];
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

  // Undo / Redo
  pushFileHistory: (
    id: string,
    action: string,
    nextFile: File,
    nextBlob?: Blob,
    nextName?: string,
    width?: number,
    height?: number
  ) => void;
  undo: (id: string) => boolean;
  redo: (id: string) => boolean;

  // Downloads Dock
  downloadQueue: DownloadQueueItem[];
  pushDownload: (item: Omit<DownloadQueueItem, "id" | "timestamp">) => string;
  updateDownloadStatus: (
    id: string,
    status: DownloadStatus,
    patch?: Partial<DownloadQueueItem>
  ) => void;
  removeDownload: (id: string) => void;
  clearDownloads: () => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  activeFileId: null,
  isWorkspaceOpen: false,

  projects: [
    {
      id: "project-default",
      name: "Default Session",
      description: "Active browser workspace files",
      createdAt: Date.now(),
    },
  ],
  activeProjectId: null,

  isCommandCenterOpen: false,
  setCommandCenterOpen: (open) => set({ isCommandCenterOpen: open }),

  isShortcutsOpen: false,
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),

  isDownloadCenterOpen: false,
  setDownloadCenterOpen: (open) => set({ isDownloadCenterOpen: open }),

  latestDeliveredFile: null,
  setLatestDeliveredFile: (item) => set({ latestDeliveredFile: item }),

  setWorkspaceOpen: (open) => set({ isWorkspaceOpen: open }),
  toggleWorkspace: () => set((s) => ({ isWorkspaceOpen: !s.isWorkspaceOpen })),
  setActiveFileId: (id) => set({ activeFileId: id }),

  createProject: (name, description) => {
    const proj: LocalProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      description,
      createdAt: Date.now(),
    };
    set((s) => ({ projects: [...s.projects, proj] }));
    return proj;
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
      files: s.files.map((f) =>
        f.projectId === id ? { ...f, projectId: undefined } : f
      ),
    }));
  },

  setActiveProjectId: (id) => set({ activeProjectId: id }),

  assignFileToProject: (fileId, projectId) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId ? { ...f, projectId } : f
      ),
    }));
  },

  addFiles: (rawFiles, targetProjectId) => {
    const now = Date.now();
    const projectId = targetProjectId ?? get().activeProjectId ?? undefined;

    const newFiles: ManagedFile[] = rawFiles.map((file) => {
      const id = genId();
      const initialEntry: FileHistoryEntry = {
        id: `hist-0`,
        action: "Initial file load",
        timestamp: now,
        fileSnapshot: file,
      };

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type:
          file.type ||
          (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : ""),
        status: "idle",
        addedAt: now,
        projectId,
        historyStack: [initialEntry],
        historyIndex: 0,
      };
    });

    set((state) => {
      const updatedFiles = [...state.files, ...newFiles];
      const nextActiveId = state.activeFileId ?? (newFiles[0]?.id || null);
      return { files: updatedFiles, activeFileId: nextActiveId };
    });

    for (const mf of newFiles) {
      probeImageDimensions(mf.file, mf.id, get().setDimensions);
    }
    return newFiles;
  },

  replaceFiles: (rawFiles) => {
    const now = Date.now();
    const newFiles: ManagedFile[] = rawFiles.map((file) => {
      const id = genId();
      const initialEntry: FileHistoryEntry = {
        id: `hist-0`,
        action: "Initial file load",
        timestamp: now,
        fileSnapshot: file,
      };

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type:
          file.type ||
          (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : ""),
        status: "idle",
        addedAt: now,
        historyStack: [initialEntry],
        historyIndex: 0,
      };
    });

    set({
      files: newFiles,
      activeFileId: newFiles[0]?.id || null,
    });

    for (const mf of newFiles) {
      probeImageDimensions(mf.file, mf.id, get().setDimensions);
    }
    return newFiles;
  },

  removeFile: (id) =>
    set((state) => {
      const remaining = state.files.filter((f) => f.id !== id);
      const nextActive =
        state.activeFileId === id
          ? remaining[0]?.id || null
          : state.activeFileId;
      return { files: remaining, activeFileId: nextActive };
    }),

  clearFiles: () => set({ files: [], activeFileId: null }),

  clearCompleted: () =>
    set((state) => {
      const remaining = state.files.filter((f) => f.status !== "done");
      const nextActive =
        state.activeFileId && remaining.some((f) => f.id === state.activeFileId)
          ? state.activeFileId
          : remaining[0]?.id || null;
      return { files: remaining, activeFileId: nextActive };
    }),

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

    get().pushFileHistory(
      id,
      "Promote processed output to input",
      nextFile,
      undefined,
      nextName,
      target.outputWidth ?? target.width,
      target.outputHeight ?? target.height
    );

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

  setOutput: (
    id,
    outputBlob,
    outputName,
    outputSize,
    outputWidth,
    outputHeight
  ) =>
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

  pushFileHistory: (
    id,
    action,
    nextFile,
    nextBlob,
    nextName,
    width,
    height
  ) => {
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        const stack = f.historyStack ? [...f.historyStack] : [];
        const currentIndex = f.historyIndex ?? stack.length - 1;
        // Trim redo branch
        const trimmed = stack.slice(0, currentIndex + 1);

        const newEntry: FileHistoryEntry = {
          id: `hist-${Date.now()}`,
          action,
          timestamp: Date.now(),
          fileSnapshot: nextFile,
          outputBlobSnapshot: nextBlob,
          outputNameSnapshot: nextName,
          outputSizeSnapshot: nextBlob?.size,
          width,
          height,
        };

        return {
          ...f,
          historyStack: [...trimmed, newEntry],
          historyIndex: trimmed.length,
        };
      }),
    }));
  },

  undo: (id) => {
    const target = get().files.find((f) => f.id === id);
    if (!target || !target.historyStack || (target.historyIndex ?? 0) <= 0) {
      return false;
    }

    const prevIndex = (target.historyIndex ?? 1) - 1;
    const entry = target.historyStack[prevIndex];
    if (!entry) return false;

    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          file: entry.fileSnapshot,
          name: entry.fileSnapshot.name,
          size: entry.fileSnapshot.size,
          type: entry.fileSnapshot.type || f.type,
          outputBlob: entry.outputBlobSnapshot,
          outputName: entry.outputNameSnapshot,
          outputSize: entry.outputSizeSnapshot,
          width: entry.width ?? f.width,
          height: entry.height ?? f.height,
          historyIndex: prevIndex,
        };
      }),
    }));
    return true;
  },

  redo: (id) => {
    const target = get().files.find((f) => f.id === id);
    if (
      !target ||
      !target.historyStack ||
      (target.historyIndex ?? 0) >= target.historyStack.length - 1
    ) {
      return false;
    }

    const nextIndex = (target.historyIndex ?? 0) + 1;
    const entry = target.historyStack[nextIndex];
    if (!entry) return false;

    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          file: entry.fileSnapshot,
          name: entry.fileSnapshot.name,
          size: entry.fileSnapshot.size,
          type: entry.fileSnapshot.type || f.type,
          outputBlob: entry.outputBlobSnapshot,
          outputName: entry.outputNameSnapshot,
          outputSize: entry.outputSizeSnapshot,
          width: entry.width ?? f.width,
          height: entry.height ?? f.height,
          historyIndex: nextIndex,
        };
      }),
    }));
    return true;
  },

  // Download Queue Dock
  downloadQueue: [],

  pushDownload: (item) => {
    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullItem: DownloadQueueItem = {
      ...item,
      id,
      timestamp: Date.now(),
    };

    set((s) => ({
      downloadQueue: [fullItem, ...s.downloadQueue].slice(0, 20),
      latestDeliveredFile: item.status === "downloaded" ? fullItem : s.latestDeliveredFile,
    }));
    return id;
  },

  updateDownloadStatus: (id, status, patch) => {
    set((s) => ({
      downloadQueue: s.downloadQueue.map((item) =>
        item.id === id ? { ...item, status, ...patch } : item
      ),
      latestDeliveredFile:
        status === "downloaded"
          ? {
              ...(s.downloadQueue.find((item) => item.id === id) || {
                id,
                fileName: "file",
                originalSize: 0,
                outputSize: 0,
                status: "downloaded",
                timestamp: Date.now(),
              }),
              status,
              ...patch,
            }
          : s.latestDeliveredFile,
    }));
  },

  removeDownload: (id) =>
    set((s) => ({
      downloadQueue: s.downloadQueue.filter((item) => item.id !== id),
    })),

  clearDownloads: () => set({ downloadQueue: [] }),
}));
