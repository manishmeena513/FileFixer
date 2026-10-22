# Adversarial Challenge Report: Milestone 1 (Design System & Global Shell)

**Challenger**: Contrast & Touch Challenger (`challenger_m1_1`)  
**Role**: critic, specialist  
**Target Milestone**: Milestone 1 (Design System & Global Shell)  
**Worker Handoff Reviewed**: `.agents/teamwork/worker_m1/handoff.md`  
**Date**: 2026-10-22  

---

## Challenge Summary

- **Overall Risk Assessment**: **HIGH**  
- **Verdict**: **REQUEST_CHANGES**  

While the worker successfully implemented the core theme infrastructure, calibrated `--primary-foreground` and `--success-foreground` in dark mode, and integrated responsive touch targets across the component suite, empirical testing uncovered **3 WCAG 2.1 AA contrast failures** and **2 mobile viewport layout/collision defects** that degrade accessibility on mobile devices.

---

## Challenges

### [High] Challenge 1: `Button variant="accent"` Fails WCAG 2.1 AA Contrast in Light Mode (3.63:1 < 4.5:1)

- **Assumption Challenged**: All button variants and theme token pairs meet WCAG 2.1 AA contrast ($\ge 4.5:1$) in both light and dark modes.
- **Attack Scenario**:
  - In `filefixer/src/components/ui/button.tsx` lines 28–29:
    ```tsx
    accent:
      "bg-[hsl(var(--accent-subtle))] text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
    ```
  - In `filefixer/src/app/globals.css` lines 24–25 (Light Theme):
    ```css
    --primary-foreground: 0 0% 100%; /* #FFFFFF */
    --accent-subtle: 217 91% 60%;    /* #3B82F6 */
    ```
  - In `filefixer/src/components/support/SupportPrompt.tsx` line 64:
    ```tsx
    <Button
      size="sm"
      variant="accent"
      onClick={openSupportModal}
      className="flex-1 font-semibold text-xs shadow-xs"
    >
      ❤️ Support FileFixer
    </Button>
    ```
- **Empirical Measurement**:
  - Relative luminance of `#FFFFFF` = `1.0`
  - Relative luminance of `#3B82F6` = `0.2358`
  - Contrast Ratio: $\frac{1.0 + 0.05}{0.2358 + 0.05} = \mathbf{3.63:1}$
  - WCAG 2.1 AA Criterion 1.4.3 requires $\mathbf{\ge 4.5:1}$ for normal body/button text (<18pt / 24px regular, <14pt / 18.66px bold). At `text-xs` (12px), this is a direct contrast failure.
- **Blast Radius**: The voluntary Support prompt displayed to all users upon completing file workflows fails readability criteria for low-vision users in light mode.
- **Mitigation**:
  - In `button.tsx`, calibrate `variantClasses.accent` to use high-contrast dark text in light mode:
    ```tsx
    accent:
      "bg-[hsl(var(--accent-subtle))] text-[hsl(var(--foreground))] dark:text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
    ```
    Or define a dedicated `--accent-subtle-foreground` token calibrated to `222 47% 11%` in light mode (yielding **4.85:1** contrast).

---

### [High] Challenge 2: Dark Mode Hover State in DownloadDock & DownloadCenterModal Fails WCAG Contrast (3.68:1 < 4.5:1)

- **Assumption Challenged**: Hover and focus states maintain accessible contrast across all themes.
- **Attack Scenario**:
  - In `filefixer/src/components/download/DownloadDock.tsx` line 130:
    ```tsx
    className="flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors touch-manipulation cursor-pointer"
    ```
  - In `filefixer/src/components/download/DownloadCenterModal.tsx` line 149:
    ```tsx
    className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors touch-manipulation cursor-pointer"
    ```
  - In dark mode, `--primary` is `217 91% 60%` (`#3B82F6`).
  - When a user hovers or focuses on the download action button, the text/icon turns to `white` (`#FFFFFF`).
- **Empirical Measurement**:
  - Contrast ratio between `#FFFFFF` and `#3B82F6` is **3.68:1** (failing WCAG 2.1 AA $\ge 4.5:1$).
  - Note: The worker recognized this exact issue for static primary buttons and correctly updated `--primary-foreground` to `#0F172A`, but left hardcoded `hover:text-white` on these interactive delivery buttons.
- **Blast Radius**: Interactive file delivery buttons in the Dock and Modal fail WCAG AA contrast during user interaction (hover / active focus) in dark mode.
- **Mitigation**: Replace `hover:text-white` with `hover:text-[hsl(var(--primary-foreground))]` in both `DownloadDock.tsx` and `DownloadCenterModal.tsx` (delivering **4.93:1** contrast).

---

### [Medium] Challenge 3: Dark Mode Destructive Text Fails Contrast on Dark Background and Cards (3.95:1 & 3.69:1 < 4.5:1)

- **Assumption Challenged**: Theme tokens applied to text and outline states satisfy WCAG AA across both themes.
- **Attack Scenario**:
  - In `globals.css` line 88 (Dark Theme):
    ```css
    --destructive: 0 72% 51%; /* #DC2626 */
    --background: 226 49% 8.4%; /* #0B1020 */
    --card: 220 39% 11%;
    ```
  - Used for destructive text messages, delete buttons, error alerts, and outline buttons:
    - `DownloadCenterModal.tsx` line 181: `<Button variant="outline" className="min-h-[44px] text-[hsl(var(--destructive))] ...">`
    - `FileCard.tsx` line 136: `<p className="mt-1 text-xs font-medium text-[hsl(var(--destructive))]">`
    - `badge.tsx` line 13: `text-[hsl(var(--destructive))]`
- **Empirical Measurement**:
  - Contrast ratio of `#DC2626` against `#0B1020` (background) = **3.95:1** (fails WCAG AA 4.5:1).
  - Contrast ratio of `#DC2626` against dark card = **3.69:1** (fails WCAG AA 4.5:1).
- **Blast Radius**: Error notices, validation badges, and outline clear buttons in dark mode fail readability standards for users with color vision deficiencies.
- **Mitigation**:
  - Add a dedicated `--destructive-text: 0 85% 65%` (`#F87171`) in `.dark` for text/outline usages, or calibrate `--destructive` in dark mode to `#EF4444` / `#F87171` while setting `--destructive-foreground: 222 47% 11%`.

---

### [Medium] Challenge 4: Mobile Screen Collision between `DownloadDock` and `SupportPrompt` at `fixed bottom-20`

- **Assumption Challenged**: Floating docks and prompt overlays coexist without layout interference on mobile viewports.
- **Attack Scenario**:
  - In `DownloadDock.tsx` line 35:
    ```tsx
    className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-full pointer-events-auto animate-dock-in"
    ```
  - In `SupportPrompt.tsx` line 32:
    ```tsx
    className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 animate-slide-up pointer-events-auto"
    ```
  - When a user finishes processing a file, `DownloadDock` mounts at `bottom-20`.
  - 1200ms later, `SupportPrompt` mounts at `bottom-20`.
  - On viewports < 640px, both components occupy the exact same vertical band (`bottom-20`), occluding each other and creating overlapping tap zones.
- **Blast Radius**: On mobile devices, users cannot access the delivery dock buttons or dismiss the support prompt cleanly due to stacked opaque containers.
- **Mitigation**:
  - Dynamically stack `SupportPrompt` above `DownloadDock` when the dock is visible, or coordinate state in `fileStore.ts` so `SupportPrompt` is suppressed or deferred until the dock is minimized or dismissed.

---

### [Low] Challenge 5: `CommandCenter` Footer Text Squeezed on 320px Mobile Viewport

- **Assumption Challenged**: Application shell dialogs display cleanly across all mobile widths down to 320px without text collision.
- **Attack Scenario**:
  - In `CommandCenter.tsx` line 554:
    ```tsx
    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] px-4 py-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
      <div className="flex items-center gap-3">
        <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
        <span><kbd>↵</kbd> to execute</span>
      </div>
      <span className="font-mono text-emerald-500 font-medium">100% In-Browser • Zero Uploads</span>
    </div>
    ```
  - Combined un-wrapped width of the keyboard shortcut instructions (~165px) and the privacy badge (~150px) plus padding (32px) = 347px > 320px screen width.
  - Furthermore, keyboard shortcuts (`↑`, `↓`, `↵`) are irrelevant to touch users on mobile.
- **Blast Radius**: Minor text crowding/wrapping collision on narrow phones (iPhone SE, 320px).
- **Mitigation**:
  - Add `hidden sm:flex` to the keyboard navigation hints container, or add `flex-col sm:flex-row gap-1 items-start sm:items-center` to the footer bar.

---

## Stress Test Results

| Test Scenario | Evaluated Component / Token | Expected (WCAG / Spec) | Observed Empirical Behavior | Status |
|---|---|---|---|---|
| Light Mode Foreground | `foreground` on `background` | $\ge 4.5:1$ | **16.95:1** | **PASS** |
| Dark Mode Foreground | `foreground` on `background` | $\ge 4.5:1$ | **18.10:1** | **PASS** |
| Light Mode Muted Text | `muted-foreground` on `background` | $\ge 4.5:1$ | **9.67:1** | **PASS** |
| Dark Mode Muted Text | `muted-foreground` on `background` | $\ge 4.5:1$ | **7.37:1** | **PASS** |
| Light Mode Primary Button | `primary-foreground` on `primary` | $\ge 4.5:1$ | **5.20:1** | **PASS** |
| Dark Mode Primary Button | `primary-foreground` on `primary` | $\ge 4.5:1$ | **4.93:1** | **PASS** |
| Light Mode Destructive Button | `destructive-foreground` on `destructive` | $\ge 4.5:1$ | **4.80:1** | **PASS** |
| Dark Mode Destructive Button | `destructive-foreground` on `destructive` | $\ge 4.5:1$ | **4.80:1** | **PASS** |
| Light Mode Success Badge | `success-foreground` on `success` | $\ge 4.5:1$ | **5.07:1** | **PASS** |
| Dark Mode Success Badge | `success-foreground` on `success` | $\ge 4.5:1$ | **7.79:1** | **PASS** |
| Light Mode Accent Button | `primary-fg` on `accent-subtle` (`button.tsx`) | $\ge 4.5:1$ | **3.63:1** (white on `#3B82F6`) | **FAIL** |
| Dark Mode Delivery Hover | `hover:text-white` on `hover:bg-primary` | $\ge 4.5:1$ | **3.68:1** (white on `#3B82F6`) | **FAIL** |
| Dark Mode Destructive Text | `destructive` text on `background` | $\ge 4.5:1$ | **3.95:1** (`#DC2626` on `#0B1020`) | **FAIL** |
| Button `xs` Hit-Box | `after:min-w-[44px] after:min-h-[44px]` | $\ge 44\times 44\text{px}$ | $\ge 44\times 44\text{px}$ | **PASS** |
| Button `sm` Hit-Box | `after:min-w-[44px] after:min-h-[44px]` | $\ge 44\times 44\text{px}$ | $\ge 44\times 44\text{px}$ | **PASS** |
| Button `md` Hit-Box | `min-h-[44px] sm:min-h-0` | $\ge 44\text{px}$ height | $44\text{px}$ height | **PASS** |
| Button `lg` Hit-Box | `h-12` | $\ge 44\text{px}$ height | $48\text{px}$ height | **PASS** |
| Button `icon` Hit-Box | `h-11 w-11 min-h-[44px] min-w-[44px]` | $\ge 44\times 44\text{px}$ | $44\times 44\text{px}$ | **PASS** |
| Slider Thumb Hit-Box | `after:w-11 after:h-11 after:min-w-[44px]` | $\ge 44\times 44\text{px}$ | $44\times 44\text{px}$ | **PASS** |
| Switch Root Hit-Box | `after:min-w-[44px] after:min-h-[44px]` | $\ge 44\times 44\text{px}$ | $44\times 44\text{px}$ | **PASS** |
| Checkbox Root Hit-Box | `after:min-w-[44px] after:min-h-[44px]` | $\ge 44\times 44\text{px}$ | $44\times 44\text{px}$ | **PASS** |
| Select Trigger & Item | `SelectTrigger` & `SelectItem` | $\ge 44\text{px}$ height | $44\text{px}$ height | **PASS** |
| Mobile Bottom Nav Links | `MobileBottomNav` (5 items) | $\ge 48\times 48\text{px}$ | $\ge 48\text{px}$ height, $\ge 64\text{px}$ width | **PASS** |
| Comparison Slider Handle | `globals.css` line 234 | $\ge 44\times 44\text{px}$ | $44\times 44\text{px}$ | **PASS** |
| Mobile Dock & Prompt Overlap | `DownloadDock` & `SupportPrompt` | No collision | Overlap at `fixed bottom-20` on <640px | **FAIL** |
| Mobile Footer Occlusion | `Footer.tsx` safe area offset | No occlusion | `pb-[calc(5.5rem+env(...))]` clears 64px nav | **PASS** |

---

## Unchallenged Areas

- **Canvas / WebWorker internal pipeline performance**: Out of scope for Milestone 1 (delegated to M3/M4/M5).
- **IndexedDB schema migration**: Out of scope for M1 (delegated to M5).

---

## Recommended Action Plan for Worker

1. **Fix `Button variant="accent"` contrast**: In `button.tsx`, update `variantClasses.accent` so text color contrasts $\ge 4.5:1$ against `--accent-subtle` in light mode (e.g. `text-[hsl(var(--foreground))] dark:text-[hsl(var(--primary-foreground))]`).
2. **Fix `hover:text-white` on primary buttons**: In `DownloadDock.tsx` (line 130) and `DownloadCenterModal.tsx` (line 149), replace `hover:text-white` with `hover:text-[hsl(var(--primary-foreground))]`.
3. **Calibrate Dark Mode Destructive Text**: In `globals.css`, introduce a light red token for text (`--destructive-text: 0 85% 65%` or calibrate `--destructive` for dark mode) to achieve $\ge 4.5:1$ against `#0B1020`.
4. **Prevent Mobile Dock/Prompt Collision**: In `SupportPrompt.tsx`, adjust mobile positioning when the download dock is visible (or add a conditional bottom offset `bottom-36 sm:bottom-6` or dock awareness).
5. **Add Responsive Wrapping to CommandCenter Footer**: In `CommandCenter.tsx` line 554, hide desktop-only shortcut hints on mobile (`hidden sm:flex items-center gap-3`).
