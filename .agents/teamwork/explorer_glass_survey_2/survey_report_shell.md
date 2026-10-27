# Global Application Shell & Interactive Modals Survey Report
**Project**: FileFixer Cinematic Glass Utility Studio Transformation  
**Surveyor**: explorer_glass_survey_2  
**Date**: 2026-10-27  
**Scope**: Header, Footer, Mobile Bottom Nav, Workspace Drawer, Command Center, Download Dock & Modals, Support Modal & Prompt, Touch Target Compliance, QR Asset Invariant.

---

## 1. Executive Summary

This survey audited the global application shell and interactive modals of FileFixer for the Cinematic Glass Utility Studio transformation.
- **Baseline Test Suite Status**: 376/376 tests passing across 99 suites (`npm test` exit code 0).
- **QR Asset Integrity**: `filefixer/public/images/filefixer_support_qr.png` verified via SHA-256 (`8592BD8A18457F3AC496D6735C472D7C4F3239E87B93771ED238D348B87D4744`). File is intact and unchanged.
- **Touch Target Compliance Audit**:
  - `MobileBottomNav`: Compliant (all 5 items enforce `min-h-[48px]` with `touch-manipulation`).
  - `Header`: Partial compliance. On mobile (`< sm`), controls have `min-h-[44px]`, but on `sm:` breakpoints (tablets and desktops), search trigger drops to `sm:h-9` (36px), shortcuts button to `sm:h-9 sm:w-9` (36×36px), and `ThemeToggle` to `sm:h-9 sm:w-9` (36×36px).
  - `WorkspaceDrawer`: Action buttons (Reuse, Download, Delete) in file cards are `h-9 w-9` (36×36px), under the 44px threshold.
  - Modals (`CommandCenter`, `FileDeliveredModal`, `DownloadCenterModal`, `SupportModal`, `KeyboardShortcutsModal`): Close buttons drop to `sm:h-9 sm:w-9` (36×36px) or `sm:h-8 sm:w-8` (32×32px).
- **Glassmorphism & Surface Alignment**:
  - Header, CommandCenter, FileDeliveredModal, SupportModal, and SupportPrompt have implemented preliminary glass tokens (`--glass-surface-elevated`, `--glass-border-luminous`, `backdrop-blur-2xl`).
  - `DownloadCenterModal` is currently using solid card styling (`border-[hsl(var(--border))] bg-[hsl(var(--card))]`) and has not yet been migrated to the glass surface system.
  - Modals currently use `backdrop-blur-xs` or `bg-black/65`; upgrading to `backdrop-blur-md` with subtle electric-blue/violet ambient halo elevates the cinematic fidelity.

---

## 2. Component-by-Component Survey

### 2.1 Header (`filefixer/src/components/layout/Header.tsx`)
- **Location**: `filefixer/src/components/layout/Header.tsx` (343 lines)
- **Current Styling**:
  - Sticky glass header: `sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--header-glass-bg)] backdrop-blur-xl shadow-xs transition-colors`.
  - Max container: `mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8`.
- **Observations & Gaps**:
  1. **Search Trigger**:
     - Line 143: `className="flex min-h-[44px] sm:min-h-0 sm:h-9 items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md px-3.5 py-2 sm:py-1.5 ..."`
     - *Issue*: On `sm:`, it drops to 36px (`sm:h-9`), violating the ≥ 44×44px touch target specification.
     - *Recommendation*: Standardize to `min-h-[44px] h-11 px-3.5 py-2` across all breakpoints.
  2. **Shortcuts Button**:
     - Line 292: `className="hidden sm:flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--glass-border)] ..."`
     - *Issue*: `sm:h-9 sm:w-9` drops target to 36×36px.
     - *Recommendation*: Keep `h-11 w-11` (44×44px) on desktop/tablet.
  3. **Workspace Link**:
     - Line 256: `min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 ...`
     - *Issue*: `sm:min-h-[38px]` drops below 44px.
     - *Recommendation*: Use `min-h-[44px] h-11 px-3.5`.
  4. **ThemeToggle**:
     - Line 299 renders `<ThemeToggle />`, which internally sets `h-11 w-11 sm:h-9 sm:w-9`.
     - *Recommendation*: Update `ThemeToggle` to keep `h-11 w-11` (44×44px).
  5. **Desktop Nav Dropdown Panels**:
     - Lines 213–231: `rounded-2xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl py-1.5 shadow-2xl animate-scale-in`.
     - Dropdown items are `px-4 py-2 text-xs xl:text-sm`. To support touch screens, give dropdown items `min-h-[44px] flex items-center`.

---

### 2.2 Footer (`filefixer/src/components/layout/Footer.tsx`)
- **Location**: `filefixer/src/components/layout/Footer.tsx` (170 lines)
- **Current Styling**:
  - `border-t border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl shadow-xs pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0`.
- **Observations & Gaps**:
  1. **Mobile Bottom Clearance**:
     - `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]` cleanly accounts for the mobile bottom nav height (`h-16` = 64px) plus safe-area padding.
  2. **Footer Voluntary Support Trigger**:
     - Line 147 renders `<FooterSupportButton />`.
     - In `components/support/FooterSupportButton.tsx`, button is `inline-flex items-center gap-1.5 text-xs text-rose-400/90 hover:text-rose-400 hover:underline transition-colors`.
     - *Recommendation*: Elevate into a refined frosted glass chip: `inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all touch-manipulation`.
  3. **Surface & Atmospheric Lighting**:
     - Top border can use fine specular highlight: `border-t border-[var(--glass-border)] shadow-[0_-12px_36px_-8px_rgba(0,0,0,0.35)] inset 0 1px 0 rgba(255,255,255,0.06)`.
     - Developer attribution badge for Manish Meena is nicely styled with `border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.1)] px-2.5 py-0.5`.

---

### 2.3 Mobile Bottom Navigation (`filefixer/src/components/layout/MobileBottomNav.tsx`)
- **Location**: `filefixer/src/components/layout/MobileBottomNav.tsx` (126 lines)
- **Current Styling**:
  - `fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--glass-border)] bg-[var(--header-glass-bg)] backdrop-blur-xl shadow-lg pb-safe lg:hidden`.
  - Grid: `mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1`.
- **Touch Target Compliance Audit**:
  - Home link: `relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer touch-manipulation` (Line 28) — **PASS (≥48px)**.
  - Workspace link: `relative flex min-h-[48px] ... touch-manipulation` (Line 46) — **PASS (≥48px)**.
  - Command Search button: `flex min-h-[48px] ... touch-manipulation` (Line 78) — **PASS (≥48px)**.
  - Tools link: `relative flex min-h-[48px] ... touch-manipulation` (Line 92) — **PASS (≥48px)**.
  - History link: `relative flex min-h-[48px] ... touch-manipulation` (Line 110) — **PASS (≥48px)**.
- **Cinematic Glass Studio Recommendations**:
  - Transform from an edge-to-edge bar into a **Floating Glass Dock**:
    - Floating geometry: `fixed bottom-3 left-3 right-3 mx-auto max-w-md z-40 rounded-2xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(59,130,246,0.15)] pb-safe lg:hidden`.
    - Active item indicator: luminous blue capsule `absolute top-1.5 h-1 w-6 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_10px_rgba(96,165,250,0.8)]`.
    - Tabular file count badge on Workspace: `.tabular-nums` already applied.

---

### 2.4 Session Workspace Drawer (`filefixer/src/components/workspace/WorkspaceDrawer.tsx`)
- **Location**: `filefixer/src/components/workspace/WorkspaceDrawer.tsx` (442 lines)
- **Current Styling**:
  - Backdrop: `fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in`.
  - Panel: `relative flex h-full w-full max-w-lg flex-col border-l border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-2xl animate-scale-in`.
- **Observations & Gaps**:
  1. **Touch Target Gaps**:
     - Tool Switcher buttons (lines 214–285): `min-h-[42px]` -> increase to `min-h-[44px]`.
     - File card Reuse button (line 371): `flex h-9 items-center gap-1 rounded-lg ... px-2` -> change to `min-h-[44px] flex items-center px-3`.
     - File card Download button (line 384): `flex h-9 w-9 items-center justify-center` -> change to `flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center touch-manipulation min-h-[44px] min-w-[44px]`.
     - File card Delete button (line 393): `flex h-9 w-9 items-center justify-center` -> change to `flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center touch-manipulation min-h-[44px] min-w-[44px]`.
  2. **Frosted Glass Styling**:
     - Backdrop: Upgrade from `backdrop-blur-xs` to `backdrop-blur-md bg-black/65`.
     - Summary bar: Currently `bg-[hsl(var(--card))]` -> convert to `bg-[var(--glass-surface)]/80 border-b border-[var(--glass-border)]`.
     - File card items: Currently `bg-[hsl(var(--card))] border-[hsl(var(--border))]` -> convert to `bg-[var(--glass-surface)] border border-[var(--glass-border)] hover:border-[var(--glass-border-luminous)]`.
  3. **Tabular Numerals**:
     - Enforce `.tabular-nums` on:
       - Total files count (`{totalCount}`).
       - Ready files count (`{pendingCount}`).
       - Done files count (`{doneFiles.length}`).
       - Byte size strings (`formatBytes(totalInputSize)`).

---

### 2.5 Universal Command Center (`filefixer/src/components/command/CommandCenter.tsx`)
- **Location**: `filefixer/src/components/command/CommandCenter.tsx` (622 lines)
- **Current Styling**:
  - Backdrop: `fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 pt-[10vh] animate-fade-in`.
  - Dialog container: `w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] animate-scale-in`.
  - Search input: `role="combobox" aria-autocomplete="list" aria-controls="command-results-listbox"`.
  - Results list: `role="listbox"`, each item is `role="option"`.
  - Full Tab focus trap implemented (lines 85–108).
  - Keyboard arrow navigation & Escape dismissal verified.
- **Observations & Gaps**:
  1. **Touch Target Sizing**:
     - Clear input button (line 516): `flex h-11 w-11 sm:h-8 sm:w-8` -> on `sm:`, drops to 32px. Change to `flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center min-h-[44px] min-w-[44px]`.
     - Result list items (line 557): add `min-h-[48px] touch-manipulation` for fluid touch selection on tablet and mobile.
  2. **Atmospheric Lighting & Glass Surfaces**:
     - Backdrop: Upgrade `backdrop-blur-xs` to `backdrop-blur-md bg-black/70`.
     - Add ambient electric-blue outer glow: `shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_50px_rgba(59,130,246,0.18)]`.
     - Footer bar: Currently `bg-[hsl(var(--background)/0.6)] border-[hsl(var(--border))]` -> use `bg-[var(--glass-surface)]/80 border-[var(--glass-border)]`.

---

### 2.6 Floating Download Dock (`filefixer/src/components/download/DownloadDock.tsx`)
- **Location**: `filefixer/src/components/download/DownloadDock.tsx` (152 lines)
- **Current Styling**:
  - Container: `fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm z-40 pointer-events-auto animate-dock-in`.
  - Glass card: `overflow-hidden rounded-3xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]`.
- **Observations & Gaps**:
  1. **Placement**:
     - `bottom-20 md:bottom-6` ensures clearance above `MobileBottomNav` (which sits at `bottom-0` with `h-16`).
  2. **Touch Targets**:
     - Header buttons (Minimize, Clear) and Item buttons (Download, Dismiss):
       - Currently `flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center ... touch-manipulation`.
       - On `sm:`, 28×28px.
       - *Recommendation*: Increase to `h-11 w-11 sm:h-8 sm:w-8` with `after:min-w-[44px] after:min-h-[44px]` touch target pseudo-elements (following `Button.tsx` pattern) so mouse cursors have compact density while touch input targets meet ≥44px.
  3. **Atmospheric Lighting**:
     - Subtle electric-blue pulse on active downloads: `shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_25px_rgba(59,130,246,0.2)]`.

---

### 2.7 File Delivered Modal (`filefixer/src/components/download/FileDeliveredModal.tsx`)
- **Location**: `filefixer/src/components/download/FileDeliveredModal.tsx` (229 lines)
- **Current Styling**:
  - Overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in`.
  - Container: `w-full max-w-md overflow-hidden rounded-3xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] animate-scale-in`.
  - Animated SVG checkmark (`animate-check-draw`).
  - Stats card: `rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] p-3`.
  - Buttons: Download Again (`min-h-[46px]`), Reuse (`min-h-[44px]`), Done (`min-h-[44px]`).
- **Observations & Gaps**:
  1. **Close Button**:
     - Line 132: `flex h-11 w-11 sm:h-9 sm:w-9` -> on `sm:`, 36×36px. Set to `flex h-11 w-11 items-center justify-center`.
  2. **Frosted Backdrop**:
     - Upgrade backdrop from `backdrop-blur-xs` to `backdrop-blur-md bg-black/70`.
  3. **Accessibility**:
     - Tab focus trap is fully implemented (lines 46–70).
     - Escape key dismissal verified.
     - `.tabular-nums` verified on all size and percentage metrics.

---

### 2.8 Session Download Center Modal (`filefixer/src/components/download/DownloadCenterModal.tsx`)
- **Location**: `filefixer/src/components/download/DownloadCenterModal.tsx` (261 lines)
- **Current Styling**:
  - Overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in`.
  - Container (Line 121): `w-full max-w-xl overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in flex flex-col max-h-[85vh]`.
- **CRITICAL STYLING GAP IDENTIFIED**:
  - This modal has **NOT** been updated with the Cinematic Glass tokens!
  - It currently uses solid card colors (`border-[hsl(var(--border))] bg-[hsl(var(--card))]`), unlike `FileDeliveredModal` and `CommandCenter`.
  - *Recommendation*: Upgrade container to:
    `border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(59,130,246,0.15)]`.
  - Header & Summary stats: `border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/80`.
  - Item cards: `border border-[var(--glass-border)] bg-[var(--glass-surface)]/60 hover:border-[var(--glass-border-luminous)]`.
  - Close button: Change `h-11 w-11 sm:h-9 sm:w-9` to `h-11 w-11` (44×44px).
  - Item action buttons: `h-11 w-11 sm:h-9 sm:w-9` -> ensure `min-h-[44px] min-w-[44px] touch-manipulation`.

---

### 2.9 Voluntary Support Modal & Support Prompt
- **Locations**:
  - `filefixer/src/components/support/SupportModal.tsx` (160 lines)
  - `filefixer/src/components/support/SupportPrompt.tsx` (93 lines)
  - `filefixer/src/components/support/FooterSupportButton.tsx` (23 lines)
- **QR Asset Integrity Verification**:
  - Target Asset: `filefixer/public/images/filefixer_support_qr.png`
  - Computed SHA-256 Hash: `8592BD8A18457F3AC496D6735C472D7C4F3239E87B93771ED238D348B87D4744`
  - Status: **VERIFIED MATCH** (exit code 0).
  - Usages:
    1. `SupportModal.tsx`: `<Image src="/images/filefixer_support_qr.png" alt="FileFixer voluntary support UPI QR code" width={320} height={332} unoptimized priority ... />`
    2. `public/sw.js`: Pre-cached asset in service worker.
    3. Test suites: Validated in `tier1-feature-coverage.test.ts`, `tier4-application-scenarios.test.ts`, `m5-batch-utilities.test.ts`, and `routes-and-design.test.ts`.
  - Invariant Policy: The file must NEVER be modified, regenerated, or replaced under any circumstance.
- **Voluntary & Non-Blocking Design**:
  - `triggerSupportPrompt()` in `fileStore.ts`:
    - Checks `sessionStorage.getItem("filefixer_support_prompt_shown")`.
    - Throttled: Shown at most once per session.
    - Non-blocking: Delays by 1200ms after a delivery; never blocks download or file interactions.
    - Users can dismiss via Escape, "Maybe later" button, or X button.
  - `SupportModal`:
    - Dedicated WAI-ARIA dialog attributes: `role="dialog" aria-modal="true" aria-labelledby="support-dialog-title" aria-describedby="support-dialog-desc"`.
    - Tab focus trap present with Shift+Tab loop.
    - Escape key closes modal.
    - Click outside backdrop closes modal.
    - Fallback message rendered if image fails to load (`!imageFailed`).
    - QR container has solid white backdrop (`bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80`) to guarantee maximum optical contrast for smartphone UPI camera scanners.
- **Touch Target & Styling Recommendations**:
  - Close button in `SupportModal`: Change `h-11 w-11 sm:h-9 sm:w-9` to `h-11 w-11` (44×44px).
  - Close button in `SupportPrompt`: Change `h-11 w-11 sm:h-7 sm:w-7` to `h-11 w-11 sm:h-9 sm:w-9` with `min-h-[44px] min-w-[44px] touch-manipulation`.
  - Support Prompt container: Already has `rounded-3xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] p-4 sm:p-5 shadow-2xl backdrop-blur-2xl`.

---

## 3. Touch Target Compliance Matrix

| Component | Element | Current Class / Sizing | Compliance Status | Required Remediation |
|---|---|---|---|---|
| `Header` | Search Trigger | `flex min-h-[44px] sm:min-h-0 sm:h-9` | **FAIL** on `sm:` (36px) | Remove `sm:min-h-0 sm:h-9`; use `min-h-[44px] h-11 px-3.5` |
| `Header` | Shortcuts Button | `hidden sm:flex h-11 w-11 sm:h-9 sm:w-9` | **FAIL** on `sm:` (36px) | Keep `h-11 w-11` (44×44px) across all viewports |
| `Header` | Workspace Link | `min-h-[44px] sm:min-h-[38px]` | **FAIL** on `sm:` (38px) | Use `min-h-[44px] h-11 px-3.5` |
| `Header` | Hamburger Button | `flex h-11 w-11` | **PASS** (44×44px) | Maintain current size |
| `Header` | Mobile Drawer Links | `flex min-h-[44px]` | **PASS** (≥44px) | Maintain current size |
| `ThemeToggle` | Toggle Button | `h-11 w-11 sm:h-9 sm:w-9` | **FAIL** on `sm:` (36px) | Keep `h-11 w-11` (44×44px) across all viewports |
| `MobileBottomNav` | All 5 Nav Items | `min-h-[48px] touch-manipulation` | **PASS** (≥48px) | Maintain ≥48px with `touch-manipulation` |
| `WorkspaceDrawer` | Drawer Close | `flex h-11 w-11` | **PASS** (44×44px) | Maintain current size |
| `WorkspaceDrawer` | Tool Switchers | `min-h-[42px]` | **FAIL** (<44px) | Upgrade to `min-h-[44px]` |
| `WorkspaceDrawer` | Reuse / Download / Trash | `h-9` / `h-9 w-9` | **FAIL** (<44px) | Set `min-h-[44px] min-w-[44px]` with `touch-manipulation` |
| `CommandCenter` | Clear Button | `flex h-11 w-11 sm:h-8 sm:w-8` | **FAIL** on `sm:` (32px) | Use `min-h-[44px] min-w-[44px]` |
| `CommandCenter` | Result Item Options | `py-2.5 px-3.5` | **PARTIAL** (~44px) | Add explicit `min-h-[48px] touch-manipulation` |
| `DownloadDock` | Minimize / Clear | `h-11 w-11 sm:h-7 sm:w-7` | **FAIL** on `sm:` (28px) | Add touch target pseudo-element (`after:min-w-[44px] after:min-h-[44px]`) |
| `DownloadDock` | Re-download / Dismiss | `h-11 w-11 sm:h-7 sm:w-7` | **FAIL** on `sm:` (28px) | Add touch target pseudo-element (`after:min-w-[44px] after:min-h-[44px]`) |
| `FileDeliveredModal`| Close Button | `h-11 w-11 sm:h-9 sm:w-9` | **FAIL** on `sm:` (36px) | Set to `h-11 w-11` (44×44px) |
| `FileDeliveredModal`| Action Buttons | `min-h-[46px]`, `min-h-[44px]` | **PASS** (≥44px) | Maintain current size |
| `DownloadCenterModal`| Close Button | `h-11 w-11 sm:h-9 sm:w-9` | **FAIL** on `sm:` (36px) | Set to `h-11 w-11` (44×44px) |
| `DownloadCenterModal`| Action Buttons | `h-11 w-11 sm:h-9 sm:w-9` | **FAIL** on `sm:` (36px) | Set `min-h-[44px] min-w-[44px] touch-manipulation` |
| `SupportModal` | Close Button | `h-11 w-11 sm:h-9 sm:w-9` | **FAIL** on `sm:` (36px) | Set to `h-11 w-11` (44×44px) |
| `SupportPrompt` | Dismiss Button | `h-11 w-11 sm:h-7 sm:w-7` | **FAIL** on `sm:` (28px) | Use `min-h-[44px] min-w-[44px] touch-manipulation` |
| `Footer` | Support Button | `inline-flex text-xs py-1` | **PARTIAL** | Upgrade to `min-h-[44px]` frosted glass pill |

---

## 4. Exact Atmospheric Lighting & Glassmorphism Plan

### 4.1 Atmospheric Lighting Engine in `layout.tsx`
Currently, `layout.tsx` implements 3 fixed ambient glow nodes:
```tsx
<div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
  <div className="absolute -top-[15%] left-[10%] w-[680px] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--ambient-glow-1)_0%,transparent_70%)] blur-[90px]" />
  <div className="absolute top-[32%] -right-[10%] w-[580px] h-[480px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--ambient-glow-2)_0%,transparent_70%)] blur-[90px]" />
  <div className="absolute -bottom-[10%] left-[25%] w-[620px] h-[440px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--ambient-glow-1)_0%,transparent_70%)] blur-[90px]" />
</div>
```
- **Evaluation**: This creates an atmospheric backdrop without consuming render cycles or interfering with mouse/touch events (`pointer-events-none`).
- **Enhancement**: Modals and floating elements (CommandCenter, DownloadDock, SupportModal, MobileBottomNav) should cast their own luminous halo into this atmospheric lighting using:
  `box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(96, 165, 250, 0.25);` in dark mode.

### 4.2 Frosted Glass Surface Hierarchy
1. **Canvas Layer**:
   - Dark: `#070A12` (Cinematic deep obsidian canvas)
   - Light: `#F4F7FC` (Pristine clean canvas)
2. **Standard Glass Panels (`.glass-panel`)**:
   - `background: var(--glass-surface)` (~55% intensity: `rgba(20, 29, 47, 0.68)` in dark, `rgba(255, 255, 255, 0.75)` in light)
   - `backdrop-filter: blur(16px)`
   - `border: 1px solid var(--glass-border)`
3. **Elevated Glass Panels (`.glass-panel-elevated`)**:
   - `background: var(--glass-surface-elevated)` (`rgba(29, 42, 65, 0.76)` in dark, `rgba(255, 255, 255, 0.92)` in light)
   - `backdrop-filter: blur(20px)`
   - `border: 1px solid var(--glass-border-luminous)` (`rgba(96, 165, 250, 0.35)` in dark)
   - `box-shadow: var(--glass-shadow-elevated)`

---

## 5. Implementation Roadmap for Subsequent Sprints

1. **Sprint A — Shell Controls & Touch Targets**:
   - Standardize Header controls (search trigger, shortcuts, theme toggle, workspace button) to `h-11` / `min-h-[44px]`.
   - Update `ThemeToggle.tsx` to preserve `h-11 w-11` (44×44px) across all viewports.
   - Refine `MobileBottomNav` into a floating glass dock with `min-h-[48px]` and luminous active indicator.
2. **Sprint B — Modal Glassmorphism Migration**:
   - Migrate `DownloadCenterModal.tsx` from solid card to `glass-panel-elevated` tokens.
   - Update close buttons across all modals to `h-11 w-11` (44×44px).
   - Upgrade modal backdrop blur from `backdrop-blur-xs` to `backdrop-blur-md bg-black/70`.
3. **Sprint C — Verification Gate**:
   - Run `npm test` to ensure 376/376 tests pass.
   - Re-verify SHA-256 hash of `public/images/filefixer_support_qr.png`.
   - Run `npm run build` to verify all 33 static routes build with exit code 0.
