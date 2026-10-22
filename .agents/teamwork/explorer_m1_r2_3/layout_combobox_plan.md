# Remediation Plan: Layout Collisions & CommandCenter Combobox UX

**Author**: Layout & Combobox Remediation Explorer (`explorer_m1_r2_3`)  
**Target Milestone**: Milestone 1 (Design System & Global Application Shell)  
**Target Files**:
1. `filefixer/src/components/support/SupportPrompt.tsx`
2. `filefixer/src/components/download/DownloadDock.tsx`
3. `filefixer/src/components/command/CommandCenter.tsx`
4. `filefixer/tests/adversarial-modal-accessibility.test.ts`
**Reviewers / Stakeholders**: Orchestrator, Worker (`worker_m1`), Challengers (`challenger_m1_1`, `challenger_m1_2`)  
**Date**: 2026-10-22  

---

## 1. Executive Summary

Empirical audits by `challenger_m1_1` (Challenge 4 & 5) and `challenger_m1_2` (Challenge 4 & 5) identified three distinct defects affecting mobile responsiveness, layout coordination, and keyboard interaction:

| Defect ID | Component | Defect Description | Severity | Impact |
|---|---|---|---|---|
| **DEF-LAY-1** | `SupportPrompt.tsx` & `DownloadDock.tsx` | Mobile Layout Collision at `bottom-20` on `<640px` screens | **Medium-High** | Both components render at identical vertical coordinates (`bottom-20`), overlapping each other and blocking user tap zones. |
| **DEF-LAY-2** | `CommandCenter.tsx` | Footer text collision on 320px viewport | **Low-Medium** | Desktop shortcut badges (~202px) collide with privacy badge (~198px) in a 264px inner container, causing text clipping and awkward wrapping. |
| **DEF-UX-1** | `CommandCenter.tsx` | Combobox listbox buttons lack `tabIndex={-1}` and `onFocus` sync | **Medium** | Tabbing cycles through 24+ individual options, desynchronizing `selectedIndex` from visual DOM focus and violating WAI-ARIA Combobox pattern. |
| **DEF-UX-2** | `CommandCenter.tsx` | Uncanceled `setTimeout` on rapid open/close | **Low** | 50ms initial focus timer lacks `clearTimeout` in effect cleanup. |

This remediation plan provides the exact line-by-line diffs, geometric and architectural proofs, and automated test updates to permanently resolve all four defects.

---

## 2. Issue 1: Mobile Layout Collision between `DownloadDock` and `SupportPrompt`

### 2.1 Problem Analysis & Geometry

In the existing codebase:
- `DownloadDock.tsx` (line 35):
  ```tsx
  className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-full pointer-events-auto animate-dock-in"
  ```
- `SupportPrompt.tsx` (line 32):
  ```tsx
  className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 animate-slide-up pointer-events-auto"
  ```

#### Observed Failure Mode:
1. `MobileBottomNav` is `fixed bottom-0` with height `h-16` (64px / 4rem) on screens `< lg` (`< 1024px`).
2. Both `DownloadDock` and `SupportPrompt` anchor at `bottom-20` (80px / 5rem) on screens `< 640px` (`sm`).
3. When a user completes a file operation (e.g. compress, convert, merge), an item is added to `downloadQueue`. `DownloadDock` renders at `bottom-20`.
4. 1200ms later, `triggerSupportPrompt()` sets `isSupportPromptVisible: true`. `SupportPrompt` also renders at `bottom-20`.
5. On viewports `< 640px`, both containers are full-width cards (`left-4 right-4` or `right-4 w-full max-w-sm`) occupying the exact same vertical band (80px to ~230px). They occlude each other, rendering tap targets in both cards inaccessible.
6. Furthermore, on desktop (`md:` / `\ge 768px`), `SupportPrompt` remained at `bottom-20` (80px) despite the absence of `MobileBottomNav`, leaving unnecessary empty bottom margin.

### 2.2 Remediation Architecture

We coordinate layout using reactive state from `useFileStore()`:
1. In `SupportPrompt.tsx`, inspect `downloadQueue.length > 0`:
   - When `hasDownloads === true` on mobile (`< md`): `SupportPrompt` anchors at `bottom-72` (288px / 18rem).
   - When `hasDownloads === false` on mobile (`< md`): `SupportPrompt` anchors at `bottom-20` (80px / 5rem), clearing `MobileBottomNav` by 16px.
   - On desktop (`md:` / `\ge 768px`): `SupportPrompt` anchors at `md:bottom-6 md:left-6 md:right-auto md:max-w-sm` (24px from bottom on bottom-left).
2. In `DownloadDock.tsx`:
   - Enforce bounded horizontal margins on mobile (`left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm`), eliminating negative margin horizontal overflow on 320px screens.
   - Cap item list to `max-h-40 sm:max-h-60 overflow-y-auto` so multi-file queues on mobile do not exceed 204px total dock height.
   - Top of `DownloadDock` on mobile reaches at most $80\text{px} + 204\text{px} = 284\text{px}$.
   - Bottom of `SupportPrompt` at `bottom-72` is $288\text{px}$, leaving a guaranteed $\ge 4\text{px}$ to $98\text{px}$ clear vertical separation.
3. Add `transition-all duration-300` to `SupportPrompt` so that if downloads complete or are cleared while the prompt is displayed, the prompt glides smoothly between vertical positions without layout jumps.

### 2.3 Exact Line-by-Line Diffs

#### Target 1: `filefixer/src/components/support/SupportPrompt.tsx`

```diff
--- a/filefixer/src/components/support/SupportPrompt.tsx
+++ b/filefixer/src/components/support/SupportPrompt.tsx
@@ -5,11 +5,14 @@ import { X, Sparkles } from "lucide-react";
 import { useFileStore } from "@/stores/fileStore";
 import { Button } from "@/components/ui/button";
+import { cn } from "@/lib/utils";
 
 export function SupportPrompt() {
-  const { isSupportPromptVisible, openSupportModal, dismissSupportPrompt } =
-    useFileStore();
+  const {
+    isSupportPromptVisible,
+    openSupportModal,
+    dismissSupportPrompt,
+    downloadQueue,
+  } = useFileStore();
+
+  const hasDownloads = downloadQueue.length > 0;
 
   const promptRef = useRef<HTMLDivElement>(null);
@@ -29,5 +32,8 @@ export function SupportPrompt() {
     <div
       ref={promptRef}
       role="region"
       aria-live="polite"
       aria-label="Voluntary support prompt"
-      className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 animate-slide-up pointer-events-auto"
+      className={cn(
+        "fixed left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm md:bottom-6 z-40 animate-slide-up pointer-events-auto transition-all duration-300",
+        hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
+      )}
     >
```

#### Target 2: `filefixer/src/components/download/DownloadDock.tsx`

```diff
--- a/filefixer/src/components/download/DownloadDock.tsx
+++ b/filefixer/src/components/download/DownloadDock.tsx
@@ -32,5 +32,5 @@ export function DownloadDock() {
     <div
       aria-label="Floating Download Dock"
-      className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-full pointer-events-auto animate-dock-in"
+      className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm z-40 pointer-events-auto animate-dock-in"
     >
       <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.95)] backdrop-blur-md shadow-2xl transition-all">
@@ -80,4 +80,4 @@ export function DownloadDock() {
         {/* Stacked Delivery Items (shown if not minimized) */}
         {!isMinimized && (
-          <div className="max-h-60 overflow-y-auto divide-y divide-[hsl(var(--border)/0.4)] p-1.5 space-y-1">
+          <div className="max-h-40 sm:max-h-60 overflow-y-auto divide-y divide-[hsl(var(--border)/0.4)] p-1.5 space-y-1">
```

---

## 3. Issue 2: CommandCenter 320px Footer Squeeze

### 3.1 Problem Analysis & Geometry

In `CommandCenter.tsx` lines 553–568:
```tsx
{/* Footer info bar */}
<div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] px-4 py-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
  <div className="flex items-center gap-3">
    <span>
      Use <kbd className="font-mono bg-[hsl(var(--secondary))] px-1 py-0.5 rounded">↑</kbd>{" "}
      <kbd className="font-mono bg-[hsl(var(--secondary))] px-1 py-0.5 rounded">↓</kbd> to navigate
    </span>
    <span>
      <kbd className="font-mono bg-[hsl(var(--secondary))] px-1.5 py-0.5 rounded">↵</kbd> to execute
    </span>
  </div>
  <span className="font-mono text-emerald-500 font-medium">
    100% In-Browser • Zero Uploads
  </span>
</div>
```

#### Viewport Measurement on 320px Screen:
- Screen width = $320\text{px}$.
- Modal backdrop has `p-3 sm:p-6` $\to$ available modal dialog width = $320 - 2 \times 12 = 296\text{px}$.
- Footer inner padding `px-4 py-2.5` $\to$ available inner width = $296 - 2 \times 16 = 264\text{px}$.
- Unwrapped width of shortcut badge instructions: $\approx 202\text{px}$.
- Unwrapped width of privacy badge (`100% In-Browser • Zero Uploads` in monospace 11px): $\approx 198\text{px}$.
- Combined width required: $202\text{px} + 198\text{px} = 400\text{px}$.
- Available width deficit: $400\text{px} - 264\text{px} = 136\text{px}$ overflow.
- In addition, physical arrow keys and Return key hints are non-functional and confusing to touch device users on mobile smartphones.

### 3.2 Remediation Architecture

1. Wrap the desktop keyboard shortcuts container with `hidden sm:flex`:
   - On `< 640px` (`sm`), the shortcut hint element is completely hidden (`display: none`), taking $0\text{px}$ width.
   - On $\ge 640px$ (`sm:`), it renders as `flex items-center gap-3`.
2. Update the parent footer layout to `justify-center sm:justify-between`:
   - On mobile, the single child element (`100% In-Browser • Zero Uploads`) is cleanly centered with generous padding and 0 clipping.
   - On desktop, `justify-between` positions shortcuts on the left and the privacy badge on the right.
3. Add `truncate` to the privacy badge span as an extra defensive measure against font-size scaling.

### 3.3 Exact Line-by-Line Diff

#### Target: `filefixer/src/components/command/CommandCenter.tsx`

```diff
--- a/filefixer/src/components/command/CommandCenter.tsx
+++ b/filefixer/src/components/command/CommandCenter.tsx
@@ -553,3 +553,3 @@ export function CommandCenter() {
         {/* Footer info bar */}
-        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] px-4 py-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
-          <div className="flex items-center gap-3">
+        <div className="flex items-center justify-center sm:justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] px-4 py-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
+          <div className="hidden sm:flex items-center gap-3">
             <span>
@@ -563,3 +563,3 @@ export function CommandCenter() {
           </div>
-          <span className="font-mono text-emerald-500 font-medium">
+          <span className="font-mono text-emerald-500 font-medium text-center sm:text-right truncate">
             100% In-Browser • Zero Uploads
```

---

## 4. Issue 3: CommandCenter Combobox Tab UX & Focus Desync

### 4.1 Problem Analysis

In WAI-ARIA Combobox pattern 1.2:
1. Keyboard focus remains in the `<input role="combobox">`.
2. Selection among listbox items is performed exclusively via `ArrowDown` and `ArrowUp`.
3. `aria-activedescendant` points to the active item's ID, and that item is visually highlighted.
4. Listbox option buttons must NOT be sequential Tab stops (`tabIndex={-1}`).
5. In the existing code:
   - Line 502 renders listbox items as `<button key={item.id} id={`command-opt-${item.id}`} ...>` without `tabIndex={-1}`.
   - Because they are native `<button>` elements, pressing `Tab` steps into each individual option button. Keyboard users must press Tab 24+ times just to wrap around the dialog.
   - When an option button receives focus via Tab or click, there is no `onFocus` handler. `selectedIndex` remains at `0` while browser focus moves to option 5, causing visual and state desynchronization.
   - Furthermore, in the Tab focus trap query selector (line 84):
     ```tsx
     const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
       'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]), [href]'
     );
     ```
     Because the selector includes `button:not([disabled])` without `:not([tabindex="-1"])`, standard CSS `querySelectorAll` would still include buttons even if they have `tabIndex={-1}`! To make the focus trap honor `tabIndex={-1}`, the selector must be updated to:
     `'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [href]'`
6. In line 119:
   `setTimeout(() => inputRef.current?.focus(), 50);` was not cleared in the `useEffect` cleanup function on rapid dismissal.

### 4.2 Remediation Architecture

1. Add `tabIndex={-1}` to every option button in the listbox mapping.
2. Add `onFocus={() => setSelectedIndex(idx)}` to synchronize `selectedIndex` and `aria-activedescendant` if an option receives focus.
3. Update the Tab focus trap selector to filter out `[tabindex="-1"]` buttons:
   `button:not([disabled]):not([tabindex="-1"])`.
4. Capture `timerId = setTimeout(...)` and invoke `clearTimeout(timerId)` in the effect cleanup.

### 4.3 Exact Line-by-Line Diff

#### Target: `filefixer/src/components/command/CommandCenter.tsx`

```diff
--- a/filefixer/src/components/command/CommandCenter.tsx
+++ b/filefixer/src/components/command/CommandCenter.tsx
@@ -83,4 +83,4 @@ export function CommandCenter() {
       // Tab Focus Trap
       if (e.key === "Tab" && modalContainerRef.current) {
         const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
-          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]), [href]'
+          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [href]'
         );
@@ -118,3 +118,3 @@ export function CommandCenter() {
       document.body.style.overflow = "hidden";
-      setTimeout(() => inputRef.current?.focus(), 50);
+      const timerId = setTimeout(() => inputRef.current?.focus(), 50);
 
       return () => {
+        clearTimeout(timerId);
         document.body.style.overflow = originalOverflow;
@@ -501,4 +501,6 @@ export function CommandCenter() {
               return (
                 <button
                   key={item.id}
                   id={`command-opt-${item.id}`}
+                  tabIndex={-1}
                   onClick={item.action}
                   onMouseEnter={() => setSelectedIndex(idx)}
+                  onFocus={() => setSelectedIndex(idx)}
                   className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
```

---

## 5. Test Suite Updates & Regression Prevention

In `filefixer/tests/adversarial-modal-accessibility.test.ts`, `challenger_m1_2` wrote test assertions designed to confirm the pre-remediation vulnerabilities (checking `assert.strictEqual(..., false)`).

With the remediation applied, update the test suite to permanently enforce the fix:

### Exact Diff for `filefixer/tests/adversarial-modal-accessibility.test.ts`

```diff
--- a/filefixer/tests/adversarial-modal-accessibility.test.ts
+++ b/filefixer/tests/adversarial-modal-accessibility.test.ts
@@ -75,6 +75,3 @@ export function suite() {
       // Check if clearTimeout exists in cleanup
       const hasClearTimeout = ccSource.includes("clearTimeout");
-      if (!hasClearTimeout) {
-        // Document vulnerability: unmanaged timer on rapid open/close
-        console.warn("FINDING: CommandCenter schedules setTimeout(focus, 50) without clearing it in cleanup on rapid dismiss.");
-      }
+      assert.ok(hasClearTimeout, "CommandCenter must clear initial focus timeout on unmount");
     });
 
-    it("ADV-CC-5: Tab Focus Trap & Combobox Listbox Option Desync Vulnerability", () => {
+    it("ADV-CC-5: Tab Focus Trap & Combobox Listbox Option Desync Remediated", () => {
       // In WAI-ARIA Combobox, listbox options should have tabIndex={-1} because selection is via Arrow keys.
-      // If rendered as native <button> without tabIndex="-1", each item becomes an explicit tab stop.
       const hasOptionButtons = ccSource.includes("<button\n                  key={item.id}\n                  id={`command-opt-${item.id}`}") ||
         ccSource.includes('role="option"');
       assert.ok(hasOptionButtons, "Listbox items are rendered as buttons with role='option'");
 
       const hasTabIndexMinusOne = ccSource.includes('tabIndex={-1}') || ccSource.includes('tabIndex="-1"');
-      assert.strictEqual(hasTabIndexMinusOne, false, 
-        "VULNERABILITY CONFIRMED: Options lack tabIndex={-1}. All 24+ items are tab-stops, forcing keyboard users to Tab through every item before wrapping.");
+      assert.strictEqual(hasTabIndexMinusOne, true, 
+        "Remediated: Options have tabIndex={-1} to prevent listbox buttons from creating 24+ unwanted Tab stops.");
 
       const hasOnFocusOnOption = ccSource.includes("onFocus={() => setSelectedIndex(idx)}");
-      assert.strictEqual(hasOnFocusOnOption, false,
-        "VULNERABILITY CONFIRMED: Options have onMouseEnter but NO onFocus handler. Tabbing onto an option fails to update selectedIndex or aria-activedescendant, causing visual/state desync.");
+      assert.strictEqual(hasOnFocusOnOption, true, 
+        "Remediated: Options have onFocus handler to synchronize selectedIndex and prevent visual/state desync.");
     });
+
+    it("ADV-CC-6: Responsive footer hides desktop shortcuts on mobile", () => {
+      assert.ok(
+        ccSource.includes("hidden sm:flex") && ccSource.includes("100% In-Browser • Zero Uploads"),
+        "CommandCenter footer must hide keyboard shortcuts on mobile via hidden sm:flex to prevent 320px clipping"
+      );
+    });
+
+    it("ADV-SP-1: SupportPrompt coordinates vertical stacking when DownloadDock has items", () => {
+      const spPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
+      const spSource = fs.readFileSync(spPath, "utf-8");
+      assert.ok(
+        spSource.includes("downloadQueue") && spSource.includes("bottom-72"),
+        "SupportPrompt must shift higher (bottom-72) when downloadQueue has active items to prevent collision"
+      );
+    });
```

---

## 6. Verification Protocol

The implementer (`worker_m1`) should verify the implementation using the following steps:

1. **Static Analysis & Type Checking**:
   ```powershell
   npm run build --prefix filefixer
   ```
   *Expected*: Build completes with exit code 0 and all 33 static routes generated.
2. **Automated Test Execution**:
   ```powershell
   npm test --prefix filefixer
   ```
   *Expected*: All 109+ tests pass (including ADV-CC-5, ADV-CC-6, ADV-SP-1, and regression suites).
3. **Manual Viewport Inspection**:
   - Set viewport width to 320px (iPhone SE). Open CommandCenter (`Ctrl+K`). Verify footer shows "100% In-Browser • Zero Uploads" centered with 0 horizontal overflow or clipped text.
   - In CommandCenter, press `Tab`. Verify focus moves to Clear button `X` (if query typed) or remains constrained on `<input>`, without tabbing through 24 listbox items.
   - In CommandCenter, press `ArrowDown`. Verify selection moves down item by item.
   - Trigger file download. Verify `DownloadDock` appears above `MobileBottomNav` at `bottom-20`. When `SupportPrompt` triggers, verify it cleanly renders at `bottom-72` without occluding `DownloadDock`.
