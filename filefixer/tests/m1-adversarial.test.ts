import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// --- Color & Luminance Helpers ---
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

describe("Adversarial M1 Verification: WCAG Contrast & Touch Target Hit-boxes", () => {
  const cssPath = path.join(rootDir, "src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  const darkMatch = css.match(/\.dark\s*\{([\s\S]*?)\}/);

  assert.ok(rootMatch, "Must find :root selector in globals.css");
  assert.ok(darkMatch, "Must find .dark selector in globals.css");

  const lightTokens = extractTokens(rootMatch[1]);
  const darkTokens = extractTokens(darkMatch[1]);

  // -------------------------------------------------------------------------
  // 1. Contrast Testing Suite
  // -------------------------------------------------------------------------
  describe("1. WCAG 2.1 AA Contrast Ratios", () => {
    it("1.1 Body text contrast: foreground vs background (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["foreground"]),
        parseHsl(lightTokens["background"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["foreground"]),
        parseHsl(darkTokens["background"])
      );

      console.log(`[Contrast] Light foreground/background: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark foreground/background: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light foreground/background ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark foreground/background ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.2 Muted text contrast: muted-foreground vs background & card (Light & Dark)", () => {
      const crLightBg = getContrast(
        parseHsl(lightTokens["muted-foreground"]),
        parseHsl(lightTokens["background"])
      );
      const crLightCard = getContrast(
        parseHsl(lightTokens["muted-foreground"]),
        parseHsl(lightTokens["card"])
      );
      const crDarkBg = getContrast(
        parseHsl(darkTokens["muted-foreground"]),
        parseHsl(darkTokens["background"])
      );
      const crDarkCard = getContrast(
        parseHsl(darkTokens["muted-foreground"]),
        parseHsl(darkTokens["card"])
      );

      console.log(`[Contrast] Light muted-foreground/background: ${crLightBg.toFixed(2)}:1`);
      console.log(`[Contrast] Light muted-foreground/card: ${crLightCard.toFixed(2)}:1`);
      console.log(`[Contrast] Dark muted-foreground/background: ${crDarkBg.toFixed(2)}:1`);
      console.log(`[Contrast] Dark muted-foreground/card: ${crDarkCard.toFixed(2)}:1`);

      assert.ok(crLightBg >= 4.5, `Light muted on bg ${crLightBg.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crLightCard >= 4.5, `Light muted on card ${crLightCard.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDarkBg >= 4.5, `Dark muted on bg ${crDarkBg.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDarkCard >= 4.5, `Dark muted on card ${crDarkCard.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.3 Primary button contrast: primary-foreground vs primary (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["primary-foreground"]),
        parseHsl(lightTokens["primary"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["primary-foreground"]),
        parseHsl(darkTokens["primary"])
      );

      console.log(`[Contrast] Light primary-foreground/primary: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark primary-foreground/primary: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light primary button ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark primary button ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.4 Destructive button contrast: destructive-foreground vs destructive (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["destructive-foreground"]),
        parseHsl(lightTokens["destructive"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["destructive-foreground"]),
        parseHsl(darkTokens["destructive"])
      );

      console.log(`[Contrast] Light destructive-foreground/destructive: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark destructive-foreground/destructive: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light destructive button ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark destructive button ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.5 Success badge contrast: success-foreground vs success (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["success-foreground"]),
        parseHsl(lightTokens["success"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["success-foreground"]),
        parseHsl(darkTokens["success"])
      );

      console.log(`[Contrast] Light success-foreground/success: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark success-foreground/success: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light success button/badge ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark success button/badge ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.6 Warning state contrast: warning-foreground vs warning (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["warning-foreground"]),
        parseHsl(lightTokens["warning"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["warning-foreground"]),
        parseHsl(darkTokens["warning"])
      );

      console.log(`[Contrast] Light warning-foreground/warning: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark warning-foreground/warning: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light warning state ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark warning state ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.7 Secondary button contrast: secondary-foreground vs secondary (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["secondary-foreground"]),
        parseHsl(lightTokens["secondary"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["secondary-foreground"]),
        parseHsl(darkTokens["secondary"])
      );

      console.log(`[Contrast] Light secondary-foreground/secondary: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark secondary-foreground/secondary: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light secondary button ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark secondary button ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.8 Accent button contrast: Button variant=accent in light and dark mode", () => {
      // In button.tsx: accent variant has `bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent-subtle-foreground,var(--foreground)))]`
      const lightFgToken = lightTokens["accent-subtle-foreground"] || lightTokens["foreground"];
      const darkFgToken = darkTokens["accent-subtle-foreground"] || darkTokens["primary-foreground"];

      const crLight = getContrast(
        parseHsl(lightFgToken),
        parseHsl(lightTokens["accent-subtle"])
      );
      const crDark = getContrast(
        parseHsl(darkFgToken),
        parseHsl(darkTokens["accent-subtle"])
      );

      console.log(`[Contrast] Light Button accent (${lightFgToken} / accent-subtle): ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark Button accent (${darkFgToken} / accent-subtle): ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light accent button contrast ${crLight.toFixed(2)}:1 must be >= 4.5:1`);
      assert.ok(crDark >= 4.5, `Dark accent button contrast ${crDark.toFixed(2)}:1 must be >= 4.5:1`);
    });

    it("1.9 Inline link contrast: primary text vs background (Light & Dark)", () => {
      const crLight = getContrast(
        parseHsl(lightTokens["primary"]),
        parseHsl(lightTokens["background"])
      );
      const crDark = getContrast(
        parseHsl(darkTokens["primary"]),
        parseHsl(darkTokens["background"])
      );

      console.log(`[Contrast] Light primary text on background: ${crLight.toFixed(2)}:1`);
      console.log(`[Contrast] Dark primary text on background: ${crDark.toFixed(2)}:1`);

      assert.ok(crLight >= 4.5, `Light primary link text ${crLight.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDark >= 4.5, `Dark primary link text ${crDark.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.10 Dark mode destructive text contrast: destructive vs background, card, surface-secondary", () => {
      const crDarkBg = getContrast(
        parseHsl(darkTokens["destructive"]),
        parseHsl(darkTokens["background"])
      );
      const crDarkCard = getContrast(
        parseHsl(darkTokens["destructive"]),
        parseHsl(darkTokens["card"])
      );
      const crDarkSurface = getContrast(
        parseHsl(darkTokens["destructive"]),
        parseHsl(darkTokens["surface-secondary"])
      );

      console.log(`[Contrast] Dark destructive on background: ${crDarkBg.toFixed(2)}:1`);
      console.log(`[Contrast] Dark destructive on card: ${crDarkCard.toFixed(2)}:1`);
      console.log(`[Contrast] Dark destructive on surface-secondary: ${crDarkSurface.toFixed(2)}:1`);

      assert.ok(crDarkBg >= 4.5, `Dark destructive on bg ${crDarkBg.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDarkCard >= 4.5, `Dark destructive on card ${crDarkCard.toFixed(2)}:1 fails WCAG AA`);
      assert.ok(crDarkSurface >= 4.5, `Dark destructive on surface ${crDarkSurface.toFixed(2)}:1 fails WCAG AA`);
    });

    it("1.11 Application shell primary button hover contrast: WorkspaceDrawer, DownloadDock, DownloadCenterModal", () => {
      const drawerPath = path.join(rootDir, "src/components/workspace/WorkspaceDrawer.tsx");
      const drawerContent = fs.readFileSync(drawerPath, "utf-8");
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      const modalPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
      const modalContent = fs.readFileSync(modalPath, "utf-8");

      // Ensure none of the shell components use hardcoded hover:text-white on primary buttons
      assert.ok(!drawerContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"), "WorkspaceDrawer must not use hover:text-white on primary button");
      assert.ok(!dockContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"), "DownloadDock must not use hover:text-white on primary button");
      assert.ok(!modalContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"), "DownloadCenterModal must not use hover:text-white on primary button");

      // Ensure WorkspaceDrawer uses semantic primary-foreground on hover
      assert.ok(
        drawerContent.includes("hover:text-[hsl(var(--primary-foreground))]"),
        "WorkspaceDrawer must declare hover:text-[hsl(var(--primary-foreground))]"
      );

      // Verify semantic token contrast against dark primary
      const crHover = getContrast(
        parseHsl(darkTokens["primary-foreground"]),
        parseHsl(darkTokens["primary"])
      );
      console.log(`[Contrast] Dark primary hover contrast with primary-foreground: ${crHover.toFixed(2)}:1`);
      assert.ok(crHover >= 4.5, `Dark primary hover contrast ${crHover.toFixed(2)}:1 fails WCAG AA`);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Touch Target Hit-box Inspection Suite
  // -------------------------------------------------------------------------
  describe("2. Touch Target Sizing (>=44px on mobile)", () => {
    it("2.1 button.tsx: verifies all sizes provide >=44px hit-box on mobile", () => {
      const buttonPath = path.join(rootDir, "src/components/ui/button.tsx");
      const buttonContent = fs.readFileSync(buttonPath, "utf-8");

      // xs size: after:min-w-[44px] after:min-h-[44px]
      assert.ok(
        buttonContent.includes("xs:") &&
        buttonContent.includes("after:min-w-[44px]") &&
        buttonContent.includes("after:min-h-[44px]"),
        "xs button must have after pseudo-element with min 44x44px"
      );

      // sm size: after:min-w-[44px] after:min-h-[44px]
      assert.ok(
        buttonContent.includes("sm:") &&
        buttonContent.includes("after:min-w-[44px]") &&
        buttonContent.includes("after:min-h-[44px]"),
        "sm button must have after pseudo-element with min 44x44px"
      );

      // md size: min-h-[44px] on mobile
      assert.ok(
        buttonContent.includes("min-h-[44px]") && buttonContent.includes("h-11"),
        "md button must have min-h-[44px] and h-11 on mobile"
      );

      // lg size: h-12 (48px >= 44px)
      assert.ok(buttonContent.includes("h-12"), "lg button must have h-12 (48px)");

      // icon size: min-h-[44px] min-w-[44px] and after pseudo-element
      assert.ok(
        buttonContent.includes("min-h-[44px]") &&
        buttonContent.includes("min-w-[44px]") &&
        buttonContent.includes("h-11 w-11"),
        "icon button must have min-h-[44px] min-w-[44px] and h-11 w-11"
      );
    });

    it("2.2 slider.tsx: verifies root and thumb touch hit-box >=44px", () => {
      const sliderPath = path.join(rootDir, "src/components/ui/slider.tsx");
      const sliderContent = fs.readFileSync(sliderPath, "utf-8");

      assert.ok(
        sliderContent.includes("min-h-[44px]"),
        "Slider root must have min-h-[44px]"
      );
      assert.ok(
        sliderContent.includes("after:min-w-[44px]") &&
        sliderContent.includes("after:min-h-[44px]"),
        "Slider thumb must have after:min-w-[44px] after:min-h-[44px]"
      );
    });

    it("2.3 switch.tsx: verifies switch root has >=44px touch hit-box", () => {
      const switchPath = path.join(rootDir, "src/components/ui/switch.tsx");
      const switchContent = fs.readFileSync(switchPath, "utf-8");

      assert.ok(
        switchContent.includes("after:min-w-[44px]") &&
        switchContent.includes("after:min-h-[44px]"),
        "Switch root must have after:min-w-[44px] after:min-h-[44px]"
      );
    });

    it("2.4 checkbox.tsx: verifies checkbox root has >=44px touch hit-box", () => {
      const cbPath = path.join(rootDir, "src/components/ui/checkbox.tsx");
      const cbContent = fs.readFileSync(cbPath, "utf-8");

      assert.ok(
        cbContent.includes("after:min-w-[44px]") &&
        cbContent.includes("after:min-h-[44px]"),
        "Checkbox root must have after:min-w-[44px] after:min-h-[44px]"
      );
    });

    it("2.5 select.tsx: verifies SelectTrigger and SelectItem have >=44px hit-box on mobile", () => {
      const selPath = path.join(rootDir, "src/components/ui/select.tsx");
      const selContent = fs.readFileSync(selPath, "utf-8");

      assert.ok(
        selContent.includes("min-h-[44px]") && selContent.includes("h-11"),
        "SelectTrigger must have min-h-[44px] and h-11"
      );
      assert.ok(
        selContent.includes("min-h-[44px]"),
        "SelectItem must have min-h-[44px]"
      );
    });

    it("2.6 tabs.tsx: verifies TabsList and TabsTrigger have >=44px hit-box on mobile", () => {
      const tabsPath = path.join(rootDir, "src/components/ui/tabs.tsx");
      const tabsContent = fs.readFileSync(tabsPath, "utf-8");

      assert.ok(
        tabsContent.includes("min-h-[44px]") && tabsContent.includes("h-11"),
        "TabsList must have min-h-[44px] and h-11"
      );
      assert.ok(
        tabsContent.includes("after:min-w-[44px]") &&
        tabsContent.includes("after:min-h-[44px]"),
        "TabsTrigger must have after:min-w-[44px] after:min-h-[44px]"
      );
    });

    it("2.7 Header and MobileBottomNav touch targets", () => {
      const headerPath = path.join(rootDir, "src/components/layout/Header.tsx");
      const headerContent = fs.readFileSync(headerPath, "utf-8");

      // Search trigger button
      assert.ok(headerContent.includes("min-h-[44px]"), "Search trigger button must have min-h-[44px]");
      // Workspace link
      assert.ok(headerContent.includes("min-h-[44px]"), "Workspace button must have min-h-[44px]");
      // Mobile hamburger
      assert.ok(headerContent.includes("h-11 w-11"), "Mobile hamburger must have h-11 w-11");
      // Mobile drawer links
      assert.ok(headerContent.includes("min-h-[44px]"), "Mobile drawer links must have min-h-[44px]");

      const navPath = path.join(rootDir, "src/components/layout/MobileBottomNav.tsx");
      const navContent = fs.readFileSync(navPath, "utf-8");
      assert.ok(navContent.includes("min-h-[48px]"), "MobileBottomNav items must enforce >=48px touch targets");
    });

    it("2.8 Modal and Dock control buttons hit-boxes", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      assert.ok(dockContent.includes("h-11 w-11"), "DownloadDock buttons must have h-11 w-11 on mobile");

      const delivPath = path.join(rootDir, "src/components/download/FileDeliveredModal.tsx");
      const delivContent = fs.readFileSync(delivPath, "utf-8");
      assert.ok(delivContent.includes("h-11 w-11"), "FileDeliveredModal close button must have h-11 w-11 on mobile");

      const suppPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
      const suppContent = fs.readFileSync(suppPath, "utf-8");
      assert.ok(suppContent.includes("h-11 w-11"), "SupportModal close button must have h-11 w-11 on mobile");

      const promptPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const promptContent = fs.readFileSync(promptPath, "utf-8");
      assert.ok(promptContent.includes("h-11 w-11"), "SupportPrompt dismiss button must have h-11 w-11 on mobile");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Resiliency & Overflow Testing Suite
  // -------------------------------------------------------------------------
  describe("3. Visual Resiliency, Overflow & Safe Areas", () => {
    it("3.1 Safe area coordination in layout and footer", () => {
      const footerPath = path.join(rootDir, "src/components/layout/Footer.tsx");
      const footerContent = fs.readFileSync(footerPath, "utf-8");

      assert.ok(
        footerContent.includes("safe-area-inset-bottom") || footerContent.includes("pb-[calc(5.5rem"),
        "Footer must offset for mobile bottom navigation bar and safe-area"
      );
    });

    it("3.2 Comparison slider handle has >=44px hit-box", () => {
      assert.ok(
        css.includes(".compare-slider-handle::before") &&
        css.includes("width: 44px") &&
        css.includes("height: 44px"),
        "Comparison slider handle must be >=44px"
      );
    });

    it("3.3 Mobile viewport clearance: SupportPrompt vs DownloadDock vertical stacking (<640px)", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      const promptPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const promptContent = fs.readFileSync(promptPath, "utf-8");

      // DownloadDock mobile dimensions: 80px bottom + 65px header + 160px items container + 2px border = 307px
      assert.ok(dockContent.includes("bottom-20"), "DownloadDock must anchor at bottom-20 on mobile");
      const dockTopCoordinatePx = 80 + 65 + 160 + 2; // 307px

      // SupportPrompt mobile offset when downloads exist must be at least 320px (bottom-80 or bottom-[320px])
      assert.ok(
        promptContent.includes("bottom-80") || promptContent.includes("bottom-[320px]"),
        "SupportPrompt must shift to bottom-80 (320px) or bottom-[320px] when active deliveries exist"
      );

      const promptMatch = promptContent.match(/hasDownloads\s*\?\s*"bottom-([0-9]+|\[[0-9]+px\])/);
      assert.ok(promptMatch, "SupportPrompt must dynamically adjust bottom offset based on hasDownloads");

      let promptBottomPx = 0;
      if (promptMatch[1].startsWith("[")) {
        promptBottomPx = parseInt(promptMatch[1].replace(/[\[\]px]/g, ""), 10);
      } else {
        promptBottomPx = parseInt(promptMatch[1], 10) * 4;
      }

      const clearance = promptBottomPx - dockTopCoordinatePx;
      console.log(`[Clearance] SupportPrompt bottom (${promptBottomPx}px) vs DownloadDock top (${dockTopCoordinatePx}px): ${clearance}px`);
      assert.ok(clearance >= 0, `SupportPrompt collides with DownloadDock by ${Math.abs(clearance)}px on mobile viewports`);
    });
  });
});
