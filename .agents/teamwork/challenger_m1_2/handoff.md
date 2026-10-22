# Milestone 1 Adversarial Challenge Handoff Report

**Agent**: Focus Trap & CLS Challenger (`challenger_m1_2`)  
**Role**: critic, specialist  
**Date**: 2026-10-22  
**Milestone**: Milestone 1 (Design System & Global Shell)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Direct code and empirical observations from the codebase and test harness:

1. **`SupportModal.tsx` Focus & Tab Trap (Lines 14–36)**:
   ```tsx
   useEffect(() => {
     if (isSupportModalOpen) {
       previousFocusRef.current = document.activeElement as HTMLElement | null;
       const originalOverflow = document.body.style.overflow;
       document.body.style.overflow = "hidden";

       const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
           closeSupportModal();
         }
       };

       window.addEventListener("keydown", handleKeyDown);
   ...
   ```
   - Direct observation: `handleKeyDown` in `SupportModal.tsx` checks only `e.key === "Escape"`. There is NO check for `e.key === "Tab"` or `e.shiftKey`.
   - Direct observation: When the modal mounts, `previousFocusRef.current` is assigned, but `.focus()` is never called on the close button or modal container.

2. **`DownloadCenterModal.tsx` Modal Lifecycle (Lines 18–30)**:
   ```tsx
   export function DownloadCenterModal() {
     const {
       isDownloadCenterOpen,
       setDownloadCenterOpen,
       downloadQueue,
       clearDownloads,
       removeDownload,
       setLatestDeliveredFile,
     } = useFileStore();

     if (!isDownloadCenterOpen) return null;
   ```
   - Direct observation: `DownloadCenterModal.tsx` declares `role="dialog"` and `aria-modal="true"`, but contains:
     - 0 `useEffect` hooks.
     - 0 `keydown` event listeners for `Escape` or `Tab`.
     - 0 statements locking `document.body.style.overflow`.
     - 0 focus management or focus restoration calls.

3. **`FileDeliveredModal.tsx` Modal Lifecycle (Lines 15–20)**:
   ```tsx
   export function FileDeliveredModal() {
     const { latestDeliveredFile, setLatestDeliveredFile, promoteOutputToInput, files } =
       useFileStore();

     if (!latestDeliveredFile) return null;
   ```
   - Direct observation: Completely lacks `Escape` key handling, Tab focus trap, body scroll lock, initial focus, and focus restoration.

4. **`CommandCenter.tsx` Option Buttons (Lines 502–514)**:
   ```tsx
   <button
     key={item.id}
     id={`command-opt-${item.id}`}
     onClick={item.action}
     onMouseEnter={() => setSelectedIndex(idx)}
     className=...
     role="option"
     aria-selected={isSelected}
   >
   ```
   - Direct observation: Listbox options are rendered as `<button>` elements with `role="option"`. They lack `tabIndex={-1}` and lack `onFocus={() => setSelectedIndex(idx)}`.
   - In `modalContainerRef.current.querySelectorAll`, all 24+ buttons are matched as tab-stops. Tabbing moves focus to option buttons without updating `selectedIndex`.

5. **Tabular Numerals & CLS Prevention**:
   - `filefixer/src/app/globals.css` lines 151–162:
     ```css
     .tabular-nums,
     [data-tabular-nums="true"],
     .font-feature-tnum,
     .font-mono,
     kbd,
     .metric-value,
     .stat-value {
       font-variant-numeric: tabular-nums;
       -moz-font-feature-settings: "tnum";
       -webkit-font-feature-settings: "tnum";
       font-feature-settings: "tnum";
     }
     ```
   - Direct observation: `.tabular-nums` is applied to byte counters and percentages in `DownloadDock.tsx` (line 110), `FileDeliveredModal.tsx` (line 90), `DownloadCenterModal.tsx` (lines 83, 129), and `CommandCenter.tsx` (line 534).
   - Empirical Glyph Width Oracle (`ADV-NUM-3` in `tests/adversarial-modal-accessibility.test.ts`): Across 6 dynamic progress byte updates of identical character length, proportional figure width jitter was 580 units, while tabular numerals yielded exactly 0 units jitter (0px layout shift).

6. **Automated Test Execution**:
   - Running `npx tsx --test tests/adversarial-modal-accessibility.test.ts`: 16/16 tests pass, validating all observations above.
   - Running complete test suite `npm run test`: 107/107 tests pass with 0 failures across 8 test suites.
   - Running `npm run build`: Next.js Turbopack generates all 33 static pages with exit code 0.

---

## 2. Logic Chain

1. **Modal Accessibility Logic**:
   - *Premise*: Under WCAG 2.1 Success Criterion 2.1.2 (No Keyboard Trap) and WAI-ARIA Dialog (Modal) Pattern, any dialog marked `aria-modal="true"` MUST:
     1. Contain keyboard focus within the dialog until explicitly closed (Tab wraps from last focusable to first, Shift+Tab wraps from first to last).
     2. Move focus into the dialog upon opening.
     3. Restore focus to the initiating element upon dismissal.
     4. Dismiss upon pressing the `Escape` key.
     5. Lock underlying viewport scrolling to prevent disorientation.
   - *Observation*:
     - `SupportModal.tsx` has NO Tab listener; pressing Tab allows keyboard focus to escape the modal into the underlying document (Observation 1). Focus is never initially placed inside the modal (Observation 1).
     - `DownloadCenterModal.tsx` has NO keydown listener for Escape, NO Tab trap, NO scroll lock, and NO focus restoration (Observation 2).
     - `FileDeliveredModal.tsx` has NO keydown listener for Escape, NO Tab trap, NO scroll lock, and NO focus restoration (Observation 3).
   - *Inference*: Users navigating with keyboards or screen readers will experience keyboard escape, broken focus restoration, inability to close dialogs with Escape, and background scroll leakage across `SupportModal`, `DownloadCenterModal`, and `FileDeliveredModal`.
   - *Conclusion*: Milestone 1 fails the modal accessibility requirement. Changes must be requested before Milestone 1 can be signed off.

2. **CommandCenter Combobox UX Logic**:
   - *Premise*: Under W3C Combobox Pattern, options within a listbox controlled by `aria-activedescendant` are navigated via Arrow keys on the input. Options should NOT be individual tab-stops unless they have independent interactive sub-controls.
   - *Observation*: In `CommandCenter.tsx`, listbox items are `<button>` elements without `tabIndex={-1}` and without `onFocus` handlers (Observation 4).
   - *Inference*: A user pressing Tab from the search input must cycle through 24+ individual option buttons before wrapping around. When an option is focused via Tab, `selectedIndex` does not update, resulting in visual and ARIA attribute desynchronization.
   - *Conclusion*: Options must have `tabIndex={-1}` and `onFocus` synchronization.

3. **Tabular Numerals & CLS Prevention Logic**:
   - *Premise*: Proportional digits vary in character advance width (e.g. digit '1' is narrower than digit '8'). When dynamic counters update rapidly (e.g. during compression or byte transfers), varying character widths cause cumulative layout shift (CLS).
   - *Observation*: `globals.css` declares `font-variant-numeric: tabular-nums` and font-feature settings `"tnum"`. All file size metrics in `DownloadDock`, `FileDeliveredModal`, and `DownloadCenterModal` carry `.tabular-nums` (Observation 5).
   - *Inference*: The empirical width oracle confirmed that width jitter drops from 580 units (under proportional digits) to exactly 0 units (under tabular digits).
   - *Conclusion*: Tabular numerals implementation satisfies the requirement and eliminates numeric layout shift.

---

## 3. Caveats

- **Component Wrapper vs CSS Class**: `worker_m1` authored `src/components/ui/TabularNum.tsx`, but consumer components (`DownloadDock`, `DownloadCenterModal`, `FileDeliveredModal`) currently use className `tabular-nums` with `formatBytes()` directly. While this achieves the identical font-variant behavior, importing `<FormatBytes>` would provide tighter architectural uniformity.
- **Out of Scope Pages**: File processing workstations (`/image-studio`, `/pdf-studio`, `/batch`, etc.) are assigned to Milestones 2–5. Testing was strictly scoped to Milestone 1 shell components, modals, and design tokens.

---

## 4. Conclusion

**Verdict**: **REQUEST_CHANGES**

The design system tokens, WCAG AA contrast calibrations, touch target enhancements, and tabular numerals CLS prevention are solidly built and verified. However, **Milestone 1 cannot be approved** in its current state due to critical modal accessibility omissions:
1. `SupportModal.tsx`: Missing Tab/Shift-Tab focus trap and missing initial focus.
2. `DownloadCenterModal.tsx`: Missing Escape key dismissal, missing Tab focus trap, missing body scroll lock, and missing focus restoration.
3. `FileDeliveredModal.tsx`: Missing Escape key dismissal, missing Tab focus trap, missing body scroll lock, and missing focus restoration.
4. `CommandCenter.tsx`: Option buttons in listbox lack `tabIndex={-1}` and lack `onFocus` synchronization, creating 24+ superfluous tab stops and focus desynchronization.

---

## 5. Verification Method

To independently reproduce and verify all observations and conclusions:

1. **Run the Adversarial Modal Accessibility Test Suite**:
   ```bash
   npx tsx --test tests/adversarial-modal-accessibility.test.ts
   ```
   *Expected result*: Exit code 0, 16/16 tests pass confirming each specific vulnerability and tabular numerals stability.

2. **Run Full Automated Test Suite**:
   ```bash
   npm run test --prefix filefixer
   ```
   *Expected result*: Exit code 0, 107/107 tests pass across 8 test suites.

3. **Verify Static Production Build**:
   ```bash
   npm run build --prefix filefixer
   ```
   *Expected result*: Exit code 0, 33/33 static routes compiled with Next.js Turbopack.

4. **Invalidation Conditions**:
   - If `SupportModal.tsx` is updated to include a Tab focus trap and initial focus on the close button, Challenge 1 is resolved.
   - If `DownloadCenterModal.tsx` and `FileDeliveredModal.tsx` are updated with full modal lifecycle effects (Escape dismissal, Tab focus trap, body scroll lock, opener focus restoration), Challenges 2 and 3 are resolved.
   - If `CommandCenter.tsx` options are updated with `tabIndex={-1}` and `onFocus={() => setSelectedIndex(idx)}`, Challenge 4 is resolved.
