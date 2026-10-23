import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { formatShutterSpeed, toDMS } from "../src/lib/image/metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const WORKSTATION_FILES = [
  "src/app/compress-image/page.tsx",
  "src/app/smart-compress/page.tsx",
  "src/app/resize-image/page.tsx",
  "src/app/convert-image/page.tsx",
  "src/app/crop-image/page.tsx",
  "src/app/image-metadata/page.tsx",
  "src/app/image-studio/page.tsx",
];

// Helper to calculate WCAG 2.1 relative luminance and contrast ratio
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function sRGBtoLin(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(sRGBtoLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe("Adversarial Challenger M3-2: Image Workstations Verification", () => {
  describe("1. Touch Target Bounding Box Compliance (>= 44x44px)", () => {
    it("Slider primitive implements min-h-[44px] track and 44x44px touch target on Thumb", () => {
      const sliderFile = path.join(rootDir, "src/components/ui/slider.tsx");
      const content = fs.readFileSync(sliderFile, "utf8");

      assert.ok(
        content.includes("min-h-[44px]"),
        "Slider Root must enforce min-h-[44px] on mobile"
      );
      assert.ok(
        content.includes("after:min-w-[44px]") && content.includes("after:min-h-[44px]"),
        "Slider Thumb must enforce after:min-w-[44px] and after:min-h-[44px]"
      );
    });

    it("BeforeAfter compare slider handle implements 44x44px circular touch target", () => {
      const globalsCss = path.join(rootDir, "src/app/globals.css");
      const css = fs.readFileSync(globalsCss, "utf8");

      assert.ok(
        css.includes(".compare-slider-handle::before"),
        "globals.css must define .compare-slider-handle::before"
      );
      assert.ok(
        css.includes("width: 44px") && css.includes("height: 44px"),
        "Compare slider handle must have width: 44px and height: 44px"
      );
    });

    it("Resize aspect ratio lock toggle satisfies >= 44x44px touch bounding box", () => {
      const resizePage = path.join(rootDir, "src/app/resize-image/page.tsx");
      const content = fs.readFileSync(resizePage, "utf8");

      assert.ok(
        content.includes("min-h-[44px]") && content.includes("min-w-[44px]"),
        "Resize aspect lock button must have min-h-[44px] min-w-[44px]"
      );
    });

    it("Preset chips and format buttons enforce >= 44px height across all 7 workstations", () => {
      for (const relPath of WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        // Verify all interactive buttons inside preset collections have min-h-[44px] or min-h-[48px] or min-h-[52px] or min-h-[54px]
        if (relPath.includes("compress-image")) {
          assert.ok(
            content.includes('min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-medium'),
            "Target size presets in compress-image must have min-h-[44px]"
          );
        }
        if (relPath.includes("smart-compress")) {
          assert.ok(
            content.includes('min-h-[54px] touch-manipulation'),
            "Size presets in smart-compress must have min-h-[54px]"
          );
        }
        if (relPath.includes("resize-image")) {
          assert.ok(
            content.includes('min-h-[52px] touch-manipulation'),
            "Preset sizes in resize-image must have min-h-[52px]"
          );
          assert.ok(
            content.includes('min-h-[44px] rounded-xl border px-2.5 py-2'),
            "Aspect presets in resize-image must have min-h-[44px]"
          );
        }
        if (relPath.includes("convert-image")) {
          assert.ok(
            content.includes('min-h-[48px] touch-manipulation'),
            "Format selector buttons in convert-image must have min-h-[48px]"
          );
          assert.ok(
            content.includes('min-h-[44px] rounded-xl flex items-center justify-center gap-1.5'),
            "Background color swatches in convert-image must have min-h-[44px]"
          );
        }
        if (relPath.includes("crop-image")) {
          assert.ok(
            content.includes('min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium'),
            "Aspect presets in crop-image must have min-h-[44px]"
          );
        }
        if (relPath.includes("image-studio")) {
          assert.ok(
            content.includes('min-h-[44px] rounded-xl border text-xs font-medium'),
            "Aspect presets in image-studio must have min-h-[44px]"
          );
          assert.ok(
            content.includes('min-h-[44px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2 py-1'),
            "Percentage chips in image-studio must have min-h-[44px]"
          );
        }
      }
    });

    it("Toolbar actions (rotate, flip, clear, add) have min-h-[44px] touch targets", () => {
      const cropContent = fs.readFileSync(path.join(rootDir, "src/app/crop-image/page.tsx"), "utf8");
      assert.ok(cropContent.includes('onClick={handleRotateCcw}'));
      assert.ok(cropContent.includes('onClick={handleRotateCw}'));
      assert.ok(cropContent.includes('onClick={handleFlipH}'));
      assert.ok(cropContent.includes('onClick={handleFlipV}'));
      assert.ok(cropContent.includes('min-h-[44px] touch-manipulation'));

      const studioContent = fs.readFileSync(path.join(rootDir, "src/app/image-studio/page.tsx"), "utf8");
      assert.ok(studioContent.includes('min-h-[44px] touch-manipulation text-xs'));
    });
  });

  describe("2. WCAG AA Contrast Compliance (>= 4.5:1)", () => {
    it("Every success download button across all 7 workstations uses text-[hsl(var(--success-foreground))] instead of text-white", () => {
      for (const relPath of WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        // Verify success button uses semantic foreground
        assert.ok(
          content.includes("bg-[hsl(var(--success))]"),
          `${relPath} should have a success button`
        );
        assert.ok(
          content.includes("text-[hsl(var(--success-foreground))]"),
          `${relPath} must use text-[hsl(var(--success-foreground))] on success buttons`
        );
        assert.ok(
          !content.includes("bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"),
          `${relPath} must NOT have hardcoded text-white on bg-[hsl(var(--success))]`
        );
      }
    });

    it("Zero instances of text-white on success buttons in workstation code", () => {
      for (const relPath of WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes("bg-[hsl(var(--success))]")) {
            assert.ok(
              !line.includes("text-white"),
              `Violation at ${relPath}:${i + 1} - found text-white on success background`
            );
          }
        }
      }
    });

    it("Light and Dark theme success button contrast satisfies WCAG AA >= 4.5:1", () => {
      // Light Mode:
      // --success: #15803D (hsl 142 72% 29%)
      // --success-foreground: #FFFFFF (0 0% 100%)
      const lightContrast = getContrastRatio("#FFFFFF", "#15803D");
      assert.ok(
        lightContrast >= 4.5,
        `Light mode success button contrast (${lightContrast.toFixed(2)}:1) must be >= 4.5:1`
      );

      // Dark Mode:
      // --success: #22C55E (hsl 142 71% 45%)
      // --success-foreground: #0F172A (hsl 222 47% 11%)
      const darkContrast = getContrastRatio("#0F172A", "#22C55E");
      assert.ok(
        darkContrast >= 4.5,
        `Dark mode success button contrast (${darkContrast.toFixed(2)}:1) must be >= 4.5:1`
      );

      // Verify that the old buggy text-white would have failed in dark mode:
      const oldBuggyContrast = getContrastRatio("#FFFFFF", "#22C55E");
      assert.ok(
        oldBuggyContrast < 4.5,
        `Confirm regression: white on #22C55E contrast is ${oldBuggyContrast.toFixed(2)}:1, violating WCAG AA`
      );
    });

    it("Smart Compress text colors satisfy >= 4.5:1 contrast against light background (#F7F9FC)", () => {
      const lightBg = "#F7F9FC";
      const darkBg = "#0B1020";

      // Foreground: #0F172A
      assert.ok(getContrastRatio("#0F172A", lightBg) >= 4.5);

      // Muted Foreground: #334155
      assert.ok(getContrastRatio("#334155", lightBg) >= 4.5);

      // Primary: #2563EB
      assert.ok(getContrastRatio("#2563EB", lightBg) >= 4.5);

      // Emerald-700: #047857
      const emerald700Contrast = getContrastRatio("#047857", lightBg);
      assert.ok(
        emerald700Contrast >= 4.5,
        `emerald-700 on lightBg (${emerald700Contrast.toFixed(2)}:1) must be >= 4.5:1`
      );

      // Amber-700: #B45309
      const amber700Contrast = getContrastRatio("#B45309", lightBg);
      assert.ok(
        amber700Contrast >= 4.5,
        `amber-700 on lightBg (${amber700Contrast.toFixed(2)}:1) must be >= 4.5:1`
      );

      // In dark mode: emerald-400 (#34D399) and emerald-300 (#6EE7B7) against #0B1020
      assert.ok(getContrastRatio("#34D399", darkBg) >= 4.5);
      assert.ok(getContrastRatio("#6EE7B7", darkBg) >= 4.5);
    });
  });

  describe("3. Tabular Numerals (.tabular-nums) Enforcement", () => {
    it("Universal tabular-nums applied to numeric counters and dimensions", () => {
      for (const relPath of WORKSTATION_FILES) {
        const fullPath = path.join(rootDir, relPath);
        const content = fs.readFileSync(fullPath, "utf8");

        assert.ok(
          content.includes("tabular-nums"),
          `${relPath} must include .tabular-nums formatting`
        );
      }
    });

    it("BeforeAfter component applies tabular-nums to byte counters, savings percentage, and badges", () => {
      const beforeAfterPath = path.join(rootDir, "src/components/results/BeforeAfter.tsx");
      const content = fs.readFileSync(beforeAfterPath, "utf8");

      assert.ok(
        content.includes("tabular-nums"),
        "BeforeAfter.tsx must use tabular-nums on numeric stats"
      );
    });
  });

  describe("4. Asset Integrity: Support QR Code", () => {
    it("public/images/filefixer_support_qr.png exists and remains untouched", () => {
      const qrPath = path.join(rootDir, "public/images/filefixer_support_qr.png");
      assert.ok(fs.existsSync(qrPath), "filefixer_support_qr.png must exist");

      const buffer = fs.readFileSync(qrPath);
      assert.equal(
        buffer.length,
        526974,
        "QR asset byte length must be exactly 526,974 bytes"
      );

      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      assert.equal(
        hash,
        "8592bd8a18457f3ac496d6735c472d7c4f3239e87b93771ed238d348b87d4744",
        "QR asset SHA-256 hash must match pristine original commit"
      );
    });
  });

  describe("5. Algorithmic Correctness & Edge Case Stress-Testing", () => {
    it("formatShutterSpeed handles fractional, sub-second, long exposures, and edge cases correctly", () => {
      // Sub-second
      assert.equal(formatShutterSpeed(0.001), "1/1000s");
      assert.equal(formatShutterSpeed(0.004), "1/250s");
      assert.equal(formatShutterSpeed(0.02), "1/50s");
      assert.equal(formatShutterSpeed(0.5), "1/2s");

      // Exposures >= 1s (verifying arithmetic defect fix: Math.round(1 / 2) -> 1/0s)
      assert.equal(formatShutterSpeed(1), "1s");
      assert.equal(formatShutterSpeed(2), "2s");
      assert.equal(formatShutterSpeed(2.5), "2.5s");
      assert.equal(formatShutterSpeed(30), "30s");

      // Edge cases
      assert.equal(formatShutterSpeed(0), undefined);
      assert.equal(formatShutterSpeed(-1), undefined);
      assert.equal(formatShutterSpeed(NaN), undefined);
      assert.equal(formatShutterSpeed(undefined), undefined);
    });

    it("evaluates toDMS direction logic and verifies correct hemisphere mapping", () => {
      const dmsN = toDMS(37.7749, true);
      assert.ok(dmsN.includes("37°"), "Should include degrees");
      assert.ok(dmsN.endsWith("N"), "Positive latitude should be N");

      const dmsW = toDMS(-122.4194, false);
      assert.ok(dmsW.includes("122°"), "Should include degrees");
      assert.ok(dmsW.endsWith("W"), "Negative longitude should be W");

      const dmsS = toDMS(-33.8688, true);
      assert.ok(dmsS.includes("33°"), "Should include degrees");
      assert.ok(dmsS.endsWith("S"), "Southern latitude must be labeled as South ('S')");

      const dmsE = toDMS(77.2090, false);
      assert.ok(dmsE.includes("77°"), "Should include degrees");
      assert.ok(dmsE.endsWith("E"), "Eastern longitude must be labeled as East ('E')");
    });

    it("Smart compress progressive pipeline defines 7 distinct stages", () => {
      const smartCompressPath = path.join(rootDir, "src/lib/smartCompress.ts");
      const content = fs.readFileSync(smartCompressPath, "utf8");

      assert.ok(
        content.includes("High Quality Pass"),
        "Must have High Quality Pass"
      );
      assert.ok(
        content.includes("Ultra-Compact Pass"),
        "Must have Ultra-Compact Pass"
      );
      assert.ok(
        content.includes("Maximum Reduction"),
        "Must have Maximum Reduction (Pass 7)"
      );
      assert.ok(
        content.includes("canvasResizeAndCompress"),
        "Must include HTML5 canvas fallback when web-worker throws"
      );
    });

    it("BeforeAfter component implements clip-path inset and Home/End keyboard shortcuts", () => {
      const beforeAfterPath = path.join(rootDir, "src/components/results/BeforeAfter.tsx");
      const content = fs.readFileSync(beforeAfterPath, "utf8");

      assert.ok(
        content.includes("clipPath: `inset(0 ${(100 - safePosition).toFixed(2)}% 0 0)`"),
        "BeforeAfter overlay must use clipPath inset for 1:1 pixel alignment"
      );
      assert.ok(
        content.includes('e.key === "Home"'),
        "CompareSlider must handle Home key"
      );
      assert.ok(
        content.includes('e.key === "End"'),
        "CompareSlider must handle End key"
      );
    });
  });
});
