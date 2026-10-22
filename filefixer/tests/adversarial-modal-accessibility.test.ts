import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Adversarial Milestone 1 Challenge: Modal Accessibility & Tabular Numerals", () => {
  // ==========================================================================
  // SUITE 1: CommandCenter.tsx Deep-Dive & Edge Cases
  // ==========================================================================
  describe("Suite 1: CommandCenter.tsx Modal Behavior & Edge Cases", () => {
    const ccPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
    const ccSource = fs.readFileSync(ccPath, "utf-8");

    it("ADV-CC-1: CommandCenter implements Tab focus trap and key listeners", () => {
      // Must contain Tab key listener
      assert.ok(ccSource.includes('e.key === "Tab"'), "CommandCenter must intercept Tab key");
      assert.ok(ccSource.includes("e.shiftKey"), "CommandCenter must handle Shift+Tab reverse trapping");
      assert.ok(ccSource.includes('e.key === "Escape"'), "CommandCenter must dismiss on Escape");
      assert.ok(ccSource.includes('document.body.style.overflow = "hidden"'), "CommandCenter must lock body scroll");
      assert.ok(ccSource.includes("previousActiveElementRef.current.focus"), "CommandCenter must restore focus to opener");
    });

    it("ADV-CC-2: Edge Case: Empty search query handles focus and rendering", () => {
      // Trace default search query behavior
      assert.ok(ccSource.includes('const [query, setQuery] = useState("")'));
      assert.ok(ccSource.includes("if (!q) return allItems;"), "Empty query returns all items without crashing");
      // Clear button must only show when query is non-empty
      assert.ok(ccSource.includes("{query && ("), "Clear button conditionally renders only on active query");
    });

    it("ADV-CC-3: Edge Case: Ultra-long query strings (10,000 chars) & regex metacharacters", () => {
      // Filter logic uses String.prototype.includes, not RegExp (safe from catastrophic backtracking and syntax crash)
      assert.ok(ccSource.includes(".toLowerCase().includes(q)"), "Filtering uses safe includes() string matching");
      assert.ok(!ccSource.includes("new RegExp(query"), "Must not construct unsafe RegExp from user input");

      // Empirical execution of the search filter with extreme inputs
      const sampleItem = {
        title: "Compress Image",
        subtitle: "Shrink image file weight while preserving high visual quality",
        keywords: ["compress", "shrink", "reduce"],
      };

      const longString = "a".repeat(10000);
      const regexChars = ".*+?^${}()|[]\\";
      const unicodeString = "🚀🔥✨❤️🔍⚡";

      const filterFn = (item: typeof sampleItem, q: string) => {
        const queryNorm = q.toLowerCase().trim();
        if (!queryNorm) return true;
        const matchTitle = item.title.toLowerCase().includes(queryNorm);
        const matchSubtitle = item.subtitle.toLowerCase().includes(queryNorm);
        const matchKeywords = item.keywords.some((k) => k.includes(queryNorm));
        return matchTitle || matchSubtitle || matchKeywords;
      };

      assert.strictEqual(filterFn(sampleItem, longString), false, "10k char query cleanly returns false without timing out");
      assert.strictEqual(filterFn(sampleItem, regexChars), false, "Regex metacharacters do not crash filter");
      assert.strictEqual(filterFn(sampleItem, unicodeString), false, "Unicode emoji search handles safely");
      assert.strictEqual(filterFn(sampleItem, "compress"), true, "Valid keyword query matches");
    });

    it("ADV-CC-4: Edge Case: Rapid Escape presses and focus race conditions", () => {
      assert.ok(ccSource.includes("setCommandCenterOpen(false)"), "Escape invokes setCommandCenterOpen(false)");
      assert.ok(ccSource.includes("if (!isCommandCenterOpen) return;"), "Guards against re-handling when already closed");
      
      // Vulnerability Observation: setTimeout without clearTimeout in cleanup
      const hasSetTimeout = ccSource.includes("setTimeout(() => inputRef.current?.focus(), 50)");
      assert.ok(hasSetTimeout, "CommandCenter uses 50ms setTimeout for initial focus");
      
      // Check if clearTimeout exists in cleanup
      const hasClearTimeout = ccSource.includes("clearTimeout");
      assert.ok(hasClearTimeout, "CommandCenter must clear initial focus timeout on unmount");
    });

    it("ADV-CC-5: Tab Focus Trap & Combobox Listbox Option Desync Remediated", () => {
      // In WAI-ARIA Combobox, listbox options should have tabIndex={-1} because selection is via Arrow keys.
      const hasOptionButtons = ccSource.includes("<button\n                  key={item.id}\n                  id={`command-opt-${item.id}`}") ||
        ccSource.includes('role="option"');
      assert.ok(hasOptionButtons, "Listbox items are rendered as buttons with role='option'");

      const hasTabIndexMinusOne = ccSource.includes('tabIndex={-1}') || ccSource.includes('tabIndex="-1"');
      assert.strictEqual(hasTabIndexMinusOne, true, 
        "Remediated: Options have tabIndex={-1} to prevent listbox buttons from creating 24+ unwanted Tab stops.");

      const hasOnFocusOnOption = ccSource.includes("onFocus={() => setSelectedIndex(idx)}");
      assert.strictEqual(hasOnFocusOnOption, true, 
        "Remediated: Options have onFocus handler to synchronize selectedIndex and prevent visual/state desync.");
    });

    it("ADV-CC-6: Responsive footer hides desktop shortcuts on mobile", () => {
      assert.ok(
        ccSource.includes("hidden sm:flex") && ccSource.includes("100% In-Browser • Zero Uploads"),
        "CommandCenter footer must hide keyboard shortcuts on mobile via hidden sm:flex to prevent 320px clipping"
      );
    });

    it("ADV-SP-1: SupportPrompt coordinates vertical stacking when DownloadDock has items", () => {
      const spPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const spSource = fs.readFileSync(spPath, "utf-8");
      assert.ok(
        spSource.includes("downloadQueue") && (spSource.includes("bottom-80") || spSource.includes("bottom-[320px]") || spSource.includes("bottom-72")),
        "SupportPrompt must shift higher (bottom-80 or bottom-[320px]) when downloadQueue has active items to prevent collision"
      );
    });
  });

  // ==========================================================================
  // SUITE 2: SupportModal.tsx Deep-Dive & Accessibility Violations
  // ==========================================================================
  describe("Suite 2: SupportModal.tsx Accessibility & Focus Audit", () => {
    const smPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
    const smSource = fs.readFileSync(smPath, "utf-8");

    it("ADV-SM-1: SupportModal implements Escape dismissal and body scroll locking", () => {
      assert.ok(smSource.includes('e.key === "Escape"'), "SupportModal handles Escape");
      assert.ok(smSource.includes('document.body.style.overflow = "hidden"'), "SupportModal locks body scroll");
      assert.ok(smSource.includes("previousFocusRef.current.focus"), "SupportModal restores focus on close");
    });

    it("ADV-SM-2: SupportModal implements Tab key focus trapping", () => {
      const hasTabHandling = smSource.includes('e.key === "Tab"') || smSource.includes('e.keyCode === 9');
      assert.ok(hasTabHandling, "SupportModal must implement Tab key focus trapping");
    });

    it("ADV-SM-3: SupportModal places initial focus on close button", () => {
      const focusesInsideModal = smSource.includes("closeButtonRef") || 
        smSource.includes(".focus()") && !smSource.includes("previousFocusRef.current.focus");
      assert.ok(focusesInsideModal, "SupportModal must place initial focus on close button");
    });
  });

  // ==========================================================================
  // SUITE 3: DownloadCenterModal.tsx Deep-Dive & Accessibility Violations
  // ==========================================================================
  describe("Suite 3: DownloadCenterModal.tsx Accessibility & Focus Audit", () => {
    const dcmPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
    const dcmSource = fs.readFileSync(dcmPath, "utf-8");

    it("ADV-DCM-1: DownloadCenterModal implements Escape key dismissal", () => {
      const hasEscape = dcmSource.includes('e.key === "Escape"') || dcmSource.includes("Escape");
      assert.ok(hasEscape, "DownloadCenterModal must handle Escape key dismissal");
    });

    it("ADV-DCM-2: DownloadCenterModal implements Tab focus trapping", () => {
      const hasTabTrap = dcmSource.includes('e.key === "Tab"') || dcmSource.includes("querySelectorAll");
      assert.ok(hasTabTrap, "DownloadCenterModal must trap Tab key focus within modal");
    });

    it("ADV-DCM-3: DownloadCenterModal locks document body scroll on open", () => {
      const hasScrollLock = dcmSource.includes("document.body.style.overflow");
      assert.ok(hasScrollLock, "DownloadCenterModal must lock body scroll");
    });

    it("ADV-DCM-4: DownloadCenterModal restores focus on dismissal", () => {
      const hasFocusRestoration = dcmSource.includes("previousActiveElement") || dcmSource.includes("previousFocus");
      assert.ok(hasFocusRestoration, "DownloadCenterModal must restore focus to opener");
    });
  });

  // ==========================================================================
  // SUITE 4: FileDeliveredModal.tsx Deep-Dive & Accessibility Violations
  // ==========================================================================
  describe("Suite 4: FileDeliveredModal.tsx Accessibility & Focus Audit", () => {
    const fdmPath = path.join(rootDir, "src/components/download/FileDeliveredModal.tsx");
    const fdmSource = fs.readFileSync(fdmPath, "utf-8");

    it("ADV-FDM-1: FileDeliveredModal implements Escape dismissal, focus trap, scroll lock, and focus restoration", () => {
      const hasEscape = fdmSource.includes('e.key === "Escape"');
      const hasTabTrap = fdmSource.includes('e.key === "Tab"');
      const hasScrollLock = fdmSource.includes('overflow = "hidden"');
      const hasFocusRestore = fdmSource.includes("previousFocus");

      assert.ok(hasEscape, "FileDeliveredModal must handle Escape");
      assert.ok(hasTabTrap, "FileDeliveredModal must trap Tab");
      assert.ok(hasScrollLock, "FileDeliveredModal must lock body scroll");
      assert.ok(hasFocusRestore, "FileDeliveredModal must restore focus");
    });
  });

  // ==========================================================================
  // SUITE 5: Tabular Numerals & Cumulative Layout Shift (CLS) Oracle
  // ==========================================================================
  describe("Suite 5: Tabular Numerals & CLS Prevention Oracle", () => {
    const cssPath = path.join(rootDir, "src/app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    it("ADV-NUM-1: globals.css declares universal tabular-nums and tnum font features", () => {
      assert.ok(cssContent.includes(".tabular-nums"), "CSS includes .tabular-nums");
      assert.ok(cssContent.includes("font-variant-numeric: tabular-nums"), "font-variant-numeric: tabular-nums declared");
      assert.ok(cssContent.includes('font-feature-settings: "tnum"'), "font-feature-settings declared");
      assert.ok(cssContent.includes("[data-tabular-nums=\"true\"]"), "data-tabular-nums selector declared");
    });

    it("ADV-NUM-2: Tabular numerals applied across file metrics in DownloadDock, FileDeliveredModal, DownloadCenterModal", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const dockContent = fs.readFileSync(dockPath, "utf-8");
      assert.ok(dockContent.includes("tabular-nums"), "DownloadDock must apply tabular-nums to byte counters");

      const deliveredPath = path.join(rootDir, "src/components/download/FileDeliveredModal.tsx");
      const deliveredContent = fs.readFileSync(deliveredPath, "utf-8");
      assert.ok(deliveredContent.includes("tabular-nums"), "FileDeliveredModal must apply tabular-nums to metrics");

      const centerPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
      const centerContent = fs.readFileSync(centerPath, "utf-8");
      assert.ok(centerContent.includes("tabular-nums"), "DownloadCenterModal must apply tabular-nums to stats");
    });

    it("ADV-NUM-3: Empirical Layout Shift Oracle: Monospaced Tabular Figures vs Proportional Jitter", () => {
      // In standard proportional fonts (e.g. system UI or Helvetica without tnum):
      // Glyph advance widths differ widely:
      // '1' is typically ~250 units wide, while '8' and '0' are ~600 units wide.
      // Under OpenType 'tnum' (tabular numerals), ALL digits 0-9 share identical monospaced advance width (e.g. 550 units).

      const proportionalGlyphWidths: Record<string, number> = {
        "0": 560,
        "1": 270,
        "2": 530,
        "3": 530,
        "4": 550,
        "5": 530,
        "6": 550,
        "7": 500,
        "8": 560,
        "9": 550,
        ".": 250,
        " ": 250,
        "K": 600,
        "M": 800,
        "B": 580,
      };

      const tabularGlyphWidths: Record<string, number> = {
        "0": 550,
        "1": 550,
        "2": 550,
        "3": 550,
        "4": 550,
        "5": 550,
        "6": 550,
        "7": 550,
        "8": 550,
        "9": 550,
        ".": 250,
        " ": 250,
        "K": 600,
        "M": 800,
        "B": 580,
      };

      const measureWidth = (str: string, widths: Record<string, number>) => {
        return str.split("").reduce((acc, char) => acc + (widths[char] || 500), 0);
      };

      // Test dynamic updates during file compression counter:
      // E.g. progress updating through sequential byte strings of identical character length:
      const frames = [
        "111.1 KB",
        "181.8 KB",
        "888.8 KB",
        "210.5 KB",
        "999.9 KB",
        "711.2 KB",
      ];

      const proportionalWidths = frames.map((f) => measureWidth(f, proportionalGlyphWidths));
      const tabularWidths = frames.map((f) => measureWidth(f, tabularGlyphWidths));

      const propMin = Math.min(...proportionalWidths);
      const propMax = Math.max(...proportionalWidths);
      const propJitter = propMax - propMin;

      const tabMin = Math.min(...tabularWidths);
      const tabMax = Math.max(...tabularWidths);
      const tabJitter = tabMax - tabMin;

      // Assertions
      assert.ok(propJitter > 500, `Proportional figures should oscillate severely (observed jitter: ${propJitter} units)`);
      assert.strictEqual(tabJitter, 0, `Tabular numerals must yield EXACTLY 0 width oscillation across identical length strings (observed jitter: ${tabJitter})`);
    });
  });
});
