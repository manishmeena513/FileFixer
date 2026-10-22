# Technical Investigation & Fix Plan: SupportPrompt Mobile Positioning

**Investigator**: `explorer_m1_r3_1` (SupportPrompt Positioning Explorer)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Target Component**: `filefixer/src/components/support/SupportPrompt.tsx`  
**Referenced Component**: `filefixer/src/components/download/DownloadDock.tsx`  
**Date**: 2026-10-22  

---

## 1. Executive Summary

During Milestone 1 Iteration 2 challenge testing, the Challenger identified a physical collision on mobile viewports (`<640px`):
- When active downloads exist in `downloadQueue` (2 or more items), `DownloadDock` expands to a top coordinate of **307px** from the viewport bottom.
- `SupportPrompt` was previously positioned at `bottom-72` (**288px**).
- Both elements occupy full mobile width (`left-4 right-4`) with `z-40`.
- Because `SupportPrompt` is rendered after `DownloadDock` in `layout.tsx` (line 126 vs line 123), the bottom **19px** of `SupportPrompt` overlaps and occludes the top **19px** of `DownloadDock`, intercepting taps intended for the "View All", minimize chevron, and dismiss controls.

By updating `SupportPrompt`'s mobile bottom offset when `hasDownloads` is true to `bottom-[320px]` or `bottom-80` (320px), a clean **+13px positive vertical clearance** is established above `DownloadDock` (320px - 307px = +13px), eliminating all visual collision and touch interception.

---

## 2. Empirical Dimension & Geometry Verification

### 2.1 DownloadDock Mobile Height & Coordinate Breakdown
Target: `filefixer/src/components/download/DownloadDock.tsx` lines 33-82.
Viewport: `< 640px` (mobile).

| Component Segment | Tailwind Class / Style | Pixel Value | Cumulative Top Offset |
|---|---|---|---|
| **Base Position** | `fixed bottom-20` (5rem) | 80px | 80px |
| **Dock Header Vertical Padding** | `py-2.5` ($2 \times 10\text{px}$) | 20px | 100px |
| **Dock Header Control Elements** | `h-11` (44px) touch targets (Chevron/Close/View All) | 44px | 144px |
| **Dock Header Border** | `border-b` | 1px | 145px |
| **Items List Container** | `max-h-40` (10rem) scrollable list (when $\ge 2$ items) | 160px | 305px |
| **Outer Card Border** | `border` (1px top + 1px bottom) | 2px | **307px** |

**Total Top Coordinate of DownloadDock from Viewport Bottom = 307px.**

### 2.2 Collision with Current SupportPrompt
Target: `filefixer/src/components/support/SupportPrompt.tsx` line 41.

```tsx
hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
```

- When `hasDownloads === true`, mobile offset is `bottom-72`.
- `bottom-72` = $72 \times 0.25\text{rem} = 18\text{rem} = 288\text{px}$.
- Both components declare `left-4 right-4` ($100vw - 32\text{px}$) and `z-40`.
- Clearance calculation:
  $$\text{Clearance} = \text{SupportPrompt Bottom} - \text{DownloadDock Top} = 288\text{px} - 307\text{px} = \mathbf{-19\text{px}}$$
- **Result**: Severe 19px physical overlap across the full interactive header of `DownloadDock`.

### 2.3 Proposed Dimension Verification
- Proposed offset: `bottom-[320px]` or `bottom-80` (where `bottom-80` = $80 \times 0.25\text{rem} = 20\text{rem} = 320\text{px}$).
- Clearance calculation:
  $$\text{Clearance} = 320\text{px} - 307\text{px} = \mathbf{+13\text{px}}$$
- **Result**: A clean 13px air gap between the bottom border of `SupportPrompt` and the top border of `DownloadDock`.

---

## 3. Test Suite Invariant & Breakpoint Analysis

An investigation of the existing test suites revealed a critical test dependency:

### 3.1 Test 1: `filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts` (Task 4.1)
- Code:
  ```ts
  const promptBottomRemMatch = promptContent.match(/hasDownloads\s*\?\s*"bottom-([0-9]+|\[[0-9]+px\])/);
  let promptBottomPx = 0;
  if (promptBottomRemMatch[1].startsWith("[")) {
    promptBottomPx = parseInt(promptBottomRemMatch[1].replace(/[\[\]px]/g, ""), 10);
  } else {
    promptBottomPx = parseInt(promptBottomRemMatch[1], 10) * 4;
  }
  const clearance = promptBottomPx - dockTopCoordinatePx;
  assert.ok(clearance >= 0, ...);
  ```
- **Evaluation**:
  - Matches `bottom-[320px]` $\rightarrow$ `320px` $\rightarrow$ clearance $+13\text{px} \ge 0$ (PASS).
  - Matches `bottom-80` $\rightarrow$ $80 \times 4 = 320\text{px}$ $\rightarrow$ clearance $+13\text{px} \ge 0$ (PASS).

### 3.2 Test 2: `filefixer/tests/adversarial-modal-accessibility.test.ts` (Line 106)
- Code:
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
- **Evaluation**:
  - Notice that `ADV-SP-1` strictly asserts `spSource.includes("bottom-72")`.
  - If `SupportPrompt.tsx` uses `bottom-80 sm:bottom-72 md:bottom-6` or `bottom-[320px] sm:bottom-72 md:bottom-6`, `spSource.includes("bottom-72")` is satisfied via the `sm:bottom-72` segment, so **both tests pass simultaneously without editing test code**.
  - If `SupportPrompt.tsx` drops `bottom-72` entirely (e.g. `bottom-80 sm:bottom-6` or `bottom-[320px] sm:bottom-6`), `adversarial-modal-accessibility.test.ts` will fail unless line 106 is updated.

### 3.3 Tablet (`sm:`) Viewport Invariant
- On `sm` viewports ($640\text{px} \le \text{width} < 768\text{px}$), `MobileBottomNav` is still rendered (`lg:hidden`, height 64px).
- `DownloadDock` uses `bottom-20 md:bottom-6`, retaining `bottom-20` (80px) on `sm` specifically to clear the 64px `MobileBottomNav`.
- Keeping `sm:bottom-72` (or `sm:bottom-20`) ensures `SupportPrompt` on the left also clears `MobileBottomNav`.

---

## 4. Exact Implementation Recommendations

We provide two implementation paths:

### Path A (Recommended): Dual Test Green & Responsive Symmetry (Zero Test Editing Required)
Update `filefixer/src/components/support/SupportPrompt.tsx` line 41 to:
```tsx
<<<<
        hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
====
        hasDownloads ? "bottom-80 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
>>>>
```
*(Alternatively with `bottom-[320px]`:)*
```tsx
<<<<
        hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
====
        hasDownloads ? "bottom-[320px] sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
>>>>
```
**Benefits**:
1. Passes Challenger test Task 4.1 (`clearance = +13px >= 0`).
2. Retains `bottom-72` substring on `sm:bottom-72`, preserving 100% pass rate in `adversarial-modal-accessibility.test.ts` (ADV-SP-1).
3. Maintains proper clearance above `MobileBottomNav` on `sm` (tablet) viewports.

---

### Path B: Streamlined sm:bottom-6 Specification (Requires Updating Test ADV-SP-1)
If the team desires removing `sm:bottom-72` in favor of `sm:bottom-6`:

#### 1. Diff for `filefixer/src/components/support/SupportPrompt.tsx`:
```tsx
<<<<
        hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
====
        hasDownloads ? "bottom-[320px] sm:bottom-6" : "bottom-20 sm:bottom-6"
>>>>
```
*(or with `bottom-80`:)*
```tsx
<<<<
        hasDownloads ? "bottom-72 sm:bottom-72 md:bottom-6" : "bottom-20 sm:bottom-20 md:bottom-6"
====
        hasDownloads ? "bottom-80 sm:bottom-6" : "bottom-20 sm:bottom-6"
>>>>
```

#### 2. Accompanying Diff for `filefixer/tests/adversarial-modal-accessibility.test.ts` line 105-108:
```ts
<<<<
    it("ADV-SP-1: SupportPrompt coordinates vertical stacking when DownloadDock has items", () => {
      const spPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const spSource = fs.readFileSync(spPath, "utf-8");
      assert.ok(
        spSource.includes("downloadQueue") && spSource.includes("bottom-72"),
        "SupportPrompt must shift higher (bottom-72) when downloadQueue has active items to prevent collision"
      );
    });
====
    it("ADV-SP-1: SupportPrompt coordinates vertical stacking when DownloadDock has items", () => {
      const spPath = path.join(rootDir, "src/components/support/SupportPrompt.tsx");
      const spSource = fs.readFileSync(spPath, "utf-8");
      assert.ok(
        spSource.includes("downloadQueue") && (spSource.includes("bottom-[320px]") || spSource.includes("bottom-80") || spSource.includes("bottom-72")),
        "SupportPrompt must shift higher (bottom-80 or bottom-[320px]) when downloadQueue has active items to prevent collision"
      );
    });
>>>>
```

---

## 5. Verification Commands

To independently verify the fix:

1. Run the Challenger test suite:
   ```bash
   npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts
   ```
   *Expected Output*: Task 4.1 passes (`SupportPrompt bottom coordinate from viewport bottom: 320px`, `Measured clearance: 13px`).

2. Run the Modal Accessibility test suite:
   ```bash
   npx tsx --test tests/adversarial-modal-accessibility.test.ts
   ```
   *Expected Output*: ADV-SP-1 passes.

3. Verify production static build:
   ```bash
   npm run build
   ```
   *Expected Output*: Exit code 0, all 33 routes generated.
