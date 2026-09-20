export type ProcessingStatus =
  | "idle"
  | "pending"
  | "processing"
  | "done"
  | "error";

export interface ManagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
  status: ProcessingStatus;
  error?: string;
  outputBlob?: Blob;
  outputName?: string;
  outputSize?: number;
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
