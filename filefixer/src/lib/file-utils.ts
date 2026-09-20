export { formatBytes, calcSavings, getExtension, stripExtension } from "./utils";

export type SupportedImageFormat = "image/jpeg" | "image/png" | "image/webp";
export type SupportedPDFFormat = "application/pdf";
export type SupportedFormat = SupportedImageFormat | SupportedPDFFormat;

export const IMAGE_FORMATS: SupportedImageFormat[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export function isImageFile(file: File): boolean {
  return IMAGE_FORMATS.includes(file.type as SupportedImageFormat);
}

export function isPDFFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

export function getMimeFromExtension(ext: string): SupportedImageFormat {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

export function getExtensionFromMime(mime: SupportedImageFormat): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const byteString = atob(data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => revokeObjectURL(url), 1000);
}

export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      revokeObjectURL(url);
    };
    img.onerror = () => {
      reject(new Error("Could not load image"));
      revokeObjectURL(url);
    };
    img.src = url;
  });
}
