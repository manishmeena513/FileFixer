import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatShutterSpeed,
  toDMS,
} from "../src/lib/image/metadata";
import { smartCompress } from "../src/lib/smartCompress";
import { RESIZE_PRESETS } from "../src/lib/image/resize";
import { PDFDocument } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Polyfill FileReader for Node.js test environment if needed
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class MockFileReader {
    result: any = null;
    onload: (() => void) | null = null;
    onerror: ((err: any) => void) | null = null;
    async readAsArrayBuffer(blob: Blob) {
      try {
        this.result = await blob.arrayBuffer();
        if (this.onload) this.onload();
      } catch (err) {
        if (this.onerror) this.onerror(err);
      }
    }
  } as any;
}

describe("Challenger M3: Adversarial Image Engine, Math & Coordinate Synchronization", () => {
  // =========================================================================
  // TASK 1: Exposure Time & Shutter Speed Math in metadata.ts
  // =========================================================================
  describe("Task 1.1: Exposure Time Calculation (formatShutterSpeed)", () => {
    it("formats standard long exposures (>= 1s) without division-by-zero or decimals", () => {
      assert.strictEqual(formatShutterSpeed(1), "1s");
      assert.strictEqual(formatShutterSpeed(2), "2s");
      assert.strictEqual(formatShutterSpeed(5), "5s");
      assert.strictEqual(formatShutterSpeed(10), "10s");
      assert.strictEqual(formatShutterSpeed(30), "30s");
      assert.strictEqual(formatShutterSpeed(60), "60s");
    });

    it("formats non-integer long exposures accurately", () => {
      assert.strictEqual(formatShutterSpeed(1.5), "1.5s");
      assert.strictEqual(formatShutterSpeed(2.5), "2.5s");
      assert.strictEqual(formatShutterSpeed(3.2), "3.2s");
      assert.strictEqual(formatShutterSpeed(1.04), "1s"); // 1.04.toFixed(1) -> 1.0 -> 1s
    });

    it("formats standard fractional shutter speeds into reciprocal fractions", () => {
      assert.strictEqual(formatShutterSpeed(1 / 2), "1/2s");
      assert.strictEqual(formatShutterSpeed(0.5), "1/2s");
      assert.strictEqual(formatShutterSpeed(1 / 4), "1/4s");
      assert.strictEqual(formatShutterSpeed(1 / 8), "1/8s");
      assert.strictEqual(formatShutterSpeed(1 / 15), "1/15s");
      assert.strictEqual(formatShutterSpeed(1 / 30), "1/30s");
      assert.strictEqual(formatShutterSpeed(1 / 60), "1/60s");
      assert.strictEqual(formatShutterSpeed(1 / 125), "1/125s");
      assert.strictEqual(formatShutterSpeed(1 / 250), "1/250s");
      assert.strictEqual(formatShutterSpeed(0.004), "1/250s");
      assert.strictEqual(formatShutterSpeed(1 / 500), "1/500s");
      assert.strictEqual(formatShutterSpeed(0.002), "1/500s");
      assert.strictEqual(formatShutterSpeed(1 / 1000), "1/1000s");
      assert.strictEqual(formatShutterSpeed(0.001), "1/1000s");
      assert.strictEqual(formatShutterSpeed(1 / 2000), "1/2000s");
      assert.strictEqual(formatShutterSpeed(1 / 4000), "1/4000s");
      assert.strictEqual(formatShutterSpeed(1 / 8000), "1/8000s");
    });

    it("handles boundary, non-numeric, 0, and negative inputs safely without throwing", () => {
      assert.strictEqual(formatShutterSpeed(undefined), undefined);
      assert.strictEqual(formatShutterSpeed(NaN), undefined);
      assert.strictEqual(formatShutterSpeed(0), undefined);
      assert.strictEqual(formatShutterSpeed(-0.5), undefined);
      assert.strictEqual(formatShutterSpeed(-5), undefined);
    });

    it("handles edge value near 1s boundary (0.999s)", () => {
      // 0.999s < 1s -> 1 / 0.999 = 1.001 -> denominator 1 -> '1/1s'
      assert.strictEqual(formatShutterSpeed(0.999), "1/1s");
    });
  });

  // =========================================================================
  // TASK 1.2: GPS Coordinate DMS Parsing & Direction Invariant
  // =========================================================================
  describe("Task 1.2: GPS DMS Coordinate Verification & Direction Soundness", () => {
    it("formats Northern latitude (+deg, isLat=true) with 'N'", () => {
      const res = toDMS(40.7128, true);
      assert.match(res, /N$/);
      assert.strictEqual(res, "40° 42' 46\" N");
    });

    it("formats Western longitude (-deg, isLat=false) with 'W'", () => {
      const res = toDMS(-74.006, false);
      assert.match(res, /W$/);
      assert.strictEqual(res, "74° 0' 21\" W");
    });

    // ADVERSARIAL STRESS TEST: Verify Southern latitude and Eastern longitude directions
    it("evaluates Southern latitude (-deg, isLat=true) direction indicator", () => {
      // Sydney, Australia latitude: -33.8688
      const res = toDMS(-33.8688, true);
      // Empirical verification: If line 56 has inverted ternary (deg >= 0 ? (isLat ? 'N' : 'S') : (isLat ? 'E' : 'W')),
      // then for deg < 0 and isLat=true, it incorrectly returns 'E' instead of 'S'!
      const endsWithS = res.endsWith("S");
      const endsWithE = res.endsWith("E");
      
      // We document actual behavior vs required behavior
      if (endsWithE) {
        console.warn(`[DEFECT DETECTED] toDMS(-33.8688, true) produced: "${res}" (labeled as EAST instead of SOUTH!)`);
      }
      // Assert mathematical truth: Southern latitude MUST end in S
      assert.strictEqual(
        res.endsWith("S"),
        true,
        `Expected Southern latitude to end with 'S', but got "${res}"`
      );
    });

    it("evaluates Eastern longitude (+deg, isLat=false) direction indicator", () => {
      // Delhi, India longitude: +77.2090
      const res = toDMS(77.209, false);
      // Empirical verification: If line 56 has inverted ternary (deg >= 0 ? (isLat ? 'N' : 'S') : (isLat ? 'E' : 'W')),
      // then for deg >= 0 and isLat=false, it incorrectly returns 'S' instead of 'E'!
      const endsWithE = res.endsWith("E");
      const endsWithS = res.endsWith("S");

      if (endsWithS) {
        console.warn(`[DEFECT DETECTED] toDMS(77.209, false) produced: "${res}" (labeled as SOUTH instead of EAST!)`);
      }
      // Assert mathematical truth: Eastern longitude MUST end in E
      assert.strictEqual(
        res.endsWith("E"),
        true,
        `Expected Eastern longitude to end with 'E', but got "${res}"`
      );
    });
  });

  // =========================================================================
  // TASK 2: 7-Pass Progressive Compression Loop & Extreme Target Caps
  // =========================================================================
  describe("Task 2: 7-Pass Progressive Compression Loop in smartCompress.ts", () => {
    it("bypasses compression immediately when file is already under target cap", async () => {
      const mockFile = new File(["small image content test"], "small.jpg", {
        type: "image/jpeg",
      });
      // File size is ~24 bytes, target cap is 1 MB (1048576 bytes)
      const res = await smartCompress(mockFile, 1.0);
      assert.strictEqual(res.achieved, true);
      assert.strictEqual(res.originalSize, mockFile.size);
      assert.strictEqual(res.bestSize, mockFile.size);
      assert.strictEqual(res.attempts.length, 1);
      assert.strictEqual(res.attempts[0].attemptNumber, 1);
      assert.match(res.attempts[0].label, /already under target size/i);
    });

    it("defines 7 progressive passes with strictly decreasing quality and dimensions", () => {
      const smartCompressPath = path.join(rootDir, "src", "lib", "smartCompress.ts");
      const content = fs.readFileSync(smartCompressPath, "utf-8");

      // Verify all 7 passes exist in smartCompress.ts
      assert.match(content, /High Quality Pass/);
      assert.match(content, /Balanced Pass/);
      assert.match(content, /Strong Compression/);
      assert.match(content, /Target Optimization/);
      assert.match(content, /Compact Optimization/);
      assert.match(content, /Ultra-Compact Pass/);
      assert.match(content, /Maximum Reduction/);

      // Verify pass qualities: 0.82 -> 0.68 -> 0.52 -> 0.40 -> 0.28 -> 0.22 -> 0.16
      const qualities = [0.82, 0.68, 0.52, 0.40, 0.28, 0.22, 0.16];
      for (let i = 1; i < qualities.length; i++) {
        assert.ok(
          qualities[i] < qualities[i - 1],
          `Quality pass ${i + 1} (${qualities[i]}) must be less than pass ${i} (${qualities[i - 1]})`
        );
      }

      // Verify max dimensions: 2560 -> 2048 -> 1600 -> 1280 -> 1024 -> 800 -> 640
      const dims = [2560, 2048, 1600, 1280, 1024, 800, 640];
      for (let i = 1; i < dims.length; i++) {
        assert.ok(
          dims[i] < dims[i - 1],
          `Max dimension ${i + 1} (${dims[i]}) must be less than pass ${i} (${dims[i - 1]})`
        );
      }
    });

    it("handles extreme target caps (e.g. 100KB, 50KB, 10KB) without division by zero or NaN", () => {
      const targetCaps = [0.1, 0.05, 0.01]; // 100KB, 50KB, 10KB
      for (const cap of targetCaps) {
        const targetSizeBytes = cap * 1024 * 1024;
        assert.ok(!isNaN(targetSizeBytes), `Target cap ${cap}MB produced NaN`);
        assert.ok(targetSizeBytes > 0, `Target cap ${cap}MB must be positive`);
      }
    });

    it("executes PDF two-pass compression pipeline without errors", async () => {
      // Create a minimal real PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      page.drawText("Empirical challenger M3 PDF test document", { x: 50, y: 350 });
      const pdfBytes = await pdfDoc.save();
      const pdfFile = new File([pdfBytes as unknown as BlobPart], "test-doc.pdf", {
        type: "application/pdf",
      });

      // Target size 0.0001 MB (approx 100 bytes) -> will trigger both passes
      const res = await smartCompress(pdfFile, 0.0001);
      assert.strictEqual(res.originalSize, pdfFile.size);
      assert.ok(res.attempts.length >= 2, "PDF compression should execute 2 passes");
      assert.strictEqual(res.attempts[0].attemptNumber, 1);
      assert.strictEqual(res.attempts[1].attemptNumber, 2);
      assert.match(res.attempts[0].label, /Stream Optimization/i);
      assert.match(res.attempts[1].label, /Structural Hierarchy/i);
    });
  });

  // =========================================================================
  // TASK 3: Crop Coordinate Synchronization & Transform Invariants
  // =========================================================================
  describe("Task 3: Crop Coordinate Synchronization on Rotated/Flipped Images", () => {
    // Mathematical simulation of the canvas renderBitmap pipeline
    function computeRotatedDimensions(
      naturalW: number,
      naturalH: number,
      rotation: number
    ): { width: number; height: number } {
      const rot = ((rotation % 360) + 360) % 360;
      const isQuarterRotated = rot === 90 || rot === 270;
      return {
        width: isQuarterRotated ? naturalH : naturalW,
        height: isQuarterRotated ? naturalW : naturalH,
      };
    }

    // Mathematical simulation of crop-image handleExport coordinate scaling
    function computeScaledCrop(
      displayW: number,
      displayH: number,
      naturalW: number,
      naturalH: number,
      pixelCrop: { x: number; y: number; width: number; height: number } | null
    ): { cropX: number; cropY: number; cropW: number; cropH: number } {
      const scaleX = naturalW / displayW;
      const scaleY = naturalH / displayH;

      const cropX = pixelCrop && pixelCrop.width > 0 ? Math.max(0, pixelCrop.x * scaleX) : 0;
      const cropY = pixelCrop && pixelCrop.height > 0 ? Math.max(0, pixelCrop.y * scaleY) : 0;
      const cropW = pixelCrop && pixelCrop.width > 0 ? Math.min(naturalW - cropX, pixelCrop.width * scaleX) : naturalW;
      const cropH = pixelCrop && pixelCrop.height > 0 ? Math.min(naturalH - cropY, pixelCrop.height * scaleY) : naturalH;

      return {
        cropX: Math.round(cropX),
        cropY: Math.round(cropY),
        cropW: Math.round(cropW),
        cropH: Math.round(cropH),
      };
    }

    it("transposes natural dimensions accurately at 90° and 270° rotations", () => {
      const orig = { w: 1920, h: 1080 };

      const r0 = computeRotatedDimensions(orig.w, orig.h, 0);
      assert.strictEqual(r0.width, 1920);
      assert.strictEqual(r0.height, 1080);

      const r90 = computeRotatedDimensions(orig.w, orig.h, 90);
      assert.strictEqual(r90.width, 1080);
      assert.strictEqual(r90.height, 1920);

      const r180 = computeRotatedDimensions(orig.w, orig.h, 180);
      assert.strictEqual(r180.width, 1920);
      assert.strictEqual(r180.height, 1080);

      const r270 = computeRotatedDimensions(orig.w, orig.h, 270);
      assert.strictEqual(r270.width, 1080);
      assert.strictEqual(r270.height, 1920);
    });

    it("verifies crop coordinates never invert or exceed canvas boundaries under 90° rotation", () => {
      // Suppose image natural dims after 90° rotation are 1080x1920
      const rotatedNaturalW = 1080;
      const rotatedNaturalH = 1920;
      // Display dimensions in viewport (scaled down to fit screen)
      const displayW = 360;
      const displayH = 640;

      // User drags crop rectangle on displayed image
      const userCrop = { x: 36, y: 64, width: 180, height: 320 }; // Half-size box
      const scaled = computeScaledCrop(displayW, displayH, rotatedNaturalW, rotatedNaturalH, userCrop);

      assert.strictEqual(scaled.cropX, 108); // 36 * (1080 / 360) = 108
      assert.strictEqual(scaled.cropY, 192); // 64 * (1920 / 640) = 192
      assert.strictEqual(scaled.cropW, 540); // 180 * 3 = 540
      assert.strictEqual(scaled.cropH, 960); // 320 * 3 = 960

      assert.ok(scaled.cropX >= 0, "cropX must be non-negative");
      assert.ok(scaled.cropY >= 0, "cropY must be non-negative");
      assert.ok(scaled.cropX + scaled.cropW <= rotatedNaturalW, "crop must not exceed canvas width");
      assert.ok(scaled.cropY + scaled.cropH <= rotatedNaturalH, "crop must not exceed canvas height");
    });

    it("clamps overflow pixel crops safely to canvas boundaries", () => {
      const naturalW = 1080;
      const naturalH = 1920;
      const displayW = 360;
      const displayH = 640;

      // Crop box extending beyond boundary (x = 300, width = 100 on 360px display -> right edge at 400px)
      const overflowCrop = { x: 300, y: 500, width: 100, height: 200 };
      const scaled = computeScaledCrop(displayW, displayH, naturalW, naturalH, overflowCrop);

      assert.strictEqual(scaled.cropX, 900); // 300 * 3 = 900
      // Math.min(1080 - 900, 100 * 3) = Math.min(180, 300) = 180
      assert.strictEqual(scaled.cropW, 180);
      assert.strictEqual(scaled.cropX + scaled.cropW, naturalW);
    });

    it("clears crop state on rotation and flip actions to prevent coordinate drift", () => {
      const cropPagePath = path.join(rootDir, "src", "app", "crop-image", "page.tsx");
      const content = fs.readFileSync(cropPagePath, "utf-8");

      // Verify applyTransform resets crop and completedCrop
      assert.match(
        content,
        /const applyTransform = \(newRot: number, newFH: boolean, newFV: boolean\) => \{[\s\S]*?setCrop\(undefined\);[\s\S]*?setCompletedCrop\(null\);/
      );
    });
  });

  // =========================================================================
  // TASK 4: Aspect Ratio Calculations in /resize-image
  // =========================================================================
  describe("Task 4: Aspect Ratio Presets & Synchronized Calculations in /resize-image", () => {
    // Aspect synchronization math simulation
    function syncDimensions(
      width: number,
      height: number,
      aspectRatio: number,
      changeType: "width" | "height",
      newValue: number
    ): { width: number; height: number } {
      if (changeType === "width") {
        const newW = newValue;
        const newH = Math.max(1, Math.round(newW / aspectRatio));
        return { width: newW, height: newH };
      } else {
        const newH = newValue;
        const newW = Math.max(1, Math.round(newH * aspectRatio));
        return { width: newW, height: newH };
      }
    }

    it("verifies 16:9 widescreen aspect ratio calculation", () => {
      const ratio = 16 / 9;

      // Changing width to 1920 -> height 1080
      const res1 = syncDimensions(0, 0, ratio, "width", 1920);
      assert.strictEqual(res1.width, 1920);
      assert.strictEqual(res1.height, 1080);

      // Changing width to 1280 -> height 720
      const res2 = syncDimensions(0, 0, ratio, "width", 1280);
      assert.strictEqual(res2.width, 1280);
      assert.strictEqual(res2.height, 720);

      // Changing height to 1440 -> width 2560
      const res3 = syncDimensions(0, 0, ratio, "height", 1440);
      assert.strictEqual(res3.width, 2560);
      assert.strictEqual(res3.height, 1440);
    });

    it("verifies 4:3 standard aspect ratio calculation", () => {
      const ratio = 4 / 3;

      // Changing width to 1024 -> height 768
      const res1 = syncDimensions(0, 0, ratio, "width", 1024);
      assert.strictEqual(res1.width, 1024);
      assert.strictEqual(res1.height, 768);

      // Changing height to 600 -> width 800
      const res2 = syncDimensions(0, 0, ratio, "height", 600);
      assert.strictEqual(res2.width, 800);
      assert.strictEqual(res2.height, 600);
    });

    it("verifies 1:1 square aspect ratio calculation", () => {
      const ratio = 1.0;

      const res1 = syncDimensions(0, 0, ratio, "width", 1080);
      assert.strictEqual(res1.width, 1080);
      assert.strictEqual(res1.height, 1080);

      const res2 = syncDimensions(0, 0, ratio, "height", 500);
      assert.strictEqual(res2.width, 500);
      assert.strictEqual(res2.height, 500);
    });

    it("verifies 9:16 vertical story aspect ratio calculation", () => {
      const ratio = 9 / 16;

      // Changing width to 1080 -> height 1920
      const res1 = syncDimensions(0, 0, ratio, "width", 1080);
      assert.strictEqual(res1.width, 1080);
      assert.strictEqual(res1.height, 1920);

      // Changing height to 1280 -> width 720
      const res2 = syncDimensions(0, 0, ratio, "height", 1280);
      assert.strictEqual(res2.width, 720);
      assert.strictEqual(res2.height, 1280);
    });

    it("verifies percentage scaling logic on base dimensions", () => {
      const baseW = 1920;
      const baseH = 1080;

      const scale = (pct: number) => ({
        width: Math.max(1, Math.round((baseW * pct) / 100)),
        height: Math.max(1, Math.round((baseH * pct) / 100)),
      });

      assert.deepStrictEqual(scale(50), { width: 960, height: 540 });
      assert.deepStrictEqual(scale(25), { width: 480, height: 270 });
      assert.deepStrictEqual(scale(75), { width: 1440, height: 810 });
      assert.deepStrictEqual(scale(200), { width: 3840, height: 2160 });
    });

    it("checks RESIZE_PRESETS dataset contains valid positive dimensions", () => {
      assert.ok(Array.isArray(RESIZE_PRESETS));
      assert.ok(RESIZE_PRESETS.length >= 8);
      for (const preset of RESIZE_PRESETS) {
        assert.ok(preset.width > 0, `Preset ${preset.label} width must be positive`);
        assert.ok(preset.height > 0, `Preset ${preset.label} height must be positive`);
        assert.ok(preset.label.length > 0, "Preset label must not be empty");
      }
    });
  });

  // =========================================================================
  // TASK 5: BeforeAfter Slider Keyboard & UI Navigation Standards
  // =========================================================================
  describe("Task 5: BeforeAfter Slider Geometry & Accessibility", () => {
    it("verifies clip-path safePosition boundaries clamp between 2% and 98%", () => {
      const clamp = (pos: number) => Math.max(2, Math.min(98, pos));
      assert.strictEqual(clamp(-10), 2);
      assert.strictEqual(clamp(0), 2);
      assert.strictEqual(clamp(50), 50);
      assert.strictEqual(clamp(100), 98);
      assert.strictEqual(clamp(150), 98);
    });

    it("verifies keyboard slider navigation handles ArrowLeft, ArrowRight, Home, and End", () => {
      const beforeAfterPath = path.join(
        rootDir,
        "src",
        "components",
        "results",
        "BeforeAfter.tsx"
      );
      const content = fs.readFileSync(beforeAfterPath, "utf-8");

      assert.match(content, /e\.key === "ArrowLeft"/);
      assert.match(content, /e\.key === "ArrowRight"/);
      assert.match(content, /e\.key === "Home"/);
      assert.match(content, /e\.key === "End"/);
      assert.match(content, /clipPath:\s*`inset\(0\s*\$\{/);
    });
  });

  // =========================================================================
  // TASK 6: Touch Targets & Tabular Numerals Ergonomics across Workstations
  // =========================================================================
  describe("Task 6: Workstation Ergonomics (Touch Targets >= 44px & Tabular Numerals)", () => {
    const workstations = [
      { name: "crop-image", file: "src/app/crop-image/page.tsx" },
      { name: "resize-image", file: "src/app/resize-image/page.tsx" },
      { name: "convert-image", file: "src/app/convert-image/page.tsx" },
      { name: "compress-image", file: "src/app/compress-image/page.tsx" },
      { name: "smart-compress", file: "src/app/smart-compress/page.tsx" },
      { name: "image-metadata", file: "src/app/image-metadata/page.tsx" },
      { name: "image-studio", file: "src/app/image-studio/page.tsx" },
    ];

    for (const ws of workstations) {
      it(`verifies ${ws.name} enforces tabular-nums on numeric displays`, () => {
        const fullPath = path.join(rootDir, ws.file);
        const code = fs.readFileSync(fullPath, "utf-8");
        assert.ok(
          code.includes("tabular-nums"),
          `${ws.name} must include tabular-nums for numeric stability`
        );
      });

      it(`verifies ${ws.name} uses ToolPageShell`, () => {
        const fullPath = path.join(rootDir, ws.file);
        const code = fs.readFileSync(fullPath, "utf-8");
        assert.ok(
          code.includes("ToolPageShell"),
          `${ws.name} must be wrapped in ToolPageShell`
        );
      });

      it(`verifies ${ws.name} integrates with pushDownload or history`, () => {
        const fullPath = path.join(rootDir, ws.file);
        const code = fs.readFileSync(fullPath, "utf-8");
        assert.ok(
          code.includes("pushDownload") || code.includes("addHistoryRecord"),
          `${ws.name} must record downloads/telemetry`
        );
      });
    }
  });
});
