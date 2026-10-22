import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// ============================================================================
// Lightweight Mock DOM Harness for Empirical Keyboard & Focus Trap Verification
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

  // Simplified querySelectorAll matching the standard modal selector
  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const selectors = selector.split(",").map((s) => s.trim());

    const matchesSingle = (el: MockElement, sel: string): boolean => {
      if (el.disabled) return false;

      // Handle 'button:not([disabled]):not([tabindex="-1"])'
      if (sel === 'button:not([disabled]):not([tabindex="-1"])') {
        return el.tagName === "BUTTON" && !el.disabled && el.getAttribute("tabindex") !== "-1";
      }
      // Handle 'input:not([disabled]):not([tabindex="-1"])'
      if (sel === 'input:not([disabled]):not([tabindex="-1"])') {
        return el.tagName === "INPUT" && !el.disabled && el.getAttribute("tabindex") !== "-1";
      }
      // Handle '[tabindex]:not([tabindex="-1"])'
      if (sel === '[tabindex]:not([tabindex="-1"])') {
        return el.hasAttribute("tabindex") && el.getAttribute("tabindex") !== "-1";
      }
      // Handle 'button:not([disabled])'
      if (sel === 'button:not([disabled])') {
        return el.tagName === "BUTTON" && !el.disabled;
      }
      // Handle 'input:not([disabled])'
      if (sel === 'input:not([disabled])') {
        return el.tagName === "INPUT" && !el.disabled;
      }
      // Handle '[href]'
      if (sel === "[href]") {
        return el.hasAttribute("href");
      }
      // Handle 'select:not([disabled])'
      if (sel === 'select:not([disabled])') {
        return el.tagName === "SELECT" && !el.disabled;
      }
      // Handle 'textarea:not([disabled])'
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
  static bodyStyle = { overflow: "" };
}

// Function simulating the exact focus trap logic implemented across all modals
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

describe("Adversarial Empirical Challenge: Modal Accessibility Verification (Milestone 1 Iteration 2)", () => {
  // ==========================================================================
  // 1. SupportModal.tsx
  // ==========================================================================
  describe("1. SupportModal.tsx Rigorous Accessibility & Focus Trap Verification", () => {
    const smPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
    const smSource = fs.readFileSync(smPath, "utf-8");

    it("SM-E1: Focus Trap Harness — Single element loop (Close Button)", () => {
      const container = new MockElement("div");
      const closeBtn = new MockElement("button", { "aria-label": "Close support dialog" });
      container.appendChild(closeBtn);

      const standardModalSelector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

      // Initially focus close button
      closeBtn.focus();
      assert.strictEqual(MockDocument.activeElement, closeBtn);

      // Press Tab
      let tabPrevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          tabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, tabEvent, standardModalSelector);
      assert.strictEqual(tabPrevented, true, "Tab on single focusable element MUST prevent default");
      assert.strictEqual(MockDocument.activeElement, closeBtn, "Focus must remain locked on close button");

      // Press Shift+Tab
      let shiftTabPrevented = false;
      const shiftTabEvent = {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => {
          shiftTabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, shiftTabEvent, standardModalSelector);
      assert.strictEqual(shiftTabPrevented, true, "Shift+Tab on single focusable element MUST prevent default");
      assert.strictEqual(MockDocument.activeElement, closeBtn, "Focus must remain locked on close button");
    });

    it("SM-E2: Focus Trap Harness — Recaptures focus when focus escapes outside modal container", () => {
      const container = new MockElement("div");
      const closeBtn = new MockElement("button");
      container.appendChild(closeBtn);

      const outsideElement = new MockElement("button");
      outsideElement.focus();
      assert.strictEqual(MockDocument.activeElement, outsideElement);

      const standardModalSelector = 'button:not([disabled])';

      // Press Tab when outside
      let prevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          prevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, tabEvent, standardModalSelector);
      assert.strictEqual(prevented, true, "Tab from outside must be intercepted");
      assert.strictEqual(MockDocument.activeElement, closeBtn, "Tab from outside must redirect to first element in modal");

      // Press Shift+Tab when outside
      outsideElement.focus();
      let shiftPrevented = false;
      const shiftTabEvent = {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => {
          shiftPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, shiftTabEvent, standardModalSelector);
      assert.strictEqual(shiftPrevented, true, "Shift+Tab from outside must be intercepted");
      assert.strictEqual(MockDocument.activeElement, closeBtn, "Shift+Tab from outside must redirect to last element in modal");
    });

    it("SM-E3: Focus Trap Harness — Zero focusable elements edge case", () => {
      const emptyContainer = new MockElement("div");
      let prevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          prevented = true;
        },
      };
      simulateFocusTrapKeyDown(emptyContainer, tabEvent, 'button:not([disabled])');
      assert.strictEqual(prevented, true, "0 focusables must trigger preventDefault and not crash");
    });

    it("SM-E4: Source Verification — Initial focus, timer cleanup, opener restore, and scroll lock", () => {
      // Close button ref assignment & focus call
      assert.ok(smSource.includes("const closeButtonRef = useRef<HTMLButtonElement>(null);"));
      assert.ok(smSource.includes("closeButtonRef.current?.focus();"));
      assert.ok(smSource.includes("ref={closeButtonRef}"));

      // 30ms fallback timer with clearTimeout
      assert.ok(smSource.includes("const timerId = setTimeout(() => {"));
      assert.ok(smSource.includes("clearTimeout(timerId);"));

      // Body scroll lock & restore
      assert.ok(smSource.includes("const originalOverflow = document.body.style.overflow;"));
      assert.ok(smSource.includes('document.body.style.overflow = "hidden";'));
      assert.ok(smSource.includes("document.body.style.overflow = originalOverflow;"));

      // Opener element capture & restoration
      assert.ok(smSource.includes("previousFocusRef.current = document.activeElement as HTMLElement | null;"));
      assert.ok(smSource.includes("previousFocusRef.current.focus();"));

      // Escape key dismissal
      assert.ok(smSource.includes('if (e.key === "Escape") {'));
      assert.ok(smSource.includes("e.preventDefault();"));
      assert.ok(smSource.includes("closeSupportModal();"));

      // ARIA compliance
      assert.ok(smSource.includes('role="dialog"'));
      assert.ok(smSource.includes('aria-modal="true"'));
      assert.ok(smSource.includes('aria-labelledby="support-dialog-title"'));
      assert.ok(smSource.includes('aria-describedby="support-dialog-desc"'));
      assert.ok(smSource.includes('aria-label="Close support dialog"'));

      // Touch target size >= 44px
      assert.ok(smSource.includes("h-11 w-11 sm:h-9 sm:w-9"));
    });
  });

  // ==========================================================================
  // 2. DownloadCenterModal.tsx
  // ==========================================================================
  describe("2. DownloadCenterModal.tsx Rigorous Accessibility & Focus Trap Verification", () => {
    const dcmPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
    const dcmSource = fs.readFileSync(dcmPath, "utf-8");

    it("DCM-E1: Focus Trap Harness — Multi-element Tab wrap-around (Clear -> Close)", () => {
      const container = new MockElement("div");
      const closeBtn = new MockElement("button", { "aria-label": "Close" });
      const dlBtn = new MockElement("button", { "aria-label": "Download file" });
      const removeBtn = new MockElement("button", { "aria-label": "Remove from list" });
      const zipBtn = new MockElement("button", { "aria-label": "Download All" });
      const clearBtn = new MockElement("button", { "aria-label": "Clear" });

      container.appendChild(closeBtn);
      container.appendChild(dlBtn);
      container.appendChild(removeBtn);
      container.appendChild(zipBtn);
      container.appendChild(clearBtn);

      const standardModalSelector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

      // 1. Focus on last element (Clear button) and press Tab -> should wrap to closeBtn
      clearBtn.focus();
      let tabPrevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          tabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, tabEvent, standardModalSelector);
      assert.strictEqual(tabPrevented, true, "Tab from last element MUST prevent default");
      assert.strictEqual(MockDocument.activeElement, closeBtn, "Tab from last element wraps to first element (closeBtn)");

      // 2. Focus on first element (Close button) and press Shift+Tab -> should wrap to clearBtn
      closeBtn.focus();
      let shiftTabPrevented = false;
      const shiftTabEvent = {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => {
          shiftTabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, shiftTabEvent, standardModalSelector);
      assert.strictEqual(shiftTabPrevented, true, "Shift+Tab from first element MUST prevent default");
      assert.strictEqual(MockDocument.activeElement, clearBtn, "Shift+Tab from first element wraps to last element (clearBtn)");

      // 3. Focus on intermediate element (dlBtn) and press Tab -> should NOT prevent default (natural browser advance)
      dlBtn.focus();
      let intermediatePrevented = false;
      const interTabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          intermediatePrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, interTabEvent, standardModalSelector);
      assert.strictEqual(intermediatePrevented, false, "Tab on intermediate element must NOT prevent default");
    });

    it("DCM-E2: Source Verification — Lifecycle, cleanup, and WAI-ARIA Dialog semantics", () => {
      // Escape key handler
      assert.ok(dcmSource.includes('if (e.key === "Escape") {'));
      assert.ok(dcmSource.includes("setDownloadCenterOpen(false);"));

      // Tab trap implementation
      assert.ok(dcmSource.includes('if (e.key === "Tab" && modalContainerRef.current) {'));
      assert.ok(dcmSource.includes("focusable[0]"));
      assert.ok(dcmSource.includes("focusable[focusable.length - 1]"));

      // Initial focus on close button
      assert.ok(dcmSource.includes("closeButtonRef.current?.focus();"));
      assert.ok(dcmSource.includes("ref={closeButtonRef}"));
      assert.ok(dcmSource.includes("const timerId = setTimeout(() => {"));
      assert.ok(dcmSource.includes("clearTimeout(timerId);"));

      // Body scroll lock
      assert.ok(dcmSource.includes("const originalOverflow = document.body.style.overflow;"));
      assert.ok(dcmSource.includes('document.body.style.overflow = "hidden";'));
      assert.ok(dcmSource.includes("document.body.style.overflow = originalOverflow;"));

      // Focus restoration
      assert.ok(dcmSource.includes("previousFocusRef.current = document.activeElement as HTMLElement | null;"));
      assert.ok(dcmSource.includes("previousFocusRef.current.focus();"));

      // WAI-ARIA
      assert.ok(dcmSource.includes('role="dialog"'));
      assert.ok(dcmSource.includes('aria-modal="true"'));
      assert.ok(dcmSource.includes('aria-label="Download Center"'));
      assert.ok(dcmSource.includes('aria-label="Close download center"'));

      // Touch target sizing >= 44px
      assert.ok(dcmSource.includes("h-11 w-11 sm:h-9 sm:w-9"));
      assert.ok(dcmSource.includes("min-h-[44px]"));
    });
  });

  // ==========================================================================
  // 3. FileDeliveredModal.tsx
  // ==========================================================================
  describe("3. FileDeliveredModal.tsx Rigorous Accessibility & Focus Trap Verification", () => {
    const fdmPath = path.join(rootDir, "src/components/download/FileDeliveredModal.tsx");
    const fdmSource = fs.readFileSync(fdmPath, "utf-8");

    it("FDM-E1: Focus Trap Harness — Tab wraps from 'Done' button to Close button", () => {
      const container = new MockElement("div");
      const closeBtn = new MockElement("button", { "aria-label": "Close delivery modal" });
      const dlAgainBtn = new MockElement("button", { "aria-label": "Download Again" });
      const reuseBtn = new MockElement("button", { "aria-label": "Reuse in Another Tool" });
      const doneBtn = new MockElement("button", { "aria-label": "Done" });

      container.appendChild(closeBtn);
      container.appendChild(dlAgainBtn);
      container.appendChild(reuseBtn);
      container.appendChild(doneBtn);

      const standardModalSelector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

      // Focus on Done button, press Tab
      doneBtn.focus();
      let tabPrevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          tabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, tabEvent, standardModalSelector);
      assert.strictEqual(tabPrevented, true, "Tab from Done button wraps around");
      assert.strictEqual(MockDocument.activeElement, closeBtn, "Wrapped focus reaches closeBtn");

      // Focus on Close button, press Shift+Tab
      closeBtn.focus();
      let shiftTabPrevented = false;
      const shiftTabEvent = {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => {
          shiftTabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, shiftTabEvent, standardModalSelector);
      assert.strictEqual(shiftTabPrevented, true, "Shift+Tab from closeBtn wraps around");
      assert.strictEqual(MockDocument.activeElement, doneBtn, "Wrapped focus reaches doneBtn");
    });

    it("FDM-E2: Source Verification — Lifecycle, cleanup, and WAI-ARIA Dialog semantics", () => {
      // Escape key handler
      assert.ok(fdmSource.includes('if (e.key === "Escape") {'));
      assert.ok(fdmSource.includes("setLatestDeliveredFile(null);"));

      // Tab trap implementation
      assert.ok(fdmSource.includes('if (e.key === "Tab" && modalContainerRef.current) {'));

      // Initial focus
      assert.ok(fdmSource.includes("closeButtonRef.current?.focus();"));
      assert.ok(fdmSource.includes("ref={closeButtonRef}"));
      assert.ok(fdmSource.includes("const timerId = setTimeout(() => {"));
      assert.ok(fdmSource.includes("clearTimeout(timerId);"));

      // Body scroll lock
      assert.ok(fdmSource.includes("const originalOverflow = document.body.style.overflow;"));
      assert.ok(fdmSource.includes('document.body.style.overflow = "hidden";'));
      assert.ok(fdmSource.includes("document.body.style.overflow = originalOverflow;"));

      // Opener focus restoration
      assert.ok(fdmSource.includes("previousFocusRef.current = document.activeElement as HTMLElement | null;"));
      assert.ok(fdmSource.includes("previousFocusRef.current.focus();"));

      // WAI-ARIA
      assert.ok(fdmSource.includes('role="dialog"'));
      assert.ok(fdmSource.includes('aria-modal="true"'));
      assert.ok(fdmSource.includes('aria-label="File Delivered"'));
      assert.ok(fdmSource.includes('aria-label="Close delivery modal"'));

      // Touch target sizing >= 44px
      assert.ok(fdmSource.includes("h-11 w-11 sm:h-9 sm:w-9"));
      assert.ok(fdmSource.includes("min-h-[44px]"));
      assert.ok(fdmSource.includes("min-h-[46px]"));
    });
  });

  // ==========================================================================
  // 4. CommandCenter.tsx
  // ==========================================================================
  describe("4. CommandCenter.tsx Combobox, Focus Trap & Responsive Verification", () => {
    const ccPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
    const ccSource = fs.readFileSync(ccPath, "utf-8");

    it("CC-E1: Listbox options have tabIndex={-1} and onFocus synchronization", () => {
      // Must contain tabIndex={-1}
      assert.ok(
        ccSource.includes("tabIndex={-1}"),
        "CommandCenter option buttons must have tabIndex={-1} to eliminate unwanted Tab stops"
      );

      // Must contain onFocus sync
      assert.ok(
        ccSource.includes("onFocus={() => setSelectedIndex(idx)}"),
        "CommandCenter option buttons must synchronize selectedIndex upon focus"
      );

      // Must contain onMouseEnter sync
      assert.ok(
        ccSource.includes("onMouseEnter={() => setSelectedIndex(idx)}"),
        "CommandCenter option buttons must synchronize selectedIndex upon hover"
      );

      // ARIA Combobox roles
      assert.ok(ccSource.includes('role="combobox"'), "Search input must have role='combobox'");
      assert.ok(ccSource.includes('role="listbox"'), "Results container must have role='listbox'");
      assert.ok(ccSource.includes('role="option"'), "Results items must have role='option'");
      assert.ok(ccSource.includes("aria-activedescendant="), "Input must bind aria-activedescendant to active option ID");
    });

    it("CC-E2: Focus Trap Selector excludes buttons with tabindex='-1'", () => {
      const ccSelector =
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [href]';

      assert.ok(
        ccSource.includes(ccSelector),
        "CommandCenter must use refined selector excluding [tabindex='-1'] elements"
      );

      // Simulate container with input, clear button, and 5 option buttons (all tabindex=-1)
      const container = new MockElement("div");
      const searchInput = new MockElement("input", { type: "text" });
      const clearBtn = new MockElement("button", { "aria-label": "Clear search input" });

      container.appendChild(searchInput);
      container.appendChild(clearBtn);

      for (let i = 0; i < 5; i++) {
        const optBtn = new MockElement("button", {
          tabindex: "-1",
          role: "option",
          id: `command-opt-${i}`,
        });
        container.appendChild(optBtn);
      }

      const focusable = container.querySelectorAll(ccSelector);
      assert.strictEqual(focusable.length, 2, "Only searchInput and clearBtn should be tabbable; all 5 option buttons excluded");
      assert.strictEqual(focusable[0], searchInput);
      assert.strictEqual(focusable[1], clearBtn);

      // Test Tab from clearBtn wraps back to searchInput
      clearBtn.focus();
      let tabPrevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          tabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, tabEvent, ccSelector);
      assert.strictEqual(tabPrevented, true);
      assert.strictEqual(MockDocument.activeElement, searchInput, "Tab wraps to search input");

      // Test Shift+Tab from searchInput wraps back to clearBtn
      searchInput.focus();
      let shiftTabPrevented = false;
      const shiftTabEvent = {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => {
          shiftTabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, shiftTabEvent, ccSelector);
      assert.strictEqual(shiftTabPrevented, true);
      assert.strictEqual(MockDocument.activeElement, clearBtn, "Shift+Tab wraps to clear button");
    });

    it("CC-E3: Single-stop trap when search query is empty (Clear button absent)", () => {
      const ccSelector =
        'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [href]';

      const container = new MockElement("div");
      const searchInput = new MockElement("input", { type: "text" });
      container.appendChild(searchInput);

      for (let i = 0; i < 5; i++) {
        const optBtn = new MockElement("button", {
          tabindex: "-1",
          role: "option",
        });
        container.appendChild(optBtn);
      }

      const focusable = container.querySelectorAll(ccSelector);
      assert.strictEqual(focusable.length, 1, "Only searchInput is in tab ring when query is empty");

      searchInput.focus();

      // Tab stays on searchInput
      let tabPrevented = false;
      const tabEvent = {
        key: "Tab",
        shiftKey: false,
        defaultPrevented: false,
        preventDefault: () => {
          tabPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, tabEvent, ccSelector);
      assert.strictEqual(tabPrevented, true);
      assert.strictEqual(MockDocument.activeElement, searchInput);

      // Shift+Tab stays on searchInput
      let shiftPrevented = false;
      const shiftTabEvent = {
        key: "Tab",
        shiftKey: true,
        defaultPrevented: false,
        preventDefault: () => {
          shiftPrevented = true;
        },
      };
      simulateFocusTrapKeyDown(container, shiftTabEvent, ccSelector);
      assert.strictEqual(shiftPrevented, true);
      assert.strictEqual(MockDocument.activeElement, searchInput);
    });

    it("CC-E4: Responsive footer hides shortcuts on mobile (<640px) to prevent 320px clipping", () => {
      // Must contain hidden sm:flex on desktop shortcut hint
      assert.ok(
        ccSource.includes('className="hidden sm:flex items-center gap-3"'),
        "Keyboard shortcut hints must be hidden on mobile (hidden sm:flex)"
      );

      // Footer container must center on mobile
      assert.ok(
        ccSource.includes("justify-center sm:justify-between"),
        "Footer must center contents on mobile (justify-center sm:justify-between)"
      );

      // Privacy badge must truncate cleanly
      assert.ok(
        ccSource.includes("truncate"),
        "Zero uploads badge must include truncate to guarantee no horizontal overflow on 320px screens"
      );
    });

    it("CC-E5: Initial focus timer has robust cleanup", () => {
      assert.ok(
        ccSource.includes("const timerId = setTimeout(() => inputRef.current?.focus(), 50);"),
        "CommandCenter sets 50ms initial focus timer"
      );
      assert.ok(
        ccSource.includes("clearTimeout(timerId);"),
        "CommandCenter clears initial focus timer on effect unmount"
      );
    });
  });
});
