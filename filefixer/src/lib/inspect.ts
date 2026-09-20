import exifr from "exifr";
import { PDFDocument } from "pdf-lib";
import { formatBytes, getImageDimensions, isImageFile, isPDFFile, fileToArrayBuffer } from "./file-utils";

export interface FileMetadata {
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  lastModified: number;
  lastModifiedDate: string;
  category: "image" | "pdf" | "other";

  // Image specific
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  exifAvailable?: boolean;
  cameraMake?: string;
  cameraModel?: string;
  dateTaken?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  hasGps?: boolean;

  // PDF specific
  pdfPages?: number;
  pdfTitle?: string;
  pdfAuthor?: string;
  pdfSubject?: string;
  pdfCreator?: string;
  pdfProducer?: string;
  pdfCreationDate?: string;
}

export async function inspectFile(file: File): Promise<FileMetadata> {
  const base: FileMetadata = {
    name: file.name,
    size: file.size,
    sizeFormatted: formatBytes(file.size),
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified,
    lastModifiedDate: new Date(file.lastModified).toLocaleString(),
    category: isImageFile(file) ? "image" : isPDFFile(file) ? "pdf" : "other",
  };

  if (base.category === "image") {
    try {
      const dims = await getImageDimensions(file);
      base.imageWidth = dims.width;
      base.imageHeight = dims.height;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(dims.width, dims.height);
      base.aspectRatio = `${dims.width / divisor}:${dims.height / divisor}`;
    } catch {
      // Dimensions load failed
    }

    try {
      const parsedExif = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
      });

      if (parsedExif) {
        base.exifAvailable = true;
        base.cameraMake = parsedExif.Make;
        base.cameraModel = parsedExif.Model;
        base.dateTaken = parsedExif.DateTimeOriginal ? new Date(parsedExif.DateTimeOriginal).toLocaleString() : undefined;
        base.iso = parsedExif.ISO;
        base.fNumber = parsedExif.FNumber;
        base.exposureTime = parsedExif.ExposureTime ? `1/${Math.round(1 / parsedExif.ExposureTime)}s` : undefined;
        base.hasGps = Boolean(parsedExif.latitude || parsedExif.longitude);
      } else {
        base.exifAvailable = false;
      }
    } catch {
      base.exifAvailable = false;
    }
  } else if (base.category === "pdf") {
    try {
      const buffer = await fileToArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      base.pdfPages = pdfDoc.getPageCount();
      base.pdfTitle = pdfDoc.getTitle();
      base.pdfAuthor = pdfDoc.getAuthor();
      base.pdfSubject = pdfDoc.getSubject();
      base.pdfCreator = pdfDoc.getCreator();
      base.pdfProducer = pdfDoc.getProducer();
      base.pdfCreationDate = pdfDoc.getCreationDate()?.toLocaleString();
    } catch {
      // PDF load failed
    }
  }

  return base;
}
