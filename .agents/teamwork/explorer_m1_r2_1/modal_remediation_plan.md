# Modal Accessibility Remediation Plan (Iteration 2)

**Author**: Modal Accessibility Remediation Explorer (`explorer_m1_r2_1`)  
**Date**: 2026-10-22  
**Milestone**: Milestone 1 (Design System & Global Shell) - Remediation Iteration 2  
**Target Files**:
1. `filefixer/src/components/support/SupportModal.tsx`
2. `filefixer/src/components/download/DownloadCenterModal.tsx`
3. `filefixer/src/components/download/FileDeliveredModal.tsx`  
**Test Suite Impact**: `filefixer/tests/adversarial-modal-accessibility.test.ts`

---

## 1. Executive Summary

Empirical testing conducted by `challenger_m1_2` revealed critical accessibility deficiencies across the three primary application shell modal dialogs:
- **`SupportModal.tsx`**: Declared `aria-modal="true"` and trapped Escape/body scroll, but completely omitted Tab/Shift-Tab key focus trapping and initial focus placement. Keyboard focus escaped into background navigation elements, violating WCAG 2.1.2.
- **`DownloadCenterModal.tsx`**: Completely passive presentational dialog. Lacked Escape dismissal, Tab focus trapping, body scroll locking, initial focus placement, and opener focus restoration.
- **`FileDeliveredModal.tsx`**: Celebratory delivery modal card completely passive to keyboard events. Lacked Escape dismissal, Tab focus trapping, body scroll locking, initial focus placement, and opener focus restoration.

This remediation plan provides the exact, production-ready code diffs to bring all three components into full compliance with **WCAG 2.1.1 (Keyboard Accessible)**, **WCAG 2.1.2 (No Keyboard Trap)**, **WCAG 2.4.3 (Focus Order)**, and the **WAI-ARIA Dialog (Modal) Pattern**.

---

## 2. Shared Focus Trapping & Lifecycle Pattern

To ensure predictable behavior across the application shell, all three modals adhere to the same unified pattern:

1. **DOM References**:
   - `modalContainerRef`: Attached to the dialog content wrapper `div` to bound focus containment (`querySelectorAll`).
   - `closeButtonRef`: Attached to the prominent header/card close button `<button aria-label="...">` for deterministic initial focus.
   - `previousFocusRef`: Stores `document.activeElement` when the modal opens to restore focus to the triggering element upon dismissal.
2. **Initial Focus Placement**:
   - Synchronously calls `closeButtonRef.current?.focus()` on mount.
   - Schedules a 30ms fallback timer `setTimeout(() => closeButtonRef.current?.focus(), 30)` to safeguard against CSS animation delays (`animate-scale-in`, `animate-slide-up`).
   - The timer ID is tracked and cleanly canceled via `clearTimeout(timerId)` during unmount/cleanup, eliminating unmanaged timer leaks.
3. **Tab / Shift-Tab Trapping Loop**:
   - Intercepts `e.key === "Tab"` within `keydown` listener on `window`.
   - Queries all focusable elements inside `modalContainerRef.current`:
     `button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`
   - If 0 focusable elements: prevents default.
   - If `e.shiftKey` (Shift+Tab): if `document.activeElement === first` or focus escaped outside the modal container, prevents default and focuses `last`.
   - If standard Tab: if `document.activeElement === last` or focus escaped outside the modal container, prevents default and focuses `first`.
4. **Escape Key Dismissal**:
   - Intercepts `e.key === "Escape"`, prevents default, and invokes the modal's close/dismiss action.
5. **Background Scroll Lock & Opener Focus Restoration**:
   - Captures `originalOverflow = document.body.style.overflow` and sets `document.body.style.overflow = "hidden"` on mount.
   - In cleanup: restores `document.body.style.overflow = originalOverflow`, removes the `keydown` listener, cancels the focus timer, and calls `previousFocusRef.current?.focus()`.

---

## 3. Component Remediation Specifications & Diffs

### 3.1 SupportModal.tsx

#### Problem Analysis
`SupportModal.tsx` already had body scroll locking, Escape dismissal, and focus restoration to opener via `previousFocusRef`. However, it lacked:
1. `closeButtonRef` and initial focus on the close button.
2. Tab / Shift-Tab focus trapping loop, allowing keyboard users to tab out into the background page.

#### Exact Unified Diff

```diff
--- a/filefixer/src/components/support/SupportModal.tsx
+++ b/filefixer/src/components/support/SupportModal.tsx
@@ -9,19 +9,55 @@ export function SupportModal() {
   const { isSupportModalOpen, closeSupportModal } = useFileStore();
   const [imageFailed, setImageFailed] = useState(false);
+  const modalContainerRef = useRef<HTMLDivElement>(null);
+  const closeButtonRef = useRef<HTMLButtonElement>(null);
   const previousFocusRef = useRef<HTMLElement | null>(null);
 
-  // Manage focus & background scroll lock
+  // Manage focus, Tab trapping & background scroll lock
   useEffect(() => {
     if (isSupportModalOpen) {
       previousFocusRef.current = document.activeElement as HTMLElement | null;
       const originalOverflow = document.body.style.overflow;
       document.body.style.overflow = "hidden";
 
+      // Initial focus on close button
+      closeButtonRef.current?.focus();
+      const timerId = setTimeout(() => {
+        closeButtonRef.current?.focus();
+      }, 30);
+
       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
+          e.preventDefault();
           closeSupportModal();
+          return;
+        }
+
+        // Tab Focus Trap Loop
+        if (e.key === "Tab" && modalContainerRef.current) {
+          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
+            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
+          );
+          if (focusable.length === 0) {
+            e.preventDefault();
+            return;
+          }
+
+          const first = focusable[0];
+          const last = focusable[focusable.length - 1];
+
+          if (e.shiftKey) {
+            if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
+              e.preventDefault();
+              last.focus();
+            }
+          } else {
+            if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
+              e.preventDefault();
+              first.focus();
+            }
+          }
         }
       };
 
       window.addEventListener("keydown", handleKeyDown);
 
       return () => {
+        clearTimeout(timerId);
         document.body.style.overflow = originalOverflow;
         window.removeEventListener("keydown", handleKeyDown);
         if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
@@ -49,11 +85,13 @@ export function SupportModal() {
       aria-describedby="support-dialog-desc"
     >
       <div
+        ref={modalContainerRef}
         className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7 shadow-2xl animate-slide-up sm:animate-scale-in text-center space-y-4"
         onClick={(e) => e.stopPropagation()}
       >
         {/* Visible Close Button */}
         <button
+          ref={closeButtonRef}
           type="button"
           onClick={closeSupportModal}
           className="absolute top-4 right-4 flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation cursor-pointer"
```

---

### 3.2 DownloadCenterModal.tsx

#### Problem Analysis
`DownloadCenterModal.tsx` lacked all modal event handling. When opened from `DownloadDock` via "View All":
1. Pressing Escape did nothing.
2. Pressing Tab escaped to background elements.
3. Background page scrolled freely.
4. Dismissing the modal lost focus instead of returning to the dock trigger.

#### Exact Unified Diff

```diff
--- a/filefixer/src/components/download/DownloadCenterModal.tsx
+++ b/filefixer/src/components/download/DownloadCenterModal.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import React from "react";
+import React, { useEffect, useRef } from "react";
 import {
   Download,
   Archive,
@@ -27,6 +27,69 @@ export function DownloadCenterModal() {
     setLatestDeliveredFile,
   } = useFileStore();
 
+  const modalContainerRef = useRef<HTMLDivElement>(null);
+  const closeButtonRef = useRef<HTMLButtonElement>(null);
+  const previousFocusRef = useRef<HTMLElement | null>(null);
+
+  // Manage focus, Tab trapping, Escape dismissal & body scroll lock
+  useEffect(() => {
+    if (isDownloadCenterOpen) {
+      previousFocusRef.current = document.activeElement as HTMLElement | null;
+      const originalOverflow = document.body.style.overflow;
+      document.body.style.overflow = "hidden";
+
+      // Initial focus on close button
+      closeButtonRef.current?.focus();
+      const timerId = setTimeout(() => {
+        closeButtonRef.current?.focus();
+      }, 30);
+
+      const handleKeyDown = (e: KeyboardEvent) => {
+        if (e.key === "Escape") {
+          e.preventDefault();
+          setDownloadCenterOpen(false);
+          return;
+        }
+
+        // Tab Focus Trap Loop
+        if (e.key === "Tab" && modalContainerRef.current) {
+          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
+            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
+          );
+          if (focusable.length === 0) {
+            e.preventDefault();
+            return;
+          }
+
+          const first = focusable[0];
+          const last = focusable[focusable.length - 1];
+
+          if (e.shiftKey) {
+            if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
+              e.preventDefault();
+              last.focus();
+            }
+          } else {
+            if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
+              e.preventDefault();
+              first.focus();
+            }
+          }
+        }
+      };
+
+      window.addEventListener("keydown", handleKeyDown);
+
+      return () => {
+        clearTimeout(timerId);
+        document.body.style.overflow = originalOverflow;
+        window.removeEventListener("keydown", handleKeyDown);
+        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
+          previousFocusRef.current.focus();
+        }
+      };
+    }
+  }, [isDownloadCenterOpen, setDownloadCenterOpen]);
+
   if (!isDownloadCenterOpen) return null;
 
   const validFiles = downloadQueue.filter((d) => d.blob);
@@ -55,6 +118,7 @@ export function DownloadCenterModal() {
       aria-label="Download Center"
     >
       <div
+        ref={modalContainerRef}
         className="w-full max-w-xl overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in flex flex-col max-h-[85vh]"
         onClick={(e) => e.stopPropagation()}
       >
@@ -72,6 +136,8 @@ export function DownloadCenterModal() {
             </div>
           </div>
           <button
+            ref={closeButtonRef}
+            type="button"
             onClick={() => setDownloadCenterOpen(false)}
             className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation cursor-pointer"
             aria-label="Close download center"
@@ -143,6 +209,7 @@ export function DownloadCenterModal() {
                 <div className="flex items-center gap-1.5 shrink-0">
                   {file.blob && (
                     <button
+                      type="button"
                       onClick={() => {
                         triggerDownload(file.blob!, file.fileName);
                         setLatestDeliveredFile(file);
@@ -154,6 +221,7 @@ export function DownloadCenterModal() {
                     </button>
                   )}
                   <button
+                    type="button"
                     onClick={() => removeDownload(file.id)}
                     className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] touch-manipulation cursor-pointer"
                     aria-label="Remove from list"
```

---

### 3.3 FileDeliveredModal.tsx

#### Problem Analysis
`FileDeliveredModal.tsx` was also completely passive. When a file processing job completed and the celebratory modal appeared:
1. Pressing Escape did not dismiss the card.
2. Pressing Tab allowed focus to wander into background page links.
3. Background body scroll was not locked.
4. Dismissing did not restore focus to the action trigger.

#### Exact Unified Diff

```diff
--- a/filefixer/src/components/download/FileDeliveredModal.tsx
+++ b/filefixer/src/components/download/FileDeliveredModal.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import React from "react";
+import React, { useEffect, useRef } from "react";
 import {
   Download,
   RefreshCw,
@@ -17,6 +17,70 @@ export function FileDeliveredModal() {
   const { latestDeliveredFile, setLatestDeliveredFile, promoteOutputToInput, files } =
     useFileStore();
 
+  const modalContainerRef = useRef<HTMLDivElement>(null);
+  const closeButtonRef = useRef<HTMLButtonElement>(null);
+  const previousFocusRef = useRef<HTMLElement | null>(null);
+
+  const isDeliveredOpen = Boolean(latestDeliveredFile);
+
+  // Manage focus, Tab trapping, Escape dismissal & body scroll lock
+  useEffect(() => {
+    if (isDeliveredOpen) {
+      previousFocusRef.current = document.activeElement as HTMLElement | null;
+      const originalOverflow = document.body.style.overflow;
+      document.body.style.overflow = "hidden";
+
+      // Initial focus on close button
+      closeButtonRef.current?.focus();
+      const timerId = setTimeout(() => {
+        closeButtonRef.current?.focus();
+      }, 30);
+
+      const handleKeyDown = (e: KeyboardEvent) => {
+        if (e.key === "Escape") {
+          e.preventDefault();
+          setLatestDeliveredFile(null);
+          return;
+        }
+
+        // Tab Focus Trap Loop
+        if (e.key === "Tab" && modalContainerRef.current) {
+          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
+            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
+          );
+          if (focusable.length === 0) {
+            e.preventDefault();
+            return;
+          }
+
+          const first = focusable[0];
+          const last = focusable[focusable.length - 1];
+
+          if (e.shiftKey) {
+            if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
+              e.preventDefault();
+              last.focus();
+            }
+          } else {
+            if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
+              e.preventDefault();
+              first.focus();
+            }
+          }
+        }
+      };
+
+      window.addEventListener("keydown", handleKeyDown);
+
+      return () => {
+        clearTimeout(timerId);
+        document.body.style.overflow = originalOverflow;
+        window.removeEventListener("keydown", handleKeyDown);
+        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
+          previousFocusRef.current.focus();
+        }
+      };
+    }
+  }, [isDeliveredOpen, setLatestDeliveredFile]);
+
   if (!latestDeliveredFile) return null;
 
   const handleDownloadAgain = () => {
@@ -56,11 +120,13 @@ export function FileDeliveredModal() {
       aria-label="File Delivered"
     >
       <div
+        ref={modalContainerRef}
         className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 shadow-2xl animate-scale-in text-center space-y-6"
         onClick={(e) => e.stopPropagation()}
       >
         {/* Close Button */}
         <button
+          ref={closeButtonRef}
+          type="button"
           onClick={() => setLatestDeliveredFile(null)}
           className="absolute top-4 right-4 flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation cursor-pointer"
           aria-label="Close delivery modal"
```

---

## 4. Test Suite Harmonization: `adversarial-modal-accessibility.test.ts`

When `challenger_m1_2` generated `filefixer/tests/adversarial-modal-accessibility.test.ts`, the tests were structured as defect assertions checking `assert.strictEqual(..., false)` so the test run would pass while logging the vulnerability.

Once the worker applies the remediation above, the adversarial test suite MUST be harmonized to assert that the remedies are active:

```diff
--- a/filefixer/tests/adversarial-modal-accessibility.test.ts
+++ b/filefixer/tests/adversarial-modal-accessibility.test.ts
@@ -112,18 +112,16 @@ describe("Adversarial Milestone 1 Challenge: Modal Accessibility & Tabular Numer
-    it("ADV-SM-2: VULNERABILITY CONFIRMED: SupportModal completely lacks Tab key focus trapping", () => {
+    it("ADV-SM-2: SupportModal implements Tab key focus trapping", () => {
       const hasTabHandling = smSource.includes('e.key === "Tab"') || smSource.includes('e.keyCode === 9');
-      assert.strictEqual(hasTabHandling, false, 
-        "CRITICAL VULNERABILITY: SupportModal has NO Tab key listener. Keyboard users can Tab out of the modal into background page elements!");
+      assert.ok(hasTabHandling, "SupportModal must implement Tab key focus trapping");
     });
 
-    it("ADV-SM-3: VULNERABILITY CONFIRMED: SupportModal lacks initial focus placement", () => {
-      // When SupportModal opens, does it call .focus() on anything inside the modal (e.g. close button)?
+    it("ADV-SM-3: SupportModal places initial focus on close button", () => {
       const focusesInsideModal = smSource.includes("closeButtonRef") || 
         smSource.includes(".focus()") && !smSource.includes("previousFocusRef.current.focus");
-      assert.strictEqual(focusesInsideModal, false,
-        "CRITICAL VULNERABILITY: SupportModal opens without moving focus to the close button or modal container. Focus remains on the background trigger!");
+      assert.ok(focusesInsideModal, "SupportModal must place initial focus on close button");
     });
   });
 
@@ -134,28 +132,24 @@ describe("Adversarial Milestone 1 Challenge: Modal Accessibility & Tabular Numer
-    it("ADV-DCM-1: VULNERABILITY CONFIRMED: DownloadCenterModal lacks Escape key dismissal", () => {
+    it("ADV-DCM-1: DownloadCenterModal implements Escape key dismissal", () => {
       const hasEscape = dcmSource.includes('e.key === "Escape"') || dcmSource.includes("Escape");
-      assert.strictEqual(hasEscape, false, 
-        "CRITICAL VULNERABILITY: DownloadCenterModal has NO Escape key handler. Pressing Esc does not dismiss the modal.");
+      assert.ok(hasEscape, "DownloadCenterModal must handle Escape key dismissal");
     });
 
-    it("ADV-DCM-2: VULNERABILITY CONFIRMED: DownloadCenterModal lacks Tab focus trapping", () => {
+    it("ADV-DCM-2: DownloadCenterModal implements Tab focus trapping", () => {
       const hasTabTrap = dcmSource.includes('e.key === "Tab"') || dcmSource.includes("querySelectorAll");
-      assert.strictEqual(hasTabTrap, false, 
-        "CRITICAL VULNERABILITY: DownloadCenterModal has NO Tab focus trap. Tabbing escapes to background elements.");
+      assert.ok(hasTabTrap, "DownloadCenterModal must trap Tab key focus within modal");
     });
 
-    it("ADV-DCM-3: VULNERABILITY CONFIRMED: DownloadCenterModal lacks body scroll locking", () => {
+    it("ADV-DCM-3: DownloadCenterModal locks document body scroll on open", () => {
       const hasScrollLock = dcmSource.includes("document.body.style.overflow");
-      assert.strictEqual(hasScrollLock, false, 
-        "VULNERABILITY: DownloadCenterModal does NOT lock document body scroll. Background page scrolls while modal is open.");
+      assert.ok(hasScrollLock, "DownloadCenterModal must lock body scroll");
     });
 
-    it("ADV-DCM-4: VULNERABILITY CONFIRMED: DownloadCenterModal lacks focus restoration and initial focus", () => {
+    it("ADV-DCM-4: DownloadCenterModal restores focus on dismissal", () => {
       const hasFocusRestoration = dcmSource.includes("previousActiveElement") || dcmSource.includes("previousFocus");
-      assert.strictEqual(hasFocusRestoration, false, 
-        "VULNERABILITY: DownloadCenterModal does NOT restore focus to opener upon dismissal.");
+      assert.ok(hasFocusRestoration, "DownloadCenterModal must restore focus to opener");
     });
   });
 
@@ -166,13 +160,11 @@ describe("Adversarial Milestone 1 Challenge: Modal Accessibility & Tabular Numer
-    it("ADV-FDM-1: VULNERABILITY CONFIRMED: FileDeliveredModal lacks Escape dismissal, focus trap, and scroll lock", () => {
+    it("ADV-FDM-1: FileDeliveredModal implements Escape dismissal, focus trap, scroll lock, and focus restoration", () => {
       const hasEscape = fdmSource.includes('e.key === "Escape"');
       const hasTabTrap = fdmSource.includes('e.key === "Tab"');
       const hasScrollLock = fdmSource.includes('overflow = "hidden"');
       const hasFocusRestore = fdmSource.includes("previousFocus");
 
-      assert.strictEqual(hasEscape, false, "FileDeliveredModal lacks Escape dismissal");
-      assert.strictEqual(hasTabTrap, false, "FileDeliveredModal lacks Tab focus trap");
-      assert.strictEqual(hasScrollLock, false, "FileDeliveredModal lacks body scroll lock");
-      assert.strictEqual(hasFocusRestore, false, "FileDeliveredModal lacks focus restoration");
+      assert.ok(hasEscape, "FileDeliveredModal must handle Escape");
+      assert.ok(hasTabTrap, "FileDeliveredModal must trap Tab");
+      assert.ok(hasScrollLock, "FileDeliveredModal must lock body scroll");
+      assert.ok(hasFocusRestore, "FileDeliveredModal must restore focus");
     });
```

---

## 5. Verification Matrix & Edge Cases Handled

| Scenario / Edge Case | Expected Behavior | Verification Mechanism |
|---|---|---|
| **Modal Opened via Keyboard** | Focus shifts immediately to `closeButtonRef` (close button) | `closeButtonRef.current?.focus()` + 30ms timer |
| **Tab Pressed on Last Action** | Focus wraps cleanly to first element (close button) | `e.key === "Tab"` wrap check |
| **Shift+Tab on First Action** | Focus wraps cleanly to last action button | `e.shiftKey && (document.activeElement === first)` wrap check |
| **Focus Escaped to Background** | Next Tab or Shift-Tab pulls focus back inside dialog | `!modalContainerRef.current.contains(document.activeElement)` check |
| **Modal with Single Button (`SupportModal`)** | Tab and Shift-Tab remain pinned to the single close button | Length 1 check prevents default and maintains focus |
| **Escape Pressed** | Modal dismisses immediately and returns focus to opener | Keydown listener invokes close action + cleanup restores `previousFocusRef` |
| **Backdrop Clicked** | Modal dismisses immediately and returns focus to opener | Dialog backdrop `onClick` invokes close action |
| **Underlying Document Scroll** | Mouse wheel or touch gestures do not scroll page | `document.body.style.overflow = "hidden"` on mount |
| **Rapid Open/Dismiss (<30ms)** | Timer is cleanly garbage-collected without memory leak | `clearTimeout(timerId)` in cleanup function |
| **Mobile Touch Target Size** | Close button hit-box remains ≥44×44px on mobile | Class `h-11 w-11 sm:h-9 sm:w-9` preserved (tested by `m1-adversarial.test.ts`) |

---

## 6. Implementation Instructions for Worker

1. Apply the diff to `filefixer/src/components/support/SupportModal.tsx`.
2. Apply the diff to `filefixer/src/components/download/DownloadCenterModal.tsx`.
3. Apply the diff to `filefixer/src/components/download/FileDeliveredModal.tsx`.
4. Update `filefixer/tests/adversarial-modal-accessibility.test.ts` to assert that the vulnerabilities are fixed.
5. Run the test suite:
   ```bash
   npm test --prefix filefixer
   ```
6. Run the build to verify TypeScript typing and bundle compilation:
   ```bash
   npm run build --prefix filefixer
   ```
