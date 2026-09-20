import { PDFDocument, PageSizes } from "pdf-lib";
import { fileToArrayBuffer } from "../file-utils";

export interface ImagesToPdfOptions {
  pageSize?: "a4" | "letter" | "auto";
  orientation?: "portrait" | "landscape" | "auto";
  margin?: number; // margin in points (e.g. 0, 20)
  fitMode?: "contain" | "fill";
}

export async function convertImagesToPdf(
  images: File[],
  options: ImagesToPdfOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; outputFilename: string }> {
  if (images.length === 0) {
    throw new Error("No images provided for PDF creation.");
  }

  const pdfDoc = await PDFDocument.create();
  const margin = options.margin ?? 20;

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const arrayBuffer = await fileToArrayBuffer(file);
    const mime = file.type.toLowerCase();

    let embeddedImage;
    if (mime === "image/png") {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // JPEG or convert to JPEG canvas if webp
      try {
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      } catch {
        // Fallback for WebP or unusual format by converting to JPEG in canvas
        const jpegBuffer = await convertImageToJpegBuffer(file);
        embeddedImage = await pdfDoc.embedJpg(jpegBuffer);
      }
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === "letter") {
      pageWidth = PageSizes.Letter[0];
      pageHeight = PageSizes.Letter[1];
    } else if (options.pageSize === "auto") {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    } else {
      // Default A4
      pageWidth = PageSizes.A4[0];
      pageHeight = PageSizes.A4[1];
    }

    // Orientation adjustment
    if (options.orientation === "landscape" && pageWidth < pageHeight) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    } else if (options.orientation === "auto" && imgWidth > imgHeight && pageWidth < pageHeight) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate dimensions to fit inside page within margin
    const availableW = pageWidth - margin * 2;
    const availableH = pageHeight - margin * 2;

    let drawW = availableW;
    let drawH = availableH;

    const imgRatio = imgWidth / imgHeight;
    const pageRatio = availableW / availableH;

    if (imgRatio > pageRatio) {
      drawW = availableW;
      drawH = availableW / imgRatio;
    } else {
      drawH = availableH;
      drawW = availableH * imgRatio;
    }

    const x = margin + (availableW - drawW) / 2;
    const y = margin + (availableH - drawH) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawW,
      height: drawH,
    });

    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });

  return {
    blob,
    outputFilename: "images_document.pdf",
  };
}

function convertImageToJpegBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error("Blob creation failed"));
            const ab = await blob.arrayBuffer();
            resolve(ab);
          },
          "image/jpeg",
          0.92
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
