# Handoff Report: Adversarial Contrast & Layout Challenge (Iteration 2)

**Agent**: `challenger_m1_r2_1` (Contrast & Layout Challenger)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Milestone**: Milestone 1 (Design System & Global Shell) — Remediation Iteration 2  
**Date**: 2026-10-22  
**Verdict**: ❌ **REQUEST_CHANGES**

---

## 1. Observation

Direct empirical observations from source code inspection and test execution:

1. **Mobile Layout Collision (<640px)**:
   - In `filefixer/src/components/download/DownloadDock.tsx`:
     - Line 35: `className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm z-40 pointer-events-auto animate-dock-in"`
     - Line 39: Header container has `px-4 py-2.5`, with child action buttons declaring `min-h-[44px]` (line 59) and `h-11 w-11` (lines 65, 72). Header outer height = 44px + 20px padding + 1px border = **65px**.
     - Line 82: Delivery list container declared as `max-h-40 sm:max-h-60`. `max-h-40` = 10rem = **160px**.
     - Outer borders = 2px. Total dock height when expanded with $\ge 2$ items = 65px + 160px + 2px = **227px**.
     - Distance of DownloadDock top edge from screen bottom = 80px (`bottom-20`) + 227px = **307px**.
   - In `filefixer/src/components/support/SupportPrompt.tsx`:
     - Lines 40-42:
       ```tsx
       className={cn(
         "fixed left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm md:bottom-6 z-40 animate-slide-up pointer-events-auto transition-all duration-300",
         hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
       )}
       ```
     - On mobile (<640px) when `hasDownloads` is true, bottom offset is `bottom-72` = 18rem = **288px**.
     - Both components share `left-4 right-4` (full width minus 32px) and `z-40`.
     - In `filefixer/src/app/layout.tsx`, `<DownloadDock />` is mounted at line 123 and `<SupportPrompt />` is mounted at line 126. Because `SupportPrompt` appears later in DOM order, it paints directly on top of `DownloadDock`.
     - Physical clearance = $288\text{px} - 307\text{px} = \mathbf{-19\text{px}}$ (overlap).

2. **Primary Button Hover Contrast Defect in Application Shell**:
   - In `filefixer/src/components/workspace/WorkspaceDrawer.tsx` line 384:
     ```tsx
     className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
     ```
   - In `filefixer/src/components/workspace/WorkspaceView.tsx` line 629:
     ```tsx
     className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
     ```
   - Both elements specify `hover:bg-[hsl(var(--primary))] hover:text-white`.
   - In dark mode (`globals.css` line 76), `--primary` is `217 91% 60%` (`#3B82F6`, relative luminance `0.2244`). Text color `#FFFFFF` has relative luminance `1.0000`.
   - Contrast ratio on hover: $(1.0000 + 0.05) / (0.2244 + 0.05) = \mathbf{3.63:1}$, failing WCAG 2.1 AA (SC 1.4.3 $\ge 4.5:1$).

3. **Button `hover:opacity-92` Composited Contrast Degradation**:
   - In `filefixer/src/components/ui/button.tsx` line 19:
     ```tsx
     default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
     ```
   - In dark mode, `--primary` is `#3B82F6` and `--primary-foreground` is `#0F172A`. Over dark background (`#0B1020`), compositing at 92% opacity shifts the effective button background to `[56, 122, 229]` (luminance `0.2017`) and text to `[15, 22, 40]` (luminance `0.0078`), yielding a contrast ratio of $\mathbf{4.36:1}$ ($< 4.5:1$).

4. **Robust Remediations Observed**:
   - `Button variant="accent"`:
     - Light mode (`#0F172A` on `#3B82F6`): **4.93:1** ($\ge 4.5:1$, PASS).
     - Dark mode (`#0F172A` on `#60A5FA`): **7.09:1** ($\ge 4.5:1$, PASS).
   - `globals.css` Dark Destructive Tokens:
     - On `#0B1020` background: **6.90:1** ($\ge 4.5:1$, PASS).
     - On `#111827` card: **6.44:1** ($\ge 4.5:1$, PASS).
     - On `#182235` surface-secondary: **5.85:1** ($\ge 4.5:1$, PASS).
     - Destructive button solid text (`#0F172A` on `#F87171`): **6.51:1** ($\ge 4.5:1$, PASS).
   - `DownloadDock.tsx` (line 130) & `DownloadCenterModal.tsx` (line 217): Replaced `hover:text-white` with `hover:text-[hsl(var(--primary-foreground))]`, giving **4.93:1** on hover in dark mode (PASS).

5. **Test Runner Execution Output**:
   - Executing `npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts`:
     ```
     # tests 8
     # suites 5
     # pass 6
     # fail 2
     # cancelled 0
     # skipped 0
     # todo 0
     ```
     - Failure 1: `2.2 Application shell WorkspaceDrawer must not use hover:text-white on dark primary button` (regresses to 3.63:1).
     - Failure 2: `4.1 Verify physical clearance between SupportPrompt and DownloadDock when active deliveries exist` (overlaps by 19px).

---

## 2. Logic Chain

1. **Mobile Layout Collision**:
   - Referencing Observation 1, the worker assumed `DownloadDock` has a maximum top coordinate of 284px and that `bottom-72` (288px) leaves a 4px clearance.
   - However, the dock header contains 44px buttons with 20px vertical padding (`py-2.5`), requiring 65px. The item list container allows up to 160px (`max-h-40`), and outer borders add 2px. Total expanded dock height is 227px.
   - Because `DownloadDock` sits at `bottom-20` (80px), its top coordinate reaches $80 + 227 = 307\text{px}$.
   - When `SupportPrompt` is positioned at `bottom-72` (288px), its bottom edge is 19px below the top of `DownloadDock`.
   - Because both elements have `left-4 right-4` and `z-40`, and `SupportPrompt` is later in DOM order with `pointer-events-auto`, this creates a 19px collision and occludes the DownloadDock header controls. This violates Requirement R4 / Survey 3 ("zero collision or occlusion").

2. **Application Shell Primary Button Hover Contrast**:
   - Referencing Observation 2, while the worker fixed `DownloadDock.tsx` and `DownloadCenterModal.tsx`, `WorkspaceDrawer.tsx` line 384 was overlooked.
   - `WorkspaceDrawer` is part of the M1 application shell (defined in `PROJECT.md` line 94).
   - In dark mode, hovering over the download button sets text to `#FFFFFF` against `#3B82F6`, resulting in a contrast ratio of 3.63:1.
   - Under WCAG 2.1 AA SC 1.4.3 (Contrast Minimum) and SC 1.4.11 (Non-text Contrast), hover states must not drop below acceptable contrast thresholds. A 3.63:1 ratio represents a noticeable accessibility regression.

3. **Required Actions**:
   - In `filefixer/src/components/support/SupportPrompt.tsx`, increase the mobile bottom offset when `hasDownloads` is true to `bottom-[320px]` (or `bottom-80`) for screen widths `<640px`.
   - In `filefixer/src/components/workspace/WorkspaceDrawer.tsx` line 384 and `WorkspaceView.tsx` line 629, replace `hover:text-white` with `hover:text-[hsl(var(--primary-foreground))]`.
   - In `filefixer/src/components/ui/button.tsx`, evaluate replacing `hover:opacity-92` with `hover:brightness-95` to eliminate the 4.36:1 composited contrast dip on dark backgrounds.

---

## 3. Caveats

- **Viewport Heights $\ge 844\text{px}$**: On modern tall devices (e.g., iPhone 15 with 844px height), both floating widgets fit within the viewport without pushing above the viewport fold, but the 19px overlap between their opposing edges persists regardless of viewport height because both are anchored to `bottom`.
- **Minimized Dock State**: If the user explicitly clicks the minimize chevron on `DownloadDock`, its height shrinks to 67px (top at 147px), avoiding collision. However, `DownloadDock` mounts in the expanded state (`isMinimized = false`), guaranteeing initial collision whenever `hasDownloads` is true.

---

## 4. Conclusion

**Verdict**: ❌ **REQUEST_CHANGES**

Milestone 1 Iteration 2 successfully resolved Button `variant="accent"` contrast (4.93:1 light, 7.09:1 dark) and dark mode destructive tokens (6.90:1 on background, 6.44:1 on card). However, changes are requested to address two concrete, empirically reproduced defects before Milestone 1 can be certified:
1. **Fix Mobile Stacking Collision**: Update `SupportPrompt.tsx` so that `hasDownloads` uses `bottom-[320px]` (or `bottom-80`) on mobile `<640px`, eliminating the 19px collision with `DownloadDock`.
2. **Fix Shell Primary Hover Contrast**: Update `WorkspaceDrawer.tsx` line 384 (and `WorkspaceView.tsx` line 629) from `hover:text-white` to `hover:text-[hsl(var(--primary-foreground))]`, eliminating the 3.63:1 contrast regression on dark mode hover.

---

## 5. Verification Method

To independently verify these findings:

1. **Run Empirical Challenger Test Suite**:
   ```bash
   npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts
   ```
   *Current Result*: 6 passed, 2 failed.
   - Test 2.2 verifies `WorkspaceDrawer.tsx` hover contrast ($\ge 4.5:1$).
   - Test 4.1 verifies mobile clearance between `SupportPrompt` and `DownloadDock` ($\ge 0\text{px}$).

2. **Run Full Test Suite Baseline**:
   ```bash
   npm test --prefix filefixer
   ```

3. **Run Production Build**:
   ```bash
   npm run build --prefix filefixer
   ```
   *Result*: Exit code 0, 33/33 static routes generated.

4. **Invalidation Conditions**:
   - If `SupportPrompt` is shifted to $\ge 308\text{px}$ on mobile when `hasDownloads` is true, Test 4.1 passes.
   - If `WorkspaceDrawer.tsx` line 384 uses `hover:text-[hsl(var(--primary-foreground))]`, Test 2.2 passes.
