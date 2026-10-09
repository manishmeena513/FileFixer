import { OptimizationScore } from "@/types";

interface ScoreInput {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  outputSize?: number;
  outputType?: string;
  hasExif?: boolean;
  hasGps?: boolean;
  metadataCleaned?: boolean;
}

export function computeOptimizationScore(input: ScoreInput): OptimizationScore {
  let sizeScore = 15; // out of 35
  let formatScore = 12; // out of 25
  let privacyScore = 14; // out of 20
  let dimensionScore = 14; // out of 20
  const suggestions: string[] = [];

  const isImage = input.type.startsWith("image/");
  const isPdf = input.type === "application/pdf" || input.name.toLowerCase().endsWith(".pdf");

  // 1. Size & Compression Assessment (0 - 35)
  if (input.outputSize && input.outputSize < input.size) {
    const savedPct = ((input.size - input.outputSize) / input.size) * 100;
    if (savedPct >= 60) {
      sizeScore = 35;
    } else if (savedPct >= 35) {
      sizeScore = 30;
    } else if (savedPct >= 15) {
      sizeScore = 24;
    } else {
      sizeScore = 18;
    }
  } else {
    // Uncompressed input assessment
    if (input.size < 500 * 1024) {
      // Under 500 KB is already reasonably compact
      sizeScore = 28;
    } else if (input.size < 2 * 1024 * 1024) {
      // Under 2 MB
      sizeScore = 20;
      suggestions.push("Run compression to trim 40-70% file size without visible quality loss.");
    } else {
      // Large file
      sizeScore = 10;
      suggestions.push("Large file (>2 MB). Highly recommended to compress before emailing or publishing.");
    }
  }

  // 2. Format Assessment (0 - 25)
  const currentFormat = (input.outputType || input.type).toLowerCase();
  if (currentFormat.includes("webp") || currentFormat.includes("avif")) {
    formatScore = 25;
  } else if (currentFormat.includes("jpeg") || currentFormat.includes("jpg")) {
    formatScore = 20;
    if (isImage && !input.outputType?.includes("webp")) {
      suggestions.push("Convert to modern WebP for an additional 25-35% size reduction.");
    }
  } else if (currentFormat.includes("png")) {
    // If large PNG with photo dimensions
    if (input.width && input.height && input.width * input.height > 800000) {
      formatScore = 14;
      suggestions.push("PNG is heavy for photos. Converting to WebP or JPG will drastically reduce weight.");
    } else {
      formatScore = 22; // Small graphic / icon
    }
  } else if (isPdf) {
    formatScore = 22;
  }

  // 3. Privacy & Metadata (0 - 20)
  if (input.metadataCleaned) {
    privacyScore = 20;
  } else if (input.hasGps) {
    privacyScore = 4;
    suggestions.push("Critical: Embedded GPS coordinates detected. Remove metadata to protect physical location.");
  } else if (input.hasExif) {
    privacyScore = 12;
    suggestions.push("Camera & hardware metadata detected. Strip EXIF before sharing publicly.");
  } else {
    privacyScore = 18; // Clean or unknown
  }

  // 4. Dimensions & Scaling (0 - 20)
  if (input.width && input.height) {
    const maxDim = Math.max(input.width, input.height);
    if (maxDim > 4000) {
      dimensionScore = 8;
      suggestions.push("Excessive camera resolution (>4000px). Downscaling to 1920px will speed up web loading.");
    } else if (maxDim > 2560) {
      dimensionScore = 14;
      suggestions.push("High resolution (>2560px). Suitable for print, but consider resizing for web/mobile.");
    } else if (maxDim <= 1920 && maxDim >= 600) {
      dimensionScore = 20; // Sweet spot
    } else {
      dimensionScore = 16;
    }
  } else {
    dimensionScore = 16;
  }

  const overall = Math.min(100, Math.max(0, sizeScore + formatScore + privacyScore + dimensionScore));

  let rating: "Excellent" | "Optimal" | "Good" | "Needs Optimization" = "Good";
  if (overall >= 90) rating = "Excellent";
  else if (overall >= 75) rating = "Optimal";
  else if (overall >= 60) rating = "Good";
  else rating = "Needs Optimization";

  return {
    overall,
    rating,
    breakdown: {
      size: sizeScore,
      format: formatScore,
      privacy: privacyScore,
      dimensions: dimensionScore,
    },
    suggestions: suggestions.slice(0, 3),
  };
}
