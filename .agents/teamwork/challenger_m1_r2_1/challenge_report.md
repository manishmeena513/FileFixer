# Adversarial Challenge Report: Contrast & Mobile Layout Remediation (Milestone 1 Iteration 2)

**Challenger**: `challenger_m1_r2_1` (Contrast & Layout Challenger)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Milestone**: Milestone 1 (Design System & Global Shell) — Remediation Iteration 2  
**Test Suite Executed**: `filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts`  
**Date**: 2026-10-22  
**Final Verdict**: ❌ **REQUEST_CHANGES**

---

## Challenge Summary

- **Overall Risk Assessment**: **HIGH**
- **Core Findings**:
  1. **Mobile Layout Physical Collision (Task 4)**: On mobile viewports `<640px`, when 2 or more files are delivered/queued, `DownloadDock` expands to a top coordinate of **307px** from the viewport bottom (80px base + 65px header + 160px item list + 2px borders). `SupportPrompt` is hardcoded to `bottom-72` (**288px**). Both components occupy the exact same horizontal span (`left-4 right-4`, full mobile width) and both declare `z-40`. This creates a **19px physical overlap and visual occlusion**, where the bottom 19px of `SupportPrompt` directly covers the top 19px of `DownloadDock`'s header controls (View All, Minimize chevron, and Dismiss buttons).
  2. **Regressed Hover Contrast on Dark Primary Button in Application Shell (Task 2)**: While `DownloadDock.tsx` and `DownloadCenterModal.tsx` were remediated to `hover:text-[hsl(var(--primary-foreground))]` (4.93:1), `src/components/workspace/WorkspaceDrawer.tsx` line 384 (part of the M1 application shell) was missed and still uses `hover:bg-[hsl(var(--primary))] hover:text-white`. In dark mode, white (`#FFFFFF`) on `--primary` (`#3B82F6`) yields a contrast ratio of **3.63:1**, failing WCAG 2.1 AA (SC 1.4.3 $\ge 4.5:1$).
  3. **Composited Hover Opacity Degradation on Primary Buttons (Task 2)**: In `Button.tsx`, `variant="default"` specifies `hover:opacity-92`. When rendered over the dark background (`#0B1020`), compositing the 92% opacity button reduces contrast between `#0F172A` text and `#3B82F6` background from 4.93:1 down to **4.36:1**, slipping below the 4.5:1 threshold.
  4. **Accent Button & Destructive Tokens Verified Robust (Tasks 1 & 3)**: Button `variant="accent"` achieves **4.93:1** in light mode and **7.09:1** in dark mode (both passing WCAG AA $\ge 4.5:1$). Dark mode destructive text achieves **6.90:1** on dark background (`#0B1020`), **6.44:1** on card (`#111827`), and **5.85:1** on surface-secondary (`#182235`), completely resolving the previous iteration's token failures.

---

## Challenges

### [HIGH] Challenge 1: Mobile Layout Collision & Control Occlusion between SupportPrompt and DownloadDock (<640px)

- **Assumption Challenged**: The worker handoff claimed:
  > *"When downloads exist: sets `bottom-72 sm:bottom-72 md:bottom-6`, cleanly clearing the top of `DownloadDock` (max 284px) by at least 4px to 98px."*
- **Empirical Attack Scenario**:
  - DownloadDock mobile position is `fixed bottom-20` (80px from viewport bottom).
  - DownloadDock header height: `py-2.5` (20px) + child controls with `h-11` (44px) + `border-b` (1px) = **65px**.
  - DownloadDock delivery items list container: declared as `max-h-40 sm:max-h-60`. `max-h-40` = 10rem = **160px**.
  - Outer container border: **2px**.
  - Total top coordinate of `DownloadDock` when 2+ items exist:  
    $$\text{Dock Top} = 80\text{px} (\text{bottom-20}) + 65\text{px} (\text{header}) + 160\text{px} (\text{items}) + 2\text{px} = \mathbf{307\text{px}}$$
  - `SupportPrompt` mobile position when `hasDownloads` is true: `bottom-72` = 18rem = $\mathbf{288\text{px}}$.
  - Both elements declare `left-4 right-4` on mobile (<640px) and `z-40`.
  - Clearance calculation:  
    $$\text{Clearance} = 288\text{px} - 307\text{px} = \mathbf{-19\text{px}}$$
- **Blast Radius**:
  - The bottom 19 pixels of `SupportPrompt` sit directly on top of the top 19 pixels of `DownloadDock`.
  - The top of `DownloadDock` contains its header interactive controls: "View All" link, Minimize toggle button, and Dismiss button.
  - Because `SupportPrompt` is rendered after `DownloadDock` in `layout.tsx` (line 126 vs line 123) and declares `pointer-events-auto`, user taps aimed at the upper half of the DownloadDock header controls will be intercepted by `SupportPrompt`.
  - On a standard 667px mobile screen (iPhone SE), floating widgets consume the bottom 478px (72% of the total screen height) with direct overlap.
- **Mitigation**:
  In `filefixer/src/components/support/SupportPrompt.tsx`, increase the mobile bottom offset when `hasDownloads` is true:
  ```tsx
  hasDownloads ? "bottom-[320px] sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
  ```
  `320px` (or `bottom-80`) provides a clean **13px positive clearance** above the 307px DownloadDock top edge, completely preventing touch interception and visual clipping.

---

### [MEDIUM-HIGH] Challenge 2: Unremediated `hover:text-white` on Dark Primary Button in Application Shell (`WorkspaceDrawer.tsx`)

- **Assumption Challenged**: The worker claimed hover state contrast deficiencies on primary buttons were fully remediated.
- **Empirical Attack Scenario**:
  - In `filefixer/src/components/workspace/WorkspaceDrawer.tsx` line 384:
    ```tsx
    <button
      onClick={() => triggerDownload(item.outputBlob!, item.outputName || item.name)}
      title="Download processed file"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
    >
      <Download className="h-4 w-4" />
    </button>
    ```
  - In dark mode, `--primary` is `217 91% 60%` (`#3B82F6`).
  - When hovered, the background turns to `#3B82F6` and text/icon turns to `#FFFFFF`.
  - WCAG Relative Luminance calculation:
    - Relative luminance of `#3B82F6` = `0.2244`
    - Relative luminance of `#FFFFFF` = `1.0000`
    - Contrast ratio = $(1.0000 + 0.05) / (0.2244 + 0.05) = \mathbf{3.63:1}$.
  - Fails WCAG 2.1 AA SC 1.4.3 ($\ge 4.5:1$).
- **Blast Radius**:
  - `WorkspaceDrawer` is part of the application shell (M1 scope). Whenever a dark-mode user hovers over the download button in the workspace drawer, the icon contrast regresses to 3.63:1.
  - In `WorkspaceView.tsx` line 629, the "Open in PDF Studio" text link button also uses `hover:bg-[hsl(var(--primary))] hover:text-white`, regressing text contrast to 3.63:1.
- **Mitigation**:
  In `WorkspaceDrawer.tsx` line 384 and `WorkspaceView.tsx` line 629, replace `hover:text-white` with `hover:text-[hsl(var(--primary-foreground))]`, identical to the fix applied to `DownloadDock.tsx` and `DownloadCenterModal.tsx`.

---

### [MEDIUM] Challenge 3: Button `hover:opacity-92` Composited Contrast Degradation on Dark Background

- **Assumption Challenged**: Opacity transitions on primary buttons do not degrade accessibility contrast below 4.5:1.
- **Empirical Attack Scenario**:
  - In `Button.tsx` lines 18-19:
    ```tsx
    default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
    ```
  - In dark mode, `--primary` is `#3B82F6` (luminance 0.2244) and `--primary-foreground` is `#0F172A` (luminance 0.0078). In static state, contrast is **4.93:1** (passes $\ge 4.5:1$).
  - When hovered with `opacity: 0.92` over `--background` (`#0B1020`, luminance 0.0048):
    - Blended button background: `[56, 122, 229]`, luminance = `0.2017`.
    - Blended text: `[15, 22, 40]`, luminance = `0.0078`.
    - Composited contrast ratio = $(0.2017 + 0.05) / (0.0078 + 0.05) = \mathbf{4.36:1}$.
  - The contrast ratio drops by 0.57, falling from 4.93:1 to 4.36:1 ($< 4.5:1$).
- **Blast Radius**:
  - Affects all primary buttons during mouse hover in dark mode.
- **Mitigation**:
  Instead of container alpha opacity (`hover:opacity-92`), use solid background brightness or shade transitions, such as `hover:brightness-95` or `hover:bg-[hsl(217_91%_56%)]`, which preserves foreground text luminance at 100%.

---

## Stress Test Results

Executed via: `npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts`

| Test ID | Scenario | Expected | Actual | Status |
|---|---|---|---|---|
| **1.1** | Light mode `Button variant="accent"` text contrast | $\ge 4.5:1$ | **4.932:1** | ✅ PASS |
| **1.2** | Dark mode `Button variant="accent"` text contrast | $\ge 4.5:1$ | **7.093:1** | ✅ PASS |
| **2.1** | Dark primary button hover in `DownloadDock` & `DownloadCenterModal` | $\ge 4.5:1$ | **4.932:1** | ✅ PASS |
| **2.2** | Dark primary button hover in `WorkspaceDrawer` line 384 | $\ge 4.5:1$ | **3.629:1** | ❌ **FAIL** |
| **3.1** | Dark destructive text on dark background (`#0B1020`) | $\ge 4.5:1$ | **6.897:1** | ✅ PASS |
| **3.2** | Dark destructive text on dark card (`#111827`) | $\ge 4.5:1$ | **6.436:1** | ✅ PASS |
| **3.3** | Dark destructive text on dark surface-secondary (`#182235`) | $\ge 4.5:1$ | **5.852:1** | ✅ PASS |
| **4.1** | Physical clearance between `SupportPrompt` & `DownloadDock` (<640px) | $\ge 0\text{px}$ clearance | **-19px (COLLISION)** | ❌ **FAIL** |

**Total Tests**: 8 | **Passed**: 6 | **Failed**: 2

---

## Unchallenged Areas

- **Modal Dialog Focus Trapping & Scroll Lock**: Verified by the Focus & Keyboard Challenger in M1R2; no changes made to those areas.
- **IndexedDB Schema & Storage**: Out of scope for Milestone 1 contrast/layout remit.
- **PDF Engine & Image Canvas Pipeline**: Out of scope for Milestone 1 remit.
