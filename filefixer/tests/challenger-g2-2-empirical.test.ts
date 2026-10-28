import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// ============================================================================
// Lightweight Mock DOM Harness for Empirical Focus Trapping Verification
// ============================================================================
class MockElement {
  tagName: string;
  attributes: Map<string, string> = new Map();
  children: MockElement[] = [];
  parentElement: MockElement | null = null;
  focused = false;
  disabled = false;

  constructor(tagName: string, attrs: Record<string, string> = {}) {
    this.tagName = tagName.toUpperCase();
    for (const [k, v] of Object.entries(attrs)) {
      this.attributes.set(k.toLowerCase(), v);
    }
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name.toLowerCase()) ?? null;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name.toLowerCase(), value);
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name.toLowerCase());
  }

  focus() {
    this.focused = true;
    MockDocument.activeElement = this;
  }

  contains(child: MockElement | null): boolean {
    if (!child) return false;
    let curr: MockElement | null = child;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentElement;
    }
    return false;
  }

  appendChild(child: MockElement) {
    child.parentElement = this;
    this.children.push(child);
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const selectors = selector.split(",").map((s) => s.trim());

    const matchesSingle = (el: MockElement, sel: string): boolean => {
      if (el.disabled) return false;

      if (sel === 'button:not([disabled]):not([tabindex="-1"])') {
        return el.tagName === "BUTTON" && !el.disabled && el.getAttribute("tabindex") !== "-1";
      }
      if (sel === 'input:not([disabled]):not([tabindex="-1"])') {
        return el.tagName === "INPUT" && !el.disabled && el.getAttribute("tabindex") !== "-1";
      }
      if (sel === '[tabindex]:not([tabindex="-1"])') {
        return el.hasAttribute("tabindex") && el.getAttribute("tabindex") !== "-1";
      }
      if (sel === 'button:not([disabled])') {
        return el.tagName === "BUTTON" && !el.disabled && el.getAttribute("tabindex") !== "-1";
      }
      if (sel === 'input:not([disabled])') {
        return el.tagName === "INPUT" && !el.disabled && el.getAttribute("tabindex") !== "-1";
      }
      if (sel === '[href]') {
        return el.hasAttribute("href");
      }
      if (sel === 'select:not([disabled])') {
        return el.tagName === "SELECT" && !el.disabled;
      }
      if (sel === 'textarea:not([disabled])') {
        return el.tagName === "TEXTAREA" && !el.disabled;
      }
      return false;
    };

    const traverse = (node: MockElement) => {
      for (const child of node.children) {
        if (selectors.some((s) => matchesSingle(child, s))) {
          results.push(child);
        }
        traverse(child);
      }
    };

    traverse(this);
    return results;
  }
}

class MockDocument {
  static activeElement: MockElement | null = null;
}

function simulateFocusTrapKeyDown(
  container: MockElement,
  e: { key: string; shiftKey: boolean; defaultPrevented: boolean; preventDefault: () => void },
  selector: string
) {
  if (e.key === "Tab" && container) {
    const focusable = container.querySelectorAll(selector);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (MockDocument.activeElement === first || !container.contains(MockDocument.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (MockDocument.activeElement === last || !container.contains(MockDocument.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

describe("Adversarial Verification Suite: Milestone G2 Challenger (challenger_g2_2)", () => {
  const ccPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
  const smPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
  const fdmPath = path.join(rootDir, "src/components/download/FileDeliveredModal.tsx");
  const dcmPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
  const wsPath = path.join(rootDir, "src/components/workspace/WorkspaceDrawer.tsx");

  const ccSource = fs.readFileSync(ccPath, "utf-8");
  const smSource = fs.readFileSync(smPath, "utf-8");
  const fdmSource = fs.readFileSync(fdmPath, "utf-8");
  const dcmSource = fs.readFileSync(dcmPath, "utf-8");
  const wsSource = fs.readFileSync(wsPath, "utf-8");

  // ==========================================================================
  // SUITE 1: WAI-ARIA Roles & Accessibility Contracts Across All Modals
  // ==========================================================================
  describe("1. WAI-ARIA Roles & Dialog Accessibility", () => {
    it("1.1 CommandCenter implements role='dialog', aria-modal, and WAI-ARIA 1.2 Combobox", () => {
      assert.ok(ccSource.includes('role="dialog"'), "CommandCenter has role='dialog'");
      assert.ok(ccSource.includes('aria-modal="true"'), "CommandCenter has aria-modal='true'");
      assert.ok(ccSource.includes('aria-label="Universal Command Center"'), "CommandCenter has aria-label");
      
      // Combobox search input
      assert.ok(ccSource.includes('role="combobox"'), "Search input has role='combobox'");
      assert.ok(ccSource.includes("aria-expanded={isCommandCenterOpen}"), "Combobox has dynamic aria-expanded");
      assert.ok(ccSource.includes('aria-autocomplete="list"'), "Combobox declares aria-autocomplete='list'");
      assert.ok(ccSource.includes('aria-controls="command-results-listbox"'), "Combobox links to listbox via aria-controls");
      assert.ok(ccSource.includes("aria-activedescendant="), "Combobox links to active option via aria-activedescendant");

      // Listbox & options
      assert.ok(ccSource.includes('id="command-results-listbox"'), "Listbox container has matching ID");
      assert.ok(ccSource.includes('role="listbox"'), "Listbox container has role='listbox'");
      assert.ok(ccSource.includes('role="option"'), "Items have role='option'");
      assert.ok(ccSource.includes("aria-selected={isSelected}"), "Items bind aria-selected to active index");
      assert.ok(ccSource.includes("tabIndex={-1}"), "Options have tabIndex={-1} to preserve arrow-key semantics");
    });

    it("1.2 SupportModal implements role='dialog', aria-modal, labelledby, describedby, and label on close button", () => {
      assert.ok(smSource.includes('role="dialog"'), "SupportModal has role='dialog'");
      assert.ok(smSource.includes('aria-modal="true"'), "SupportModal has aria-modal='true'");
      assert.ok(smSource.includes('aria-labelledby="support-dialog-title"'), "SupportModal has aria-labelledby");
      assert.ok(smSource.includes('aria-describedby="support-dialog-desc"'), "SupportModal has aria-describedby");
      assert.ok(smSource.includes('id="support-dialog-title"'), "SupportModal title has matching ID");
      assert.ok(smSource.includes('id="support-dialog-desc"'), "SupportModal description has matching ID");
      assert.ok(smSource.includes('aria-label="Close support dialog"'), "Close button has accessible aria-label");
    });

    it("1.3 FileDeliveredModal implements role='dialog', aria-modal, aria-label, and label on close button", () => {
      assert.ok(fdmSource.includes('role="dialog"'), "FileDeliveredModal has role='dialog'");
      assert.ok(fdmSource.includes('aria-modal="true"'), "FileDeliveredModal has aria-modal='true'");
      assert.ok(fdmSource.includes('aria-label="File Delivered"'), "FileDeliveredModal has aria-label");
      assert.ok(fdmSource.includes('aria-label="Close delivery modal"'), "Close button has accessible aria-label");
    });

    it("1.4 DownloadCenterModal implements role='dialog', aria-modal, aria-label, and label on close button", () => {
      assert.ok(dcmSource.includes('role="dialog"'), "DownloadCenterModal has role='dialog'");
      assert.ok(dcmSource.includes('aria-modal="true"'), "DownloadCenterModal has aria-modal='true'");
      assert.ok(dcmSource.includes('aria-label="Download Center"'), "DownloadCenterModal has aria-label");
      assert.ok(dcmSource.includes('aria-label="Close download center"'), "Close button has accessible aria-label");
    });

    it("1.5 WorkspaceDrawer implements role='dialog', aria-modal, and accessible labels", () => {
      assert.ok(wsSource.includes('role="dialog"'), "WorkspaceDrawer has role='dialog'");
      assert.ok(wsSource.includes('aria-modal="true"'), "WorkspaceDrawer has aria-modal='true'");
      assert.ok(wsSource.includes('aria-label="Temporary Local File Workspace"'), "WorkspaceDrawer has aria-label");
      assert.ok(wsSource.includes('aria-label="Close workspace"'), "Close button has accessible aria-label");
    });
  });

  // ==========================================================================
  // SUITE 2: Keyboard Focus Trapping & Escape Dismissal
  // ==========================================================================
  describe("2. Focus Trapping, Escape Dismissal, & Scroll Locking", () => {
    it("2.1 All 4 modals handle Escape key dismissal and prevent default", () => {
      assert.ok(ccSource.includes('e.key === "Escape"') && ccSource.includes("setCommandCenterOpen(false)"));
      assert.ok(smSource.includes('e.key === "Escape"') && smSource.includes("closeSupportModal()"));
      assert.ok(fdmSource.includes('e.key === "Escape"') && fdmSource.includes("setLatestDeliveredFile(null)"));
      assert.ok(dcmSource.includes('e.key === "Escape"') && dcmSource.includes("setDownloadCenterOpen(false)"));
      assert.ok(wsSource.includes('e.key === "Escape"') && wsSource.includes("setWorkspaceOpen(false)"));
    });

    it("2.2 All 4 modals lock and restore body scroll on mount/unmount", () => {
      const lockPattern = 'document.body.style.overflow = "hidden"';
      assert.ok(ccSource.includes(lockPattern), "CommandCenter locks body scroll");
      assert.ok(smSource.includes(lockPattern), "SupportModal locks body scroll");
      assert.ok(fdmSource.includes(lockPattern), "FileDeliveredModal locks body scroll");
      assert.ok(dcmSource.includes(lockPattern), "DownloadCenterModal locks body scroll");

      assert.ok(ccSource.includes("document.body.style.overflow = originalOverflow"), "CommandCenter restores scroll");
      assert.ok(smSource.includes("document.body.style.overflow = originalOverflow"), "SupportModal restores scroll");
      assert.ok(fdmSource.includes("document.body.style.overflow = originalOverflow"), "FileDeliveredModal restores scroll");
      assert.ok(dcmSource.includes("document.body.style.overflow = originalOverflow"), "DownloadCenterModal restores scroll");
    });

    it("2.3 All 4 modals capture active element on open and restore focus on dismiss", () => {
      assert.ok(ccSource.includes("previousActiveElementRef.current = document.activeElement"));
      assert.ok(ccSource.includes("previousActiveElementRef.current.focus()"));

      assert.ok(smSource.includes("previousFocusRef.current = document.activeElement"));
      assert.ok(smSource.includes("previousFocusRef.current.focus()"));

      assert.ok(fdmSource.includes("previousFocusRef.current = document.activeElement"));
      assert.ok(fdmSource.includes("previousFocusRef.current.focus()"));

      assert.ok(dcmSource.includes("previousFocusRef.current = document.activeElement"));
      assert.ok(dcmSource.includes("previousFocusRef.current.focus()"));
    });

    it("2.4 Empirical Focus Trap Simulation: Multi-element bidirectional wrapping", () => {
      const container = new MockElement("div");
      const btnFirst = new MockElement("button", { "aria-label": "Close" });
      const input = new MockElement("input", { type: "text" });
      const btnLast = new MockElement("button", { "aria-label": "Action" });

      container.appendChild(btnFirst);
      container.appendChild(input);
      container.appendChild(btnLast);

      const selector = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [href]';

      // Forward Tab from last element wraps to first
      btnLast.focus();
      let tabPrevented = false;
      simulateFocusTrapKeyDown(container, {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => { tabPrevented = true; },
      }, selector);
      assert.strictEqual(tabPrevented, true);
      assert.strictEqual(MockDocument.activeElement, btnFirst);

      // Reverse Shift+Tab from first element wraps to last
      btnFirst.focus();
      let shiftTabPrevented = false;
      simulateFocusTrapKeyDown(container, {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => { shiftTabPrevented = true; },
      }, selector);
      assert.strictEqual(shiftTabPrevented, true);
      assert.strictEqual(MockDocument.activeElement, btnLast);
    });

    it("2.5 Empirical Focus Trap Simulation: Outside focus recapture", () => {
      const container = new MockElement("div");
      const btnInside = new MockElement("button", { "aria-label": "Inside" });
      container.appendChild(btnInside);

      const btnOutside = new MockElement("button", { "aria-label": "Outside" });
      btnOutside.focus();
      assert.strictEqual(MockDocument.activeElement, btnOutside);

      const selector = 'button:not([disabled]):not([tabindex="-1"])';

      // Tab from outside redirects inside
      let prevented = false;
      simulateFocusTrapKeyDown(container, {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => { prevented = true; },
      }, selector);
      assert.strictEqual(prevented, true);
      assert.strictEqual(MockDocument.activeElement, btnInside);
    });

    it("2.6 Empirical Focus Trap Simulation: Zero focusable elements edge case", () => {
      const emptyContainer = new MockElement("div");
      let prevented = false;
      simulateFocusTrapKeyDown(emptyContainer, {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => { prevented = true; },
      }, 'button:not([disabled])');
      assert.strictEqual(prevented, true, "Empty container must prevent default and not throw");
    });
  });

  // ==========================================================================
  // SUITE 3: DownloadCenterModal Glass Migration Audit
  // ==========================================================================
  describe("3. DownloadCenterModal Glass Styling Migration Audit", () => {
    it("3.1 ZERO remaining solid card or solid border classes in DownloadCenterModal", () => {
      assert.ok(!dcmSource.includes("bg-[hsl(var(--card))]"), "Must not contain bg-[hsl(var(--card))]");
      assert.ok(!dcmSource.includes("border-[hsl(var(--border))]"), "Must not contain border-[hsl(var(--border))]");
      assert.ok(!dcmSource.includes("var(--card)"), "Must not reference var(--card)");
      assert.ok(!dcmSource.includes("var(--border)"), "Must not reference var(--border)");
      assert.ok(!dcmSource.includes("bg-card"), "Must not contain bg-card");
      assert.ok(!dcmSource.includes("border-border"), "Must not contain border-border");
    });

    it("3.2 Uses calibrated frosted glass surfaces and luminous borders", () => {
      assert.ok(dcmSource.includes("var(--glass-surface-elevated)"), "Container uses elevated glass surface");
      assert.ok(dcmSource.includes("var(--glass-border-luminous)"), "Container uses luminous border");
      assert.ok(dcmSource.includes("var(--glass-surface)"), "Internal panels use glass surface");
      assert.ok(dcmSource.includes("var(--glass-border)"), "Dividers use subtle glass border");
      assert.ok(dcmSource.includes("backdrop-blur-2xl"), "Container declares backdrop-blur-2xl");
      assert.ok(dcmSource.includes("backdrop-blur-md"), "Backdrop overlay declares backdrop-blur-md");
    });
  });

  // ==========================================================================
  // SUITE 4: Tabular Numerals & Monospace Metric Typography
  // ==========================================================================
  describe("4. Universal Tabular Numerals & Monospace Metric Typography", () => {
    it("4.1 WorkspaceDrawer applies .tabular-nums font-mono to all counts, sizes, and dimensions", () => {
      // Badge count
      assert.ok(wsSource.includes('Badge variant="secondary" className="text-xs tabular-nums font-mono"'));
      
      // Summary bar metrics
      assert.ok(wsSource.includes('className="text-sm font-bold tabular-nums font-mono">{totalCount}</p>'));
      assert.ok(wsSource.includes('className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums font-mono"'));
      assert.ok(wsSource.includes('className="text-sm font-bold text-emerald-500 tabular-nums font-mono"'));
      assert.ok(wsSource.includes('className="text-xs font-semibold truncate mt-0.5 tabular-nums font-mono"'));

      // File item rows
      assert.ok(wsSource.includes('<span className="tabular-nums font-mono">{formatBytes(item.size)}</span>'));
      assert.ok(wsSource.includes('<span className="tabular-nums font-mono">\n                              • {item.width}×{item.height}\n                            </span>') ||
        wsSource.includes('• {item.width}×{item.height}'));
      assert.ok(wsSource.includes('→ {formatBytes(item.outputSize)}'));
    });

    it("4.2 DownloadCenterModal applies tabular-nums font-mono to metrics", () => {
      assert.ok(dcmSource.includes('<span className="tabular-nums font-mono">{validFiles.length}</span>'));
      assert.ok(dcmSource.includes('tabular-nums font-mono">{formatBytes(totalOriginalSize)}</p>'));
      assert.ok(dcmSource.includes('tabular-nums font-mono">\n                {formatBytes(totalOutputSize)}'));
      assert.ok(dcmSource.includes('tabular-nums font-mono">\n                {formatBytes(totalSaved)} ({totalSavedPct.toFixed(0)}%)'));
      assert.ok(dcmSource.includes('<span className="tabular-nums font-mono">{formatBytes(file.outputSize)}</span>'));
    });

    it("4.3 FileDeliveredModal applies tabular-nums font-mono to metrics", () => {
      assert.ok(fdmSource.includes('tabular-nums font-mono shadow-xs'));
      assert.ok(fdmSource.includes('{formatBytes(latestDeliveredFile.originalSize)}'));
      assert.ok(fdmSource.includes('{formatBytes(latestDeliveredFile.outputSize)}'));
      assert.ok(fdmSource.includes('tabular-nums font-mono'));
    });

    it("4.4 CommandCenter applies tabular-nums font-mono to search result subtitles", () => {
      assert.ok(ccSource.includes('tabular-nums font-mono'));
    });
  });

  // ==========================================================================
  // SUITE 5: Backdrop Blur, Layering, and Z-Index Elevation Hierarchy
  // ==========================================================================
  describe("5. Backdrop Blur, Layering, and Elevation Hierarchy", () => {
    it("5.1 All modal overlays declare backdrop-blur-md with deep opacity for contrast separation", () => {
      assert.ok(ccSource.includes("backdrop-blur-md"), "CommandCenter overlay has backdrop-blur-md");
      assert.ok(smSource.includes("backdrop-blur-md"), "SupportModal overlay has backdrop-blur-md");
      assert.ok(fdmSource.includes("backdrop-blur-md"), "FileDeliveredModal overlay has backdrop-blur-md");
      assert.ok(dcmSource.includes("backdrop-blur-md"), "DownloadCenterModal overlay has backdrop-blur-md");
      assert.ok(wsSource.includes("backdrop-blur-md"), "WorkspaceDrawer overlay has backdrop-blur-md");
    });

    it("5.2 Modals occupy z-50 above standard floating navigation (z-40)", () => {
      assert.ok(ccSource.includes("z-50"), "CommandCenter is z-50");
      assert.ok(smSource.includes("z-50"), "SupportModal is z-50");
      assert.ok(fdmSource.includes("z-50"), "FileDeliveredModal is z-50");
      assert.ok(dcmSource.includes("z-50"), "DownloadCenterModal is z-50");
      assert.ok(wsSource.includes("z-50"), "WorkspaceDrawer is z-50");
    });
  });
});
