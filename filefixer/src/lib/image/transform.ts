export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformOptions {
  crop?: CropArea;
  rotation?: number; // degrees: 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  quality?: number;
  format?: string;
}

export async function transformImage(
  imageSource: File | HTMLImageElement | string,
  options: TransformOptions
): Promise<Blob> {
  let img: HTMLImageElement;

  if (typeof imageSource === "string") {
    img = await loadImageFromUrl(imageSource);
  } else if (imageSource instanceof File) {
    const url = URL.createObjectURL(imageSource);
    try {
      img = await loadImageFromUrl(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  } else {
    img = imageSource;
  }

  const rotation = ((options.rotation ?? 0) % 360 + 360) % 360;
  const is90or270 = rotation === 90 || rotation === 270;

  // 1. Initial rotated/flipped canvas
  const canvas1 = document.createElement("canvas");
  const ctx1 = canvas1.getContext("2d");
  if (!ctx1) throw new Error("Canvas context failed");

  canvas1.width = is90or270 ? img.naturalHeight : img.naturalWidth;
  canvas1.height = is90or270 ? img.naturalWidth : img.naturalHeight;

  ctx1.save();
  ctx1.translate(canvas1.width / 2, canvas1.height / 2);
  ctx1.rotate((rotation * Math.PI) / 180);
  ctx1.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
  ctx1.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx1.restore();

  // 2. Crop if specified
  let finalCanvas = canvas1;
  if (options.crop && options.crop.width > 0 && options.crop.height > 0) {
    const canvas2 = document.createElement("canvas");
    canvas2.width = options.crop.width;
    canvas2.height = options.crop.height;
    const ctx2 = canvas2.getContext("2d");
    if (!ctx2) throw new Error("Crop canvas context failed");

    ctx2.drawImage(
      canvas1,
      options.crop.x,
      options.crop.y,
      options.crop.width,
      options.crop.height,
      0,
      0,
      options.crop.width,
      options.crop.height
    );
    finalCanvas = canvas2;
  }

  return new Promise((resolve, reject) => {
    const mime = options.format || (imageSource instanceof File ? imageSource.type : "image/jpeg");
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Transform export failed"));
        resolve(blob);
      },
      mime,
      options.quality ?? 0.95
    );
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image element"));
    img.src = url;
  });
}
