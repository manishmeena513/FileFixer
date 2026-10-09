export type ProcessingStatus =
  | "idle"
  | "pending"
  | "processing"
  | "done"
  | "error";

export interface FileHistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  fileSnapshot: File;
  outputBlobSnapshot?: Blob;
  outputNameSnapshot?: string;
  outputSizeSnapshot?: number;
  width?: number;
  height?: number;
}

export interface LocalProject {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface ManagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  status: ProcessingStatus;
  error?: string;
  outputBlob?: Blob;
  outputName?: string;
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;
  addedAt?: number;
  projectId?: string;
  historyStack?: FileHistoryEntry[];
  historyIndex?: number;
}

export interface ResizePreset {
  label: string;
  width: number;
  height: number;
  category: string;
}

export interface CompressionResult {
  originalSize: number;
  outputSize: number;
  savings: number;
  blob: Blob;
  filename: string;
}

export interface PDFPageInfo {
  pageNumber: number;
  selected: boolean;
  rotation: number;
  thumbnailUrl?: string;
}

export interface BatchSummary {
  total: number;
  completed: number;
  failed: number;
  originalTotalSize: number;
  outputTotalSize: number;
}

export type DownloadStatus =
  | "preparing"
  | "processing"
  | "ready"
  | "downloading"
  | "downloaded"
  | "error";

export interface DownloadQueueItem {
  id: string;
  fileName: string;
  originalSize: number;
  outputSize: number;
  savingsPct?: number;
  status: DownloadStatus;
  blob?: Blob;
  timestamp: number;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  type: "resize" | "convert" | "compress" | "strip_metadata" | "rename";
  label: string;
  description: string;
  config: {
    targetWidth?: number;
    targetHeight?: number;
    targetFormat?: "image/webp" | "image/jpeg" | "image/png";
    qualityPct?: number;
    renamePattern?: string;
    stripExif?: boolean;
    stripGps?: boolean;
  };
}

export interface OptimizationScore {
  overall: number; // 0 - 100
  rating: "Excellent" | "Optimal" | "Good" | "Needs Optimization";
  breakdown: {
    size: number; // max 35
    format: number; // max 25
    privacy: number; // max 20
    dimensions: number; // max 20
  };
  suggestions: string[];
}
