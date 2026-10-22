import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// --- Color & Luminance Calculations (WCAG 2.1 Specification) ---
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function parseHsl(str: string): [number, number, number] {
  const parts = str.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace("%", ""));
  const l = parseFloat(parts[2].replace("%", ""));
  return hslToRgb(h, s, l);
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function getContrast(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const l1 = relLuminance(rgb1);
  const l2 = relLuminance(rgb2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

function extractTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const lines = block.split("\n");
  for (const line of lines) {
    const m = line.match(/--([a-z0-9-]+):\s*([^;]+);/);
    if (m) {
      const val = m[2].trim().replace(/\/\*.*?\*\//g, "").trim();
      if (/^[0-9.]+\s+[0-9.]+%?\s+[0-9.]+%?$/.test(val)) {
        tokens[m[1]] = val;
      }
    }
  }
  return tokens;
}

describe("Empirical Challenger M1 Iteration 2: Contrast & Layout Stress Suite", () => {
  const cssPath = path.join(rootDir, "src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  const darkMatch = css.match(/\.dark\s*\{([\s\S]*?)\}/);

  assert.ok(rootMatch, "Must find :root selector in globals.css");
  assert.ok(darkMatch, "Must find .dark selector in globals.css");

  const lightTokens = extractTokens(rootMatch[1]);
  const darkTokens = extractTokens(darkMatch[1]);

  // =========================================================================
  // TASK 1: Button variant="accent" text contrast in light and dark mode
  // =========================================================================
  describe("Task 1: Button variant='accent' text contrast against WCAG AA formulas", () => {
    it("1.1 Light mode Button variant='accent' text contrast >= 4.5:1", () => {
      const buttonPath = path.join(rootDir, "src/components/ui/button.tsx");
      const buttonContent = fs.readFileSync(buttonPath, "utf-8");

      assert.ok(
        buttonContent.includes("accent:"),
        "button.tsx must define accent variant"
      );

      const lightFgToken = lightTokens["accent-subtle-foreground"] || lightTokens["foreground"];
      const lightBgToken = lightTokens["accent-subtle"];
      assert.ok(lightFgToken, "light mode must have accent-subtle-foreground or foreground");
      assert.ok(lightBgToken, "light mode must have accent-subtle");

      const crLight = getContrast(parseHsl(lightFgToken), parseHsl(lightBgToken));
      console.log(`[Task 1.1] Light Button accent contrast: ${crLight.toFixed(3)}:1`);

      assert.ok(
        crLight >= 4.5,
        `Light mode accent button contrast ${crLight.toFixed(2)}:1 must be >= 4.5:1`
      );
    });

    it("1.2 Dark mode Button variant='accent' text contrast >= 4.5:1", () => {
      const darkFgToken = darkTokens["accent-subtle-foreground"] || darkTokens["primary-foreground"];
      const darkBgToken = darkTokens["accent-subtle"];
      assert.ok(darkFgToken, "dark mode must have accent-subtle-foreground or primary-foreground");
      assert.ok(darkBgToken, "dark mode must have accent-subtle");

      const crDark = getContrast(parseHsl(darkFgToken), parseHsl(darkBgToken));
      console.log(`[Task 1.2] Dark Button accent contrast: ${crDark.toFixed(3)}:1`);

      assert.ok(
        crDark >= 4.5,
        `Dark mode accent button contrast ${crDark.toFixed(2)}:1 must be >= 4.5:1`
      );
    });
  });

  // =========================================================================
  // TASK 2: Hover states on dark primary buttons do not regress contrast
  // =========================================================================
  describe("Task 2: Hover states on dark primary buttons", () => {
    it("2.1 DownloadDock & DownloadCenterModal re-download buttons use semantic primary-foreground on hover", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      const modalPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
      const modalContent = fs.readFileSync(modalPath, "utf-8");

      // Verify no hardcoded hover:text-white on primary button
      assert.ok(
        !dockContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"),
        "DownloadDock must not use hardcoded hover:text-white on primary button"
      );
      assert.ok(
        !modalContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"),
        "DownloadCenterModal must not use hardcoded hover:text-white on primary button"
      );

      // Verify contrast of primary-foreground on primary in dark mode
      const crHover = getContrast(
        parseHsl(darkTokens["primary-foreground"]),
        parseHsl(darkTokens["primary"])
      );
      console.log(`[Task 2.1] Dark primary button hover contrast: ${crHover.toFixed(3)}:1`);
      assert.ok(
        crHover >= 4.5,
        `Dark primary button hover contrast ${crHover.toFixed(2)}:1 must be >= 4.5:1`
      );
    });

    it("2.2 Application shell WorkspaceDrawer must use semantic primary-foreground on hover without contrast regression", () => {
      const drawerPath = path.join(rootDir, "src/components/workspace/WorkspaceDrawer.tsx");
      const drawerContent = fs.readFileSync(drawerPath, "utf-8");

      // Check whether WorkspaceDrawer line 384 regresses contrast with hover:text-white
      const hasRegressedHover = drawerContent.includes(
        "hover:bg-[hsl(var(--primary))] hover:text-white"
      );

      // Calculate the contrast of white on dark primary
      const crWhiteOnDarkPrimary = getContrast(
        [255, 255, 255],
        parseHsl(darkTokens["primary"])
      );
      console.log(
        `[Task 2.2] Contrast of white on dark primary in WorkspaceDrawer: ${crWhiteOnDarkPrimary.toFixed(3)}:1`
      );

      assert.strictEqual(
        hasRegressedHover,
        false,
        `WorkspaceDrawer line 384 regresses contrast to ${crWhiteOnDarkPrimary.toFixed(2)}:1 on hover in dark mode (fails WCAG AA 4.5:1)`
      );

      // Affirmative assertion: WorkspaceDrawer must use semantic hover:text-[hsl(var(--primary-foreground))]
      assert.ok(
        drawerContent.includes("hover:text-[hsl(var(--primary-foreground))]"),
        "WorkspaceDrawer download button must use semantic hover:text-[hsl(var(--primary-foreground))]"
      );

      // Verify semantic hover contrast meets or exceeds WCAG AA (>= 4.5:1)
      const crSemanticHover = getContrast(
        parseHsl(darkTokens["primary-foreground"]),
        parseHsl(darkTokens["primary"])
      );
      console.log(`[Task 2.2] Dark primary button hover contrast with semantic token: ${crSemanticHover.toFixed(3)}:1`);
      assert.ok(
        crSemanticHover >= 4.5,
        `Dark primary button hover contrast ${crSemanticHover.toFixed(2)}:1 must be >= 4.5:1`
      );
    });
  });

  // =========================================================================
  // TASK 3: Dark mode destructive text contrast on dark background (#0B1020) and surfaces
  // =========================================================================
  describe("Task 3: Dark mode destructive text contrast on dark background and surfaces", () => {
    it("3.1 Destructive text on dark background (#0B1020) >= 4.5:1", () => {
      const crDarkBg = getContrast(
        parseHsl(darkTokens["destructive"]),
        parseHsl(darkTokens["background"])
      );
      console.log(`[Task 3.1] Dark destructive on background: ${crDarkBg.toFixed(3)}:1`);
      assert.ok(
        crDarkBg >= 4.5,
        `Dark destructive on #0B1020 ${crDarkBg.toFixed(2)}:1 must be >= 4.5:1`
      );
    });

    it("3.2 Destructive text on dark card surface (#111827) >= 4.5:1", () => {
      const crDarkCard = getContrast(
        parseHsl(darkTokens["destructive"]),
        parseHsl(darkTokens["card"])
      );
      console.log(`[Task 3.2] Dark destructive on card: ${crDarkCard.toFixed(3)}:1`);
      assert.ok(
        crDarkCard >= 4.5,
        `Dark destructive on card ${crDarkCard.toFixed(2)}:1 must be >= 4.5:1`
      );
    });

    it("3.3 Destructive text on dark surface-secondary (#182235) >= 4.5:1", () => {
      const crDarkSec = getContrast(
        parseHsl(darkTokens["destructive"]),
        parseHsl(darkTokens["surface-secondary"])
      );
      console.log(`[Task 3.3] Dark destructive on surface-secondary: ${crDarkSec.toFixed(3)}:1`);
      assert.ok(
        crDarkSec >= 4.5,
        `Dark destructive on surface-secondary ${crDarkSec.toFixed(2)}:1 must be >= 4.5:1`
      );
    });
  });

  // =========================================================================
  // TASK 4: Mobile positioning of SupportPrompt and DownloadDock on viewports <640px
  // =========================================================================
  describe("Task 4: Mobile positioning geometry and collision oracle (<640px)", () => {
    it("4.1 Verify physical clearance between SupportPrompt and DownloadDock when active deliveries exist", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      const promptPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const promptContent = fs.readFileSync(promptPath, "utf-8");

      // Extract mobile bottom offsets
      // DownloadDock mobile bottom: bottom-20 -> 5rem -> 80px
      assert.ok(dockContent.includes("bottom-20"), "DownloadDock must be anchored at bottom-20 on mobile");
      const dockBottomPx = 5 * 16; // 80px

      // DownloadDock height components on mobile:
      // 1. Header: px-4 py-2.5, child buttons h-11 (44px) + py-2.5 (20px) + border-b (1px) = 65px
      const dockHeaderHeightPx = 44 + 20 + 1; // 65px
      // 2. Item list container: max-h-40 (160px)
      // When multiple deliveries exist, list hits max-h-40 (160px)
      const dockListMaxHeightPx = 10 * 16; // 160px
      // 3. Outer borders: 2px
      const dockOuterBordersPx = 2;

      const dockTopCoordinatePx = dockBottomPx + dockHeaderHeightPx + dockListMaxHeightPx + dockOuterBordersPx;
      console.log(`[Task 4.1] DownloadDock top coordinate from viewport bottom: ${dockTopCoordinatePx}px`);

      // SupportPrompt mobile bottom offset when hasDownloads is true:
      // Must be at least 320px (bottom-80 or bottom-[320px]) to provide positive clearance over 307px dock
      assert.ok(
        promptContent.includes("bottom-80") || promptContent.includes("bottom-[320px]"),
        "SupportPrompt must specify bottom-80 (20rem = 320px) or bottom-[320px] when hasDownloads is true to clear DownloadDock (307px)"
      );

      const promptBottomRemMatch = promptContent.match(/hasDownloads\s*\?\s*"bottom-([0-9]+|\[[0-9]+px\])/);
      assert.ok(promptBottomRemMatch, "SupportPrompt must dynamically adjust bottom offset when hasDownloads is true");

      let promptBottomPx = 0;
      if (promptBottomRemMatch[1].startsWith("[")) {
        promptBottomPx = parseInt(promptBottomRemMatch[1].replace(/[\[\]px]/g, ""), 10);
      } else {
        promptBottomPx = parseInt(promptBottomRemMatch[1], 10) * 4; // tailwind spacing: 1 unit = 0.25rem = 4px
      }
      console.log(`[Task 4.1] SupportPrompt bottom coordinate from viewport bottom: ${promptBottomPx}px`);

      const clearance = promptBottomPx - dockTopCoordinatePx;
      console.log(`[Task 4.1] Measured clearance: ${clearance}px`);

      // Requirement: Zero collision or occlusion (clearance must be >= 0px)
      assert.ok(
        clearance >= 0,
        `SupportPrompt (bottom: ${promptBottomPx}px) collides with DownloadDock (top: ${dockTopCoordinatePx}px) by ${Math.abs(clearance)}px on viewports <640px`
      );
    });
  });
});
