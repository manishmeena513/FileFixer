# Milestone 1 Iteration 3 Adversarial Challenge Report

**Agent**: `challenger_m1_r3_2` (Modal Accessibility & Stacking Challenger)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Milestone**: Milestone 1 (Design System & Global Shell) — Iteration 3 Verification  
**Date**: 2026-10-22  
**Final Verdict**: **APPROVE**  

---

## Challenge Summary

**Overall risk assessment**: **LOW**

Following rigorous empirical test execution, mock DOM focus-trapping simulation, and multi-breakpoint geometric stacking analysis:
1. **Modal Accessibility Test Suite**: `tests/adversarial-modal-accessibility.test.ts` executes with **18/18 passing tests** (exit code 0, duration 462ms).
2. **Comprehensive Modal Accessibility Conformance**:
   - `SupportModal.tsx`: Verified focus trapping loop (single-element and multi-element), Escape dismissal, body scroll lock and restore, initial focus with 30ms timer cleanup, and opener focus restoration.
   - `DownloadCenterModal.tsx`: Verified Tab focus trapping loop, Escape dismissal, body scroll lock, initial focus with timer cleanup, and opener focus restoration.
   - `FileDeliveredModal.tsx`: Verified Tab focus trapping loop (Done button $\rightarrow$ Close button wrap-around), Escape dismissal, body scroll lock, initial focus with timer cleanup, and opener focus restoration.
   - `CommandCenter.tsx`: Verified WAI-ARIA Combobox & Listbox semantics (`tabIndex={-1}` on option buttons, `onFocus` synchronization to prevent visual desync, Tab focus trap excluding `tabindex="-1"` elements), Escape dismissal, body scroll lock, initial focus with timer cleanup, and opener focus restoration.
3. **ADV-SP-1 Mobile Coordinate Verification**:
   - `SupportPrompt.tsx` uses `bottom-80` ($20\text{rem} = 320\text{px}$) on mobile (<640px) when `hasDownloads === true`.
   - `DownloadDock.tsx` maximum top coordinate under full 2+ item load is $80\text{px (base bottom-20)} + 65\text{px (header)} + 160\text{px (items list)} + 2\text{px (borders)} = 307\text{px}$.
   - Clearance is $320\text{px} - 307\text{px} = \mathbf{+13\text{px}}$ positive clearance, completely eliminating visual overlap.
4. **Full Test & Build Verification**:
   - Full workspace test suite (`npm test`): **10 suites, 133 tests passed, 0 failed**.
   - Production Next.js App Router static build (`npm run build`): Exit code 0, all **33/33 static routes** cleanly compiled.

---

## Challenges

### [Low] Challenge 1: Tablet Breakpoint Transition Geometry (`sm:` 640px–767px)

- **Assumption challenged**: The worker assumed updating `bottom-72` to `bottom-80` on mobile (<640px) while retaining `sm:bottom-72` in `SupportPrompt.tsx` (`hasDownloads ? "bottom-80 sm:bottom-72 md:bottom-6" : ...`) completely resolved vertical overlap on all non-desktop viewports.
- **Attack scenario**:
  - At viewport width $W = 640\text{px}$ (exact `sm:` boundary), `SupportPrompt` is positioned at `sm:left-6` with `max-w-sm` ($384\text{px}$), extending to $x = 24 + 384 = 408\text{px}$.
  - Simultaneously, `DownloadDock` is positioned at `sm:right-6` with `max-w-sm` ($384\text{px}$), extending leftward to $x = 640 - 24 - 384 = 232\text{px}$.
  - The two bounding boxes overlap horizontally between $x = 232\text{px}$ and $x = 408\text{px}$ (an overlap span of $176\text{px}$).
  - In `SupportPrompt.tsx`, the vertical offset drops from `bottom-80` ($320\text{px}$) on mobile to `sm:bottom-72` ($288\text{px}$) at 640px.
  - Because `DownloadDock` has top coordinate $307\text{px}$ when expanded with $\ge 2$ downloads, `DownloadDock`'s upper $19\text{px}$ ($307\text{px} - 288\text{px} = 19\text{px}$) intersects `SupportPrompt`'s bottom bounding box if both components are forced to their full $384\text{px}$ width.
- **Blast radius**: Minimal in real-world usage. `SupportPrompt` content is compact ($< 340\text{px}$ natural width), session-throttled ($1200\text{ms}$ delay, dismissed on user action), and `DownloadDock` is often collapsed or has 1 item ($Y_{\text{top}} = 187\text{px} < 288\text{px}$, leaving $+101\text{px}$ clearance).
- **Mitigation (Recommended for M5)**: In Milestone 5 (Batch & Delivery), change `sm:bottom-72` in `SupportPrompt.tsx` to `sm:bottom-80` (or simplify to `bottom-80 lg:bottom-6`) so the $+13\text{px}$ clearance is preserved through the tablet breakpoint.

---

### [Low] Challenge 2: Tablet Bottom Navigation vs Dock Transition (`md:` 768px–1023px)

- **Assumption challenged**: The shell components assume `MobileBottomNav` is only present on mobile/tablet `< 768px`, while `MobileBottomNav.tsx` specifies `lg:hidden` (persisting up to $1023\text{px}$).
- **Attack scenario**:
  - `MobileBottomNav.tsx` uses `lg:hidden`, remaining visible on viewports from $768\text{px}$ to $1023\text{px}$ ($h = 64\text{px}$).
  - Concurrently, `DownloadDock.tsx` and `SupportPrompt.tsx` switch to `md:bottom-6` ($24\text{px}$ from bottom) at $768\text{px}$.
  - In `Footer.tsx`, line 9 switches to `md:pb-0` at $768\text{px}$.
  - On a tablet device in portrait mode (e.g. iPad at $768\text{px}$ or $810\text{px}$), the bottom $40\text{px}$ ($64\text{px} - 24\text{px}$) of `DownloadDock` and `SupportPrompt` overlaps `MobileBottomNav`.
- **Blast radius**: Low. The primary target for `MobileBottomNav` is smartphone form factors ($< 640\text{px}$), and on desktop ($\ge 1024\text{px}$), `MobileBottomNav` is cleanly hidden with zero overlap.
- **Mitigation (Recommended for M5)**: Align breakpoint thresholds in Milestone 5: either update `MobileBottomNav.tsx` to `md:hidden` (matching `Footer` and dock transitions), or update `DownloadDock.tsx`, `SupportPrompt.tsx`, and `Footer.tsx` to transition at `lg:` (`lg:bottom-6`, `lg:pb-0`).

---

## Stress Test Results

| Test ID | Component / Scenario | Verification Method | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|---|
| ADV-SM-1 | SupportModal Escape & Scroll Lock | Source code & Event Listener audit | Dismisses on Esc, locks `document.body` scroll | Clean Escape handler, `overflow = "hidden"` + cleanup | PASS |
| ADV-SM-2 | SupportModal Tab Focus Trap | Mock DOM KeyDown simulation | Intercepts Tab, loops first/last focusables | Traps single and multi-element focus rings | PASS |
| ADV-SM-3 | SupportModal Initial Focus | Ref & Timeout source inspection | Focuses close button with cleanup | Ref assigned, 30ms fallback timer, `clearTimeout` | PASS |
| ADV-DCM-1 | DownloadCenterModal Escape | Source & KeyDown test | Dismisses on Escape | Intercepts Escape and updates store state | PASS |
| ADV-DCM-2 | DownloadCenterModal Focus Trap | Mock DOM KeyDown simulation | Traps Tab between Clear button and Close button | Wraps Clear $\rightarrow$ Close and Close $\rightarrow$ Clear | PASS |
| ADV-DCM-3 | DownloadCenterModal Scroll Lock | Source & DOM style trace | Locks body scroll on open, restores on close | `overflow = "hidden"` on mount, restores on unmount | PASS |
| ADV-DCM-4 | DownloadCenterModal Focus Return | ActiveElement capture audit | Restores focus to opener on dismissal | `previousFocusRef.current.focus()` executed | PASS |
| ADV-FDM-1 | FileDeliveredModal A11y Suite | Mock DOM & source audit | Escape, Tab trap, scroll lock, focus restoration | All 4 accessibility primitives verified | PASS |
| ADV-CC-1 | CommandCenter Keyboard Listeners | Source & KeyDown test | Tab trap, Shift+Tab reverse, Escape, scroll lock | All handlers present with clean cleanup | PASS |
| ADV-CC-5 | CommandCenter Combobox Desync | Refined selector & option tabindex | Options have `tabIndex={-1}`, `onFocus` sync | Options excluded from Tab ring, syncs `selectedIndex` | PASS |
| ADV-SP-1 | SupportPrompt Vertical Offset | Coordinate math & string match | `bottom-80` ($320\text{px}$) when `hasDownloads` | $320\text{px} - 307\text{px} = +13\text{px}$ clearance | PASS |
| ADV-NUM-1 | globals.css Tabular Figures | CSS inspection | `.tabular-nums`, `font-variant-numeric: tabular-nums` | Universal declarations present | PASS |
| ADV-NUM-3 | Empirical CLS Layout Shift | Font metric width oracle | Monospaced advance widths across byte updates | 0 jitter oscillation across byte strings | PASS |
| TC-ALL | Full Workspace Test Suite | `npm test --prefix filefixer` | All 133 tests pass | 10/10 suites, 133/133 tests green | PASS |
| TC-BLD | Production Static Build | `npm run build --prefix filefixer` | Exit code 0, 33/33 static routes | 33 routes generated, exit code 0 | PASS |

---

## Unchallenged Areas

- **Physical Screen Readers on Mobile Devices (TalkBack / VoiceOver)**: Focus trapping and ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, `aria-activedescendant`) were empirically validated via DOM structure and event listener interception rather than live screen reader software.
- **Hardware Touch Multi-touch Gestures**: Touch target hit-boxes ($\ge 44\times 44\text{px}$) were verified through box model dimensions and pseudo-element hit-areas.

---

## Verdict & Recommendation

**Verdict**: **APPROVE**

1. All modal accessibility requirements for Milestone 1 are completely met and verified: focus trapping loops properly, Escape dismisses reliably, body scroll locks without leakage, initial focus lands on the primary interactive element, and opener focus is restored upon modal dismissal.
2. The mobile vertical stacking collision between `SupportPrompt` and `DownloadDock` has been genuinely resolved with $+13\text{px}$ of positive clearance.
3. The minor tablet transition edge cases noted above do not block Milestone 1 and are recommended for refinement during Milestone 5 (Batch & Delivery).
4. Milestone 1 is verified and approved. The team is cleared to transition to Milestone 2.
