# Test Suite Synchronization Plan: Adversarial Tests for Milestone 1 Remediation

**Author**: `explorer_m1_r3_3` (Test Suite Sync Explorer)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Target Milestone**: Milestone 1 (Design System & Global Shell) — Iteration 3 Synchronization  
**Date**: 2026-10-22  

---

## 1. Executive Summary & Problem Analysis

In Milestone 1 Iteration 2, the Empirical Contrast & Layout Challenger (`challenger_m1_r2_1`) identified two concrete failures in the application shell via `filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts`:

1. **Task 2.2 (Contrast Regression on Hover)**: `WorkspaceDrawer.tsx` line 384 uses `hover:bg-[hsl(var(--primary))] hover:text-white`. In dark mode, `--primary` is `217 91% 60%` (`#3B82F6`), on which `#FFFFFF` achieves only **3.63:1** contrast, violating WCAG 2.1 AA SC 1.4.3 ($\ge 4.5:1$). The required fix is replacing `hover:text-white` with `hover:text-[hsl(var(--primary-foreground))]`, which achieves **4.93:1** contrast.
2. **Task 4.1 (Mobile Layout Collision)**: On viewports `<640px`, `DownloadDock` expands to a top coordinate of **307px** from the viewport bottom when active deliveries exist (80px base + 65px header + 160px items container + 2px borders). `SupportPrompt` was anchored to `bottom-72` (**288px**), causing a **19px physical collision** (`288px - 307px = -19px`) and visual/touch interception of the DownloadDock header controls. The required fix is upgrading the mobile anchor to `bottom-80` (20rem = **320px**) or `bottom-[320px]`, providing **+13px positive clearance**.

### Critical Discovery Across Test Suites
During our investigation across all 10 test suites in `filefixer/tests/`, we identified a crucial cross-suite dependency:
- `adversarial-contrast-layout-challenger-m1r2.test.ts` contains the challenger oracles for Task 2.2 and Task 4.1.
- `m1-adversarial.test.ts` is the permanent Milestone 1 suite, but **currently lacks tests** for button hover states in the shell and `SupportPrompt` mobile clearance. It must be updated to prevent regressions in future milestones.
- `adversarial-modal-accessibility.test.ts` line 106 currently **hardcodes an assertion on `"bottom-72"`** (`ADV-SP-1`). If `SupportPrompt.tsx` is updated to `bottom-80` or `bottom-[320px]` without updating `ADV-SP-1`, this suite will fail during `npm test`!

---

## 2. Test Suite 1: `adversarial-contrast-layout-challenger-m1r2.test.ts`

### 2.1 Analysis
- **Task 2.2**: Currently asserts `hasRegressedHover === false` (checking that `"hover:bg-[hsl(var(--primary))] hover:text-white"` is absent). It does not affirmatively verify that the button has adopted `hover:text-[hsl(var(--primary-foreground))]`, nor does it verify that the contrast of `primary-foreground` on dark `primary` achieves $\ge 4.5:1$.
- **Task 4.1**: Currently uses regex `/hasDownloads\s*\?\s*"bottom-([0-9]+|\[[0-9]+px\])/` to parse the Tailwind class, translates it to pixels, and asserts `clearance >= 0`. While this formula already accommodates `bottom-80` (80 * 4 = 320px) and `bottom-[320px]` (320px), tightening it with an explicit token assertion ensures that regressions to intermediate inadequate values (e.g., `bottom-76` = 304px < 307px) are prevented.

### 2.2 Exact Diff Recommendation for `adversarial-contrast-layout-challenger-m1r2.test.ts`

```diff
--- a/filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts
+++ b/filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts
@@ -151,13 +151,13 @@ describe("Empirical Challenger M1 Iteration 2: Contrast & Layout Stress Suite",
     });
 
-    it("2.2 Application shell WorkspaceDrawer must not use hover:text-white on dark primary button", () => {
+    it("2.2 Application shell WorkspaceDrawer must use semantic primary-foreground on hover without contrast regression", () => {
       const drawerPath = path.join(rootDir, "src/components/workspace/WorkspaceDrawer.tsx");
       const drawerContent = fs.readFileSync(drawerPath, "utf-8");
 
-      // Check whether WorkspaceDrawer line 384 regresses contrast
+      // Check whether WorkspaceDrawer line 384 regresses contrast with hover:text-white
       const hasRegressedHover = drawerContent.includes(
         "hover:bg-[hsl(var(--primary))] hover:text-white"
       );
 
       // Calculate the contrast of white on dark primary
@@ -172,6 +172,21 @@ describe("Empirical Challenger M1 Iteration 2: Contrast & Layout Stress Suite",
         hasRegressedHover,
         false,
         `WorkspaceDrawer line 384 regresses contrast to ${crWhiteOnDarkPrimary.toFixed(2)}:1 on hover in dark mode (fails WCAG AA 4.5:1)`
       );
+
+      // Affirmative assertion: WorkspaceDrawer must use semantic hover:text-[hsl(var(--primary-foreground))]
+      assert.ok(
+        drawerContent.includes("hover:text-[hsl(var(--primary-foreground))]"),
+        "WorkspaceDrawer download button must use semantic hover:text-[hsl(var(--primary-foreground))]"
+      );
+
+      // Verify semantic hover contrast meets or exceeds WCAG AA (>= 4.5:1)
+      const crSemanticHover = getContrast(
+        parseHsl(darkTokens["primary-foreground"]),
+        parseHsl(darkTokens["primary"])
+      );
+      console.log(`[Task 2.2] Dark primary button hover contrast with semantic token: ${crSemanticHover.toFixed(3)}:1`);
+      assert.ok(
+        crSemanticHover >= 4.5,
+        `Dark primary button hover contrast ${crSemanticHover.toFixed(2)}:1 must be >= 4.5:1`
+      );
     });
   });
@@ -244,7 +259,13 @@ describe("Empirical Challenger M1 Iteration 2: Contrast & Layout Stress Suite",
       console.log(`[Task 4.1] DownloadDock top coordinate from viewport bottom: ${dockTopCoordinatePx}px`);
 
       // SupportPrompt mobile bottom offset when hasDownloads is true:
-      // Expecting bottom-72 (18rem = 288px) in current code
+      // Must be at least 320px (bottom-80 or bottom-[320px]) to provide positive clearance over 307px dock
+      assert.ok(
+        promptContent.includes("bottom-80") || promptContent.includes("bottom-[320px]"),
+        "SupportPrompt must specify bottom-80 (20rem = 320px) or bottom-[320px] when hasDownloads is true to clear DownloadDock (307px)"
+      );
+
       const promptBottomRemMatch = promptContent.match(/hasDownloads\s*\?\s*"bottom-([0-9]+|\[[0-9]+px\])/);
       assert.ok(promptBottomRemMatch, "SupportPrompt must dynamically adjust bottom offset when hasDownloads is true");
 
```

---

## 3. Test Suite 2: `m1-adversarial.test.ts`

### 3.1 Analysis
`m1-adversarial.test.ts` serves as the primary milestone test gate. Currently:
- **Section 1 (Contrast Ratios)** has tests 1.1 through 1.10, covering static token contrast. It does NOT test hover contrast on dark primary buttons in the application shell.
- **Section 2 (Touch Targets)** tests hit-boxes.
- **Section 3 (Visual Resiliency, Overflow & Safe Areas)** has tests 3.1 and 3.2, covering footer safe areas and slider handles. It does NOT verify physical clearance between stacked floating components on mobile viewports.

To ensure long-term architectural stability across M2–M6:
1. Add **Test 1.11**: Verifies hover contrast on primary buttons across application shell components (`WorkspaceDrawer.tsx`, `DownloadDock.tsx`, `DownloadCenterModal.tsx`).
2. Add **Test 3.3**: Verifies mobile clearance and non-collision between `SupportPrompt.tsx` and `DownloadDock.tsx` on `<640px` screens.

### 3.2 Exact Diff Recommendation for `m1-adversarial.test.ts`

```diff
--- a/filefixer/tests/m1-adversarial.test.ts
+++ b/filefixer/tests/m1-adversarial.test.ts
@@ -270,6 +270,33 @@ describe("Adversarial M1 Verification: WCAG Contrast & Touch Target Hit-boxes",
       assert.ok(crDarkCard >= 4.5, `Dark destructive on card ${crDarkCard.toFixed(2)}:1 fails WCAG AA`);
       assert.ok(crDarkSurface >= 4.5, `Dark destructive on surface ${crDarkSurface.toFixed(2)}:1 fails WCAG AA`);
     });
+
+    it("1.11 Application shell primary button hover contrast: WorkspaceDrawer, DownloadDock, DownloadCenterModal", () => {
+      const drawerPath = path.join(rootDir, "src/components/workspace/WorkspaceDrawer.tsx");
+      const drawerContent = fs.readFileSync(drawerPath, "utf-8");
+      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
+      const dockContent = fs.readFileSync(dockPath, "utf-8");
+      const modalPath = path.join(rootDir, "src/components/download/DownloadCenterModal.tsx");
+      const modalContent = fs.readFileSync(modalPath, "utf-8");
+
+      // Ensure none of the shell components use hardcoded hover:text-white on primary buttons
+      assert.ok(!drawerContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"), "WorkspaceDrawer must not use hover:text-white on primary button");
+      assert.ok(!dockContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"), "DownloadDock must not use hover:text-white on primary button");
+      assert.ok(!modalContent.includes("hover:bg-[hsl(var(--primary))] hover:text-white"), "DownloadCenterModal must not use hover:text-white on primary button");
+
+      // Ensure WorkspaceDrawer uses semantic primary-foreground on hover
+      assert.ok(
+        drawerContent.includes("hover:text-[hsl(var(--primary-foreground))]"),
+        "WorkspaceDrawer must declare hover:text-[hsl(var(--primary-foreground))]"
+      );
+
+      // Verify semantic token contrast against dark primary
+      const crHover = getContrast(
+        parseHsl(darkTokens["primary-foreground"]),
+        parseHsl(darkTokens["primary"])
+      );
+      console.log(`[Contrast] Dark primary hover contrast with primary-foreground: ${crHover.toFixed(2)}:1`);
+      assert.ok(crHover >= 4.5, `Dark primary hover contrast ${crHover.toFixed(2)}:1 fails WCAG AA`);
+    });
   });
 
   // -------------------------------------------------------------------------
@@ -439,6 +466,35 @@ describe("Adversarial M1 Verification: WCAG Contrast & Touch Target Hit-boxes",
         css.includes("height: 44px"),
         "Comparison slider handle must be >=44px"
       );
     });
+
+    it("3.3 Mobile viewport clearance: SupportPrompt vs DownloadDock vertical stacking (<640px)", () => {
+      const dockPath = path.join(rootDir, "src/components/download/DownloadDock.tsx");
+      const dockContent = fs.readFileSync(dockPath, "utf-8");
+      const promptPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
+      const promptContent = fs.readFileSync(promptPath, "utf-8");
+
+      // DownloadDock mobile dimensions: 80px bottom + 65px header + 160px items container + 2px border = 307px
+      assert.ok(dockContent.includes("bottom-20"), "DownloadDock must anchor at bottom-20 on mobile");
+      const dockTopCoordinatePx = 80 + 65 + 160 + 2; // 307px
+
+      // SupportPrompt mobile offset when downloads exist must be at least 320px (bottom-80 or bottom-[320px])
+      assert.ok(
+        promptContent.includes("bottom-80") || promptContent.includes("bottom-[320px]"),
+        "SupportPrompt must shift to bottom-80 (320px) or bottom-[320px] when active deliveries exist"
+      );
+
+      const promptMatch = promptContent.match(/hasDownloads\s*\?\s*"bottom-([0-9]+|\[[0-9]+px\])/);
+      assert.ok(promptMatch, "SupportPrompt must dynamically adjust bottom offset based on hasDownloads");
+
+      let promptBottomPx = 0;
+      if (promptMatch[1].startsWith("[")) {
+        promptBottomPx = parseInt(promptMatch[1].replace(/[\[\]px]/g, ""), 10);
+      } else {
+        promptBottomPx = parseInt(promptMatch[1], 10) * 4;
+      }
+
+      const clearance = promptBottomPx - dockTopCoordinatePx;
+      console.log(`[Clearance] SupportPrompt bottom (${promptBottomPx}px) vs DownloadDock top (${dockTopCoordinatePx}px): ${clearance}px`);
+      assert.ok(clearance >= 0, `SupportPrompt collides with DownloadDock by ${Math.abs(clearance)}px on mobile viewports`);
+    });
   });
 });
```

---

## 4. Test Suite 3 (Downstream Sync): `adversarial-modal-accessibility.test.ts`

### 4.1 Analysis
In `filefixer/tests/adversarial-modal-accessibility.test.ts`, line 102–109:
```ts
    it("ADV-SP-1: SupportPrompt coordinates vertical stacking when DownloadDock has items", () => {
      const spPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const spSource = fs.readFileSync(spPath, "utf-8");
      assert.ok(
        spSource.includes("downloadQueue") && spSource.includes("bottom-72"),
        "SupportPrompt must shift higher (bottom-72) when downloadQueue has active items to prevent collision"
      );
    });
```
This test was written in Iteration 1 when `bottom-72` was believed to be sufficient. If the implementer replaces `bottom-72` with `bottom-80` or `bottom-[320px]` in `SupportPrompt.tsx`, this assertion will throw an `AssertionError` if `bottom-72` is completely removed!

### 4.2 Exact Diff Recommendation for `adversarial-modal-accessibility.test.ts`

```diff
--- a/filefixer/tests/adversarial-modal-accessibility.test.ts
+++ b/filefixer/tests/adversarial-modal-accessibility.test.ts
@@ -103,7 +103,7 @@ describe("Adversarial Milestone 1 Challenge: Modal Accessibility & Tabular Numer
       const spPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
       const spSource = fs.readFileSync(spPath, "utf-8");
       assert.ok(
-        spSource.includes("downloadQueue") && spSource.includes("bottom-72"),
-        "SupportPrompt must shift higher (bottom-72) when downloadQueue has active items to prevent collision"
+        spSource.includes("downloadQueue") && (spSource.includes("bottom-80") || spSource.includes("bottom-[320px]")),
+        "SupportPrompt must shift higher (bottom-80 or bottom-[320px]) when downloadQueue has active items to prevent collision"
       );
     });
   });
```

---

## 5. Implementer Reference Diffs for Component Source Files

For the implementation agent, here are the target source code diffs required to satisfy these updated test suites:

### 5.1 `filefixer/src/components/support/SupportPrompt.tsx`
```diff
--- a/filefixer/src/components/support/SupportPrompt.tsx
+++ b/filefixer/src/components/support/SupportPrompt.tsx
@@ -39,5 +39,5 @@ export function SupportPrompt() {
       className={cn(
         "fixed left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm md:bottom-6 z-40 animate-slide-up pointer-events-auto transition-all duration-300",
-        hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
+        hasDownloads ? "bottom-80 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
       )}
     >
```
*(Note: `bottom-80` = 20rem = 320px, giving 13px clearance above the 307px DownloadDock top. If explicit pixel notation is preferred, `bottom-[320px]` is equally valid and supported by all test regexes).*

### 5.2 `filefixer/src/components/workspace/WorkspaceDrawer.tsx`
```diff
--- a/filefixer/src/components/workspace/WorkspaceDrawer.tsx
+++ b/filefixer/src/components/workspace/WorkspaceDrawer.tsx
@@ -382,3 +382,3 @@ export function WorkspaceDrawer({
                               title="Download processed file"
-                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
+                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] transition-colors"
                             >
```

### 5.3 `filefixer/src/components/workspace/WorkspaceView.tsx` (Secondary Shell Component)
```diff
--- a/filefixer/src/components/workspace/WorkspaceView.tsx
+++ b/filefixer/src/components/workspace/WorkspaceView.tsx
@@ -627,3 +627,3 @@ export function WorkspaceView() {
                     <Link
                       href="/pdf-studio"
-                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
+                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] transition-colors"
                     >
```

---

## 6. Independent Verification Protocol

To independently verify these adjustments:

1. **Test Challenger Suite**:
   ```bash
   npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts
   ```
   *Expected outcome*: 8/8 tests pass (Tasks 2.2 and 4.1 pass with exit code 0).

2. **Test Milestone 1 Adversarial Suite**:
   ```bash
   npx tsx --test tests/m1-adversarial.test.ts
   ```
   *Expected outcome*: 22/22 tests pass (including new Tests 1.11 and 3.3).

3. **Test Modal Accessibility Suite**:
   ```bash
   npx tsx --test tests/adversarial-modal-accessibility.test.ts
   ```
   *Expected outcome*: 18/18 tests pass (including synchronized `ADV-SP-1`).

4. **Full Test Suite Gate**:
   ```bash
   npm test --prefix filefixer
   ```
   *Expected outcome*: 10 suites, 133+ tests, 100% pass, 0 failures, exit code 0.
