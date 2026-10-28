import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Helper to extract a <button ...> snippet containing specific text
function getButtonSnippet(source: string, identifier: string): string {
  const buttonRegex = /<button[\s\S]*?<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(source)) !== null) {
    if (match[0].includes(identifier)) {
      return match[0];
    }
  }
  throw new Error(`Could not find <button> containing "${identifier}"`);
}

describe("Empirical Challenger G2: Shell & Modal Interactive Touch Target Stress Harness", () => {
  // =========================================================================
  // 1. Header Touch Targets & Interactive Elements
  // =========================================================================
  describe("1. Header Touch Target Standards (>= 44x44px)", () => {
    const headerPath = path.join(rootDir, "src/components/layout/Header.tsx");
    assert.ok(fs.existsSync(headerPath), "Header.tsx must exist");
    const headerContent = fs.readFileSync(headerPath, "utf-8");

    it("1.1 Search trigger button enforces min-h-[44px], h-11, and touch-manipulation", () => {
      const btn = getButtonSnippet(headerContent, "setCommandCenterOpen(true)");
      assert.ok(btn.includes("min-h-[44px]"), "Search trigger must have min-h-[44px]");
      assert.ok(btn.includes("h-11"), "Search trigger must have h-11");
      assert.ok(btn.includes("touch-manipulation"), "Search trigger must have touch-manipulation");
      assert.ok(!btn.includes("sm:min-h-0"), "Must NOT reset min-h on sm viewports");
    });

    it("1.2 Keyboard shortcuts trigger button enforces h-11 w-11 (44x44px) and touch-manipulation", () => {
      const btn = getButtonSnippet(headerContent, "setShortcutsOpen(true)");
      assert.ok(btn.includes("h-11"), "Shortcuts trigger must specify h-11");
      assert.ok(btn.includes("w-11"), "Shortcuts trigger must specify w-11");
      assert.ok(btn.includes("touch-manipulation"), "Shortcuts trigger must declare touch-manipulation");
    });

    it("1.3 Workspace badge trigger enforces min-h-[44px], h-11, and touch-manipulation", () => {
      const match = headerContent.match(/href="\/workspace"[\s\S]*?className=\{cn\(\s*"([^"]+)"/);
      assert.ok(match, "Must find workspace link in Header.tsx");
      const classes = match[1];

      assert.ok(classes.includes("min-h-[44px]"), "Workspace trigger must specify min-h-[44px]");
      assert.ok(classes.includes("h-11"), "Workspace trigger must specify h-11");
      assert.ok(classes.includes("touch-manipulation"), "Workspace trigger must declare touch-manipulation");
    });

    it("1.4 Mobile menu toggle enforces h-11 w-11 (44x44px)", () => {
      const btn = getButtonSnippet(headerContent, "setMobileOpen(!mobileOpen)");
      assert.ok(btn.includes("h-11"), "Mobile menu toggle must specify h-11");
      assert.ok(btn.includes("w-11"), "Mobile menu toggle must specify w-11");
    });

    it("1.5 Desktop navigation dropdown items enforce min-h-[44px]", () => {
      const match = headerContent.match(/role="menuitem"[\s\S]*?className=\{cn\(\s*"([^"]+)"/);
      assert.ok(match, "Must find menuitem in Header.tsx");
      const classes = match[1];

      assert.ok(classes.includes("min-h-[44px]"), "Dropdown items must specify min-h-[44px]");
    });

    it("1.6 Mobile drawer navigation links enforce min-h-[44px]", () => {
      const match = headerContent.match(/mobileLinks\.map[\s\S]*?className=\{cn\(\s*"([^"]+)"/);
      assert.ok(match, "Must find mobile drawer links in Header.tsx");
      const classes = match[1];

      assert.ok(classes.includes("min-h-[44px]"), "Mobile drawer links must specify min-h-[44px]");
    });
  });

  // =========================================================================
  // 2. ThemeToggle Touch Targets
  // =========================================================================
  describe("2. ThemeToggle Touch Target Standards (>= 44x44px)", () => {
    const themeTogglePath = path.join(rootDir, "src/components/layout/ThemeToggle.tsx");
    assert.ok(fs.existsSync(themeTogglePath), "ThemeToggle.tsx must exist");
    const themeContent = fs.readFileSync(themeTogglePath, "utf-8");

    it("2.1 Unmounted fallback button enforces h-11 w-11 min-h-[44px] min-w-[44px]", () => {
      const match = themeContent.match(/if \(!mounted\) \{[\s\S]*?className="([^"]+)"/);
      assert.ok(match, "Must find unmounted fallback in ThemeToggle.tsx");
      const classes = match[1];

      assert.ok(classes.includes("h-11") && classes.includes("w-11"), "Must specify h-11 w-11");
      assert.ok(classes.includes("min-h-[44px]") && classes.includes("min-w-[44px]"), "Must specify min-h-[44px] min-w-[44px]");
      assert.ok(classes.includes("touch-manipulation"), "Must specify touch-manipulation");
    });

    it("2.2 Icon button (default) enforces h-11 w-11 min-h-[44px] min-w-[44px]", () => {
      assert.ok(
        themeContent.includes("h-11 w-11 min-h-[44px] min-w-[44px]"),
        "ThemeToggle icon mode must declare h-11 w-11 min-h-[44px] min-w-[44px]"
      );
      assert.ok(
        themeContent.includes("touch-manipulation"),
        "ThemeToggle must declare touch-manipulation"
      );
    });

    it("2.3 Labeled button enforces min-h-[44px] h-11", () => {
      assert.ok(
        themeContent.includes("min-h-[44px] h-11"),
        "ThemeToggle with label must declare min-h-[44px] h-11"
      );
    });
  });

  // =========================================================================
  // 3. MobileBottomNav Dock & Touch Targets
  // =========================================================================
  describe("3. MobileBottomNav Floating Dock & 48px Touch Targets", () => {
    const navPath = path.join(rootDir, "src/components/layout/MobileBottomNav.tsx");
    assert.ok(fs.existsSync(navPath), "MobileBottomNav.tsx must exist");
    const navContent = fs.readFileSync(navPath, "utf-8");

    it("3.1 Container is configured as a floating glass pill with safe padding", () => {
      assert.ok(navContent.includes("fixed bottom-3 left-3 right-3"), "Must be a floating pill off viewport edges");
      assert.ok(navContent.includes("rounded-2xl"), "Must have rounded-2xl glass corners");
      assert.ok(navContent.includes("pb-safe"), "Must include pb-safe for iPhone home indicators");
      assert.ok(navContent.includes("grid h-16 grid-cols-5"), "Must have grid h-16 grid-cols-5");
    });

    it("3.2 All 5 navigation items maintain min-h-[48px] with touch-manipulation", () => {
      // 1. Home
      assert.ok(
        navContent.includes('href="/"') && navContent.includes("min-h-[48px]") && navContent.includes("touch-manipulation"),
        "Home item must have min-h-[48px] and touch-manipulation"
      );
      // 2. Workspace
      assert.ok(
        navContent.includes('href="/workspace"') && navContent.includes("min-h-[48px]"),
        "Workspace item must have min-h-[48px]"
      );
      // 3. Search (CommandCenter trigger)
      assert.ok(
        navContent.includes("setCommandCenterOpen(true)") && navContent.includes("min-h-[48px]"),
        "CommandCenter trigger item must have min-h-[48px]"
      );
      // 4. Tools
      assert.ok(
        navContent.includes('href="/tools"') && navContent.includes("min-h-[48px]"),
        "Tools item must have min-h-[48px]"
      );
      // 5. History
      assert.ok(
        navContent.includes('href="/history"') && navContent.includes("min-h-[48px]"),
        "History item must have min-h-[48px]"
      );

      // Verify count of min-h-[48px] occurrences
      const occurrences = (navContent.match(/min-h-\[48px\]/g) || []).length;
      assert.strictEqual(occurrences, 5, "Exactly 5 navigation buttons/links must have min-h-[48px]");
    });
  });

  // =========================================================================
  // 4. Modals: Close Buttons & Interactive Bounding Boxes
  // =========================================================================
  describe("4. Modals Close Buttons & Interactive Touch Bounds", () => {
    it("4.1 DownloadCenterModal close button maintains min-h-[44px] min-w-[44px]", () => {
      const modalPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");

      const btn = getButtonSnippet(content, "setDownloadCenterOpen(false)");
      assert.ok(btn.includes("min-h-[44px]"), "Must have min-h-[44px]");
      assert.ok(btn.includes("min-w-[44px]"), "Must have min-w-[44px]");
      assert.ok(btn.includes("touch-manipulation"), "Must have touch-manipulation");
    });

    it("4.2 FileDeliveredModal close button maintains min-h-[44px] min-w-[44px]", () => {
      const modalPath = path.join(rootDir, "src/components/download/FileDeliveredModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");

      const btn = getButtonSnippet(content, 'aria-label="Close delivery modal"');
      assert.ok(btn.includes("min-h-[44px]"), "Must have min-h-[44px]");
      assert.ok(btn.includes("min-w-[44px]"), "Must have min-w-[44px]");
      assert.ok(btn.includes("touch-manipulation"), "Must have touch-manipulation");
    });

    it("4.3 SupportModal close button maintains min-h-[44px] min-w-[44px]", () => {
      const modalPath = path.join(rootDir, "src/components/support/SupportModal.tsx");
      const content = fs.readFileSync(modalPath, "utf-8");

      const btn = getButtonSnippet(content, 'aria-label="Close support dialog"');
      assert.ok(btn.includes("min-h-[44px]"), "Must have min-h-[44px]");
      assert.ok(btn.includes("min-w-[44px]"), "Must have min-w-[44px]");
      assert.ok(btn.includes("touch-manipulation"), "Must have touch-manipulation");
    });

    it("4.4 SupportPrompt dismiss button maintains min-h-[44px] min-w-[44px]", () => {
      const promptPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const content = fs.readFileSync(promptPath, "utf-8");

      const btn = getButtonSnippet(content, 'aria-label="Dismiss support prompt"');
      assert.ok(btn.includes("min-h-[44px]"), "Must have min-h-[44px]");
      assert.ok(btn.includes("min-w-[44px]"), "Must have min-w-[44px]");
      assert.ok(btn.includes("touch-manipulation"), "Must have touch-manipulation");
    });

    it("4.5 CommandCenter clear button maintains min-h-[44px] min-w-[44px] and options have min-h-[48px]", () => {
      const ccPath = path.join(rootDir, "src/components/command/CommandCenter.tsx");
      const content = fs.readFileSync(ccPath, "utf-8");

      const btn = getButtonSnippet(content, 'aria-label="Clear search input"');
      assert.ok(btn.includes("min-h-[44px]"), "Clear button must have min-h-[44px]");
      assert.ok(btn.includes("min-w-[44px]"), "Clear button must have min-w-[44px]");
      assert.ok(btn.includes("touch-manipulation"), "Clear button must have touch-manipulation");

      assert.ok(content.includes("min-h-[48px]"), "CommandCenter option items must declare min-h-[48px]");
    });

    it("4.6 DownloadDock control and item buttons maintain min-h-[44px] min-w-[44px]", () => {
      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
      const content = fs.readFileSync(dockPath, "utf-8");

      // Minimize button
      const minBtn = getButtonSnippet(content, 'isMinimized ? "Expand dock" : "Minimize dock"');
      assert.ok(minBtn.includes("min-h-[44px]"), "Minimize button must declare min-h-[44px]");
      assert.ok(minBtn.includes("min-w-[44px]"), "Minimize button must declare min-w-[44px]");

      // Clear button
      const clearBtn = getButtonSnippet(content, 'aria-label="Clear download dock"');
      assert.ok(clearBtn.includes("min-h-[44px]"), "Clear button must declare min-h-[44px]");
      assert.ok(clearBtn.includes("min-w-[44px]"), "Clear button must declare min-w-[44px]");

      // Item re-download & dismiss
      assert.ok(content.includes("min-h-[44px] min-w-[44px] items-center justify-center"), "DownloadDock items must have >=44px buttons");
    });
  });

  // =========================================================================
  // 5. WorkspaceDrawer: Tool Switchers & Card Actions
  // =========================================================================
  describe("5. WorkspaceDrawer Interactive Standards", () => {
    const drawerPath = path.join(rootDir, "src/components/workspace/WorkspaceDrawer.tsx");
    assert.ok(fs.existsSync(drawerPath), "WorkspaceDrawer.tsx must exist");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    it("5.1 Close button maintains h-11 w-11 (44x44px)", () => {
      const btn = getButtonSnippet(drawerContent, 'aria-label="Close workspace"');
      assert.ok(btn.includes("h-11") && btn.includes("w-11"), "Close button must have h-11 w-11");
    });

    it("5.2 All 10 tool switcher buttons declare min-h-[44px] and touch-manipulation", () => {
      const tools = [
        "/compress-image",
        "/resize-image",
        "/convert-image",
        "/smart-compress",
        "/batch",
        "/images-to-pdf",
        "/pdf-merge",
        "/pdf-split",
        "/pdf-compress",
        "/pdf-workspace",
      ];

      for (const tool of tools) {
        const btn = getButtonSnippet(drawerContent, `navigateToTool("${tool}")`);
        assert.ok(btn.includes("min-h-[44px]"), `Tool switcher ${tool} must have min-h-[44px]`);
        assert.ok(btn.includes("touch-manipulation"), `Tool switcher ${tool} must have touch-manipulation`);
      }
    });

    it("5.3 Card action buttons maintain >=44px touch targets", () => {
      // Reuse button: min-h-[44px]
      const reuseBtn = getButtonSnippet(drawerContent, "promoteOutputToInput(item.id)");
      assert.ok(reuseBtn.includes("min-h-[44px]"), "Reuse button must have min-h-[44px]");
      assert.ok(reuseBtn.includes("touch-manipulation"), "Reuse button must have touch-manipulation");

      // Download button: min-h-[44px] min-w-[44px]
      const dlBtn = getButtonSnippet(drawerContent, 'title="Download processed file"');
      assert.ok(dlBtn.includes("min-h-[44px]"), "Download button must have min-h-[44px]");
      assert.ok(dlBtn.includes("min-w-[44px]"), "Download button must have min-w-[44px]");
      assert.ok(dlBtn.includes("touch-manipulation"), "Download button must have touch-manipulation");

      // Delete button: min-h-[44px] min-w-[44px]
      const delBtn = getButtonSnippet(drawerContent, 'title="Remove from workspace"');
      assert.ok(delBtn.includes("min-h-[44px]"), "Remove button must have min-h-[44px]");
      assert.ok(delBtn.includes("min-w-[44px]"), "Remove button must have min-w-[44px]");
      assert.ok(delBtn.includes("touch-manipulation"), "Remove button must have touch-manipulation");
    });
  });
});
