# Milestone 1 Adversarial Challenge Report: Modal Accessibility & Tabular Numerals

**Agent**: Focus Trap & CLS Challenger (`challenger_m1_2`)  
**Date**: 2026-10-22  
**Milestone**: Milestone 1 (Design System & Global Shell)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Verdict**: **REQUEST_CHANGES**

---

## Challenge Summary

**Overall risk assessment**: **CRITICAL**

Milestone 1 introduces significant design system improvements, contrast calibrations, touch target upgrades, and reliable tabular numerals. However, adversarial empirical testing of the application shell modals revealed multiple critical accessibility and keyboard navigation defects across `SupportModal.tsx`, `DownloadCenterModal.tsx`, and `FileDeliveredModal.tsx`, as well as a listbox focus-state desynchronization in `CommandCenter.tsx`.

| Component | Tab Trap | Shift-Tab | Focus Restore | Initial Focus | Scroll Lock | Escape Dismiss | Tabular Num | Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `CommandCenter.tsx` | Partial (All buttons focusable) | Partial | ✅ Yes | ✅ Yes (50ms) | ✅ Yes | ✅ Yes | ✅ Yes | **DEFECT (Desync)** |
| `SupportModal.tsx` | ❌ **NONE** | ❌ **NONE** | ✅ Yes | ❌ **NONE** | ✅ Yes | ✅ Yes | N/A | **CRITICAL DEFECT** |
| `DownloadCenterModal.tsx` | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ✅ Yes | **CRITICAL DEFECT** |
| `FileDeliveredModal.tsx` | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ❌ **NONE** | ✅ Yes | **CRITICAL DEFECT** |
| `DownloadDock.tsx` | N/A (Dock) | N/A | N/A | N/A | N/A | N/A | ✅ Yes | **PASS** |
| `globals.css` / Typography | N/A | N/A | N/A | N/A | N/A | N/A | ✅ Yes (0px jitter) | **PASS** |

---

## Challenges

### [Critical] Challenge 1: `SupportModal.tsx` Completely Lacks Tab Key Trapping & Initial Focus

- **Assumption challenged**: The worker reported in `handoff.md` and `PROJECT.md` line 41 that the voluntary support modal provides "accessible focus trapping".
- **Attack scenario**: 
  1. Open the support modal (via CommandCenter, SupportPrompt, or `openSupportModal()`).
  2. Press the `Tab` key.
  3. Observe that focus escapes the modal dialog completely and tabs through underlying header navigation and background page elements.
  4. Furthermore, upon opening, `SupportModal` records `previousFocusRef.current = document.activeElement`, but never places focus on the close button or dialog container. Focus remains on the background element that triggered the modal.
- **Blast radius**:
  - Direct violation of **WCAG 2.1.2 (No Keyboard Trap)** and **WAI-ARIA Authoring Practices (Dialog Modal Pattern)**.
  - Screen readers reading `aria-modal="true"` will announce a modal dialog while keyboard focus is active on background DOM nodes.
- **Mitigation**:
  1. Add a Tab focus trap handler inside `SupportModal.tsx` using `querySelectorAll` bounded to the dialog container (cycling between the close button and any focusable actions).
  2. Automatically focus the close button upon modal mount (`closeButtonRef.current?.focus()`).

---

### [Critical] Challenge 2: `DownloadCenterModal.tsx` Completely Lacks Modal Accessibility Handlers (Escape, Tab Trap, Scroll Lock, Focus Restore)

- **Assumption challenged**: `DownloadCenterModal.tsx` has `role="dialog"` and `aria-modal="true"`, assuming it functions as an accessible modal.
- **Attack scenario**:
  1. Trigger deliveries in the download queue and click "View All" in `DownloadDock`.
  2. Press `Escape` to close: **Nothing happens**. The modal remains open; only clicking the backdrop or clicking the small X button dismisses it.
  3. Press `Tab` repeatedly: Focus escapes into the underlying webpage.
  4. Scroll using mouse wheel or touch swipe: The underlying page scrolls freely because `document.body.style.overflow = "hidden"` is never invoked.
  5. Close the modal via X button: Focus is lost and does not return to the "View All" trigger in `DownloadDock`.
- **Blast radius**:
  - Violates WCAG 2.1.1 (Keyboard Accessible), WCAG 2.1.2 (No Keyboard Trap), and WCAG 2.4.3 (Focus Order).
  - Power users and keyboard-only users cannot dismiss the delivery modal with Escape.
- **Mitigation**:
  1. Implement an effect in `DownloadCenterModal.tsx` listening for `Escape` and calling `setDownloadCenterOpen(false)`.
  2. Add Tab/Shift-Tab focus trapping inside `DownloadCenterModal.tsx`.
  3. Apply `document.body.style.overflow = "hidden"` on mount and restore on unmount.
  4. Save `previousActiveElement` on open and restore focus upon dismissal.

---

### [Critical] Challenge 3: `FileDeliveredModal.tsx` Completely Lacks Modal Accessibility Handlers

- **Assumption challenged**: `FileDeliveredModal.tsx` declares `role="dialog"` and `aria-modal="true"`, but is completely passive.
- **Attack scenario**:
  1. When a file operation completes, `FileDeliveredModal` appears.
  2. Press `Escape`: Does not dismiss.
  3. Press `Tab`: Tabbing is not trapped within the modal card.
  4. Document body scroll is not locked.
- **Blast radius**: Keyboard users cannot dismiss the celebratory card using Escape, and screen reader virtual cursors escape into the background.
- **Mitigation**:
  - Add Escape key listener, focus trap, body scroll lock, and opener focus restoration to `FileDeliveredModal.tsx`.

---

### [Medium] Challenge 4: `CommandCenter.tsx` Option Buttons Cause Focus Trap Bloat and Focus/Selection Desynchronization

- **Assumption challenged**: Adding a Tab trap across all focusable elements inside `modalContainerRef` satisfies combobox accessibility.
- **Attack scenario**:
  1. Open CommandCenter (`Ctrl+K`).
  2. Press `Tab`. Instead of moving to dialog control buttons or staying constrained to the input, focus moves to the first result option `<button id="command-opt-nav-workspace">`.
  3. Press `Tab` 5 more times: Visual focus ring moves to option 5 (`action-compress-img`).
  4. However, `selectedIndex` is still `0`, and `aria-activedescendant` is still pointing to option 0 (`command-opt-nav-workspace`).
  5. The UI displays two conflicting selection indicators: option 0 has the active selection background (`bg-[hsl(var(--primary)/0.12)]`), while option 5 has the browser focus ring.
  6. Now press `ArrowDown`: `handleKeyDown` increments `selectedIndex` from 0 to 1, causing selection to jump to option 1, completely ignoring where the user tabbed!
- **Blast radius**:
  - Defective Combobox UX violating W3C Combobox specifications.
  - Keyboard users must press Tab 24+ times just to wrap around back to the search input.
- **Mitigation**:
  1. Set `tabIndex={-1}` on all option buttons in the listbox.
  2. Add `onFocus={() => setSelectedIndex(idx)}` to each option button to ensure that if an option receives focus, `selectedIndex` synchronizes immediately.

---

### [Low] Challenge 5: `CommandCenter.tsx` Uncanceled `setTimeout` on Rapid Open/Close

- **Assumption challenged**: Initial input focus timer runs cleanly.
- **Attack scenario**:
  - User presses `Ctrl+K` and immediately presses `Escape` within 20ms.
  - `setTimeout(() => inputRef.current?.focus(), 50)` was scheduled, but the timer ID is not cleared in the `useEffect` cleanup.
- **Blast radius**: Low; optional chaining prevents runtime errors, but unmanaged timers represent a memory hygiene violation.
- **Mitigation**: Store the timer ID and call `clearTimeout(timerId)` in the cleanup function.

---

## Stress Test Results

Empirically verified via `filefixer/tests/adversarial-modal-accessibility.test.ts` (16 automated tests passing in test runner):

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|:---:|
| `CommandCenter.tsx` Tab Trap on Last Item | Wraps focus to `inputRef` | Traps and wraps to `first` (`inputRef`) | **PASS** |
| `CommandCenter.tsx` Shift+Tab on First Item | Wraps focus to last button | Traps and wraps to `last` | **PASS** |
| `CommandCenter.tsx` Empty Search Query | Renders 24 default tools/workflows without crash | Renders all default items, clear button omitted | **PASS** |
| `CommandCenter.tsx` 10,000 Char Query | Does not hang, OOM, or throw RegExp syntax errors | Returns 0 matches in <1ms via safe `includes()` | **PASS** |
| `CommandCenter.tsx` Regex Metacharacters (`.*+?^${}()[]`) | Safely handled as literal text | Safe match, 0 errors | **PASS** |
| `CommandCenter.tsx` Rapid Escape Presses | Dismisses immediately, subsequent presses ignored | `setCommandCenterOpen(false)` handles cleanly | **PASS** |
| `CommandCenter.tsx` Combobox Options `tabIndex` | Options have `tabIndex={-1}` | `tabIndex={-1}` missing; options are tab-stops | **FAIL (DEFECT)** |
| `CommandCenter.tsx` Option `onFocus` sync | Synchronizes `selectedIndex` on focus | `onFocus` missing; focus desync occurs | **FAIL (DEFECT)** |
| `SupportModal.tsx` Escape Dismissal | Dismisses modal on Escape | Calls `closeSupportModal()` | **PASS** |
| `SupportModal.tsx` Body Scroll Locking | Sets `overflow = "hidden"` and restores | Locks and restores `document.body.style.overflow` | **PASS** |
| `SupportModal.tsx` Tab Key Focus Trap | Traps Tab and Shift+Tab within modal | **NO TAB LISTENER AT ALL**; focus escapes | **FAIL (CRITICAL)** |
| `SupportModal.tsx` Initial Focus on Mount | Focuses close button or dialog | **NO INITIAL FOCUS**; stays on background | **FAIL (CRITICAL)** |
| `DownloadCenterModal.tsx` Escape Dismissal | Dismisses modal on Escape | **NO ESCAPE LISTENER**; ignores Escape | **FAIL (CRITICAL)** |
| `DownloadCenterModal.tsx` Tab Focus Trap | Traps Tab within modal | **NO TAB LISTENER**; focus escapes | **FAIL (CRITICAL)** |
| `DownloadCenterModal.tsx` Body Scroll Locking | Locks background scrolling | **NO SCROLL LOCK**; background scrolls | **FAIL (HIGH)** |
| `DownloadCenterModal.tsx` Focus Restoration | Restores focus to opener on close | **NO RESTORATION**; focus is lost | **FAIL (HIGH)** |
| `FileDeliveredModal.tsx` Modal Accessibility | Escape, Tab trap, scroll lock | **NONE IMPLEMENTED** | **FAIL (CRITICAL)** |
| Tabular Numerals Font Feature Tokens | `globals.css` declares `tnum` & `tabular-nums` | Fully declared across multiple selectors | **PASS** |
| Tabular Numerals Metrics Coverage | Applied in Dock, Delivered, Center | Class `tabular-nums` present on all metrics | **PASS** |
| Layout Shift Glyph Width Oracle | 0px width jitter under dynamic byte counter updates | Measured jitter: Proportional = 580 units, Tabular = 0 units | **PASS (0 Jitter)** |

---

## Unchallenged Areas

- **IndexedDB Telemetry Storage (`history.ts`)**: Deferred to Milestone 5 per `PROJECT.md`.
- **Canvas / WebWorker Image Processing Engines**: Milestone 3 scope.
- **PDF-Lib Document Manipulation Engines**: Milestone 4 scope.

---

## Required Action Items for Worker (Remediation Plan)

1. **`SupportModal.tsx`**:
   - Add Tab focus trap: bind Tab and Shift+Tab to cycle between the close button and any modal interactive controls.
   - Set initial focus: on mount, focus the close button (`closeButtonRef.current?.focus()`).

2. **`DownloadCenterModal.tsx`**:
   - Add `useEffect` managing modal lifecycle:
     - Escape key listener to close modal (`setDownloadCenterOpen(false)`).
     - Tab / Shift-Tab focus trap across close button, download buttons, and clear buttons.
     - Body scroll locking (`document.body.style.overflow = "hidden"`).
     - Focus saving (`previousActiveElementRef.current = document.activeElement`) and focus restoration on unmount.
     - Initial focus on close button.

3. **`FileDeliveredModal.tsx`**:
   - Add `useEffect` managing modal lifecycle: Escape key dismissal, Tab trap, body scroll lock, initial focus on close button, and opener focus restoration.

4. **`CommandCenter.tsx`**:
   - Add `tabIndex={-1}` to all listbox item buttons (`#command-opt-*`) so that keyboard users navigating via Tab cycle between the search input and clear button.
   - Add `onFocus={() => setSelectedIndex(idx)}` to option buttons to prevent selection desynchronization.
   - Clear timer in cleanup: `clearTimeout(timerId)`.
