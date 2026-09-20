import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calcSavings(original: number, optimized: number): string {
  if (original === 0) return "0%";
  const pct = ((original - optimized) / original) * 100;
  return `${pct.toFixed(1)}%`;
}

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
