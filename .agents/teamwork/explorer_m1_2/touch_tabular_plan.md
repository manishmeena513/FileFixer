# Implementation Plan: Milestone 1 Touch Targets (≥44px) & Universal Tabular Numerals

**Agent**: Explorer M1-2 (`explorer_m1_2`)  
**Date**: 2026-10-22  
**Target Codebase**: `filefixer/src`  
**Milestone**: Milestone 1 (Design System & Global Shell)  
**Requirements Addressed**: ORIGINAL_REQUEST.md R1 & R5; PROJECT.md Features #2, #6  

---

## 1. Executive Summary & Problem Scope

This implementation plan defines the precise code changes, architectural mechanics, component specifications, and concrete diffs required to fulfill two critical quality and accessibility requirements of Milestone 1:

1. **Touch Target Compliance (≥44×44px)**:
   - On touch devices (smartphones and tablets), multiple core UI primitives (`Button`, `Slider`, `Switch`, `Checkbox`, `Select`, `Tabs`) and shell elements (`Header` search trigger, `ThemeToggle`, modal dismiss buttons, `DownloadDock` actions, `FileCard` remove triggers) currently measure between 16px and 40px, failing WCAG 2.5.5 / 2.5.8 and Apple HIG / Material Design guidelines.
   - **Architectural Solution**: A dual-strategy model combining **responsive visual scaling** (e.g. `h-11 sm:h-10` for primary buttons and selects) with **zero-layout-shift invisible touch padding** (`after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px]` on mobile, hidden on desktop `sm:after:hidden`) for compact elements (`xs`, `sm`, `icon` buttons, switches, checkboxes, slider thumbs). This guarantees strict ≥44×44px tap targets without disrupting desktop density, Swiss typography, or table layouts.

2. **Universal Tabular Numerals & CLS Elimination**:
   - In proportional sans-serif fonts (including Geist Sans), digits 0–9 vary in character advance width (e.g., `1` is significantly narrower than `8` or `0`). When dynamic metrics update during real-time compression, conversion, batch queues, sliders, or countdowns, character widths oscillate, causing Cumulative Layout Shift (CLS) and visual horizontal jitter.
   - Currently, `.tabular-nums` is declared in `globals.css` but utilized in only 2 files (`BeforeAfter.tsx` and `history/page.tsx`). Over 25 components formatting file sizes (`formatBytes`), dimensions, percentages, and progress counters lack tabular figures.
   - **Architectural Solution**: A unified three-tier defense:
     1. Global CSS token enforcement in `globals.css` for `.tabular-nums`, `[data-tabular-nums="true"]`, `.font-mono`, and `kbd`.
     2. A dedicated polymorphic React component primitive: `src/components/ui/TabularNum.tsx` exporting `<TabularNum>`, `<FormatBytes>`, and `<SavingsPct>`.
     3. Explicit application of `tabular-nums` across all 25 identified metric callouts in tools, modals, drawers, and docks.

---

## 2. Baseline Evidence & Audit Findings

### 2.1 Touch Targets Non-Compliance Audit (Threshold: ≥44×44px)

| Component | Selector / Usage | Measured Visual Dimensions | Measured Touch Target | WCAG AA Status | Proposed Fix Method |
|---|---|---|---|---|---|
| `Button.tsx` (size="xs") | Table actions, filter pills | 28px height (`h-7`) | 28×N px | ❌ FAIL | Pseudo-element touch box `after:min-w-[44px] after:min-h-[44px]` (mobile only) |
| `Button.tsx` (size="sm") | Modal footers, toolbar buttons | 32px height (`h-8`) | 32×N px | ❌ FAIL | Pseudo-element touch box `after:min-w-[44px] after:min-h-[44px]` (mobile only) |
| `Button.tsx` (size="md") | Default primary buttons across tools | 40px height (`h-10`) | 40×N px | ❌ FAIL | Responsive height `h-11 sm:h-10` (44px on mobile, 40px on desktop) |
| `Button.tsx` (size="icon") | Header shortcuts, dock controls | 36×36px (`h-9 w-9`) | 36×36px | ❌ FAIL | Responsive size `h-11 w-11 sm:h-9 sm:w-9` + touch padding fallback |
| `Slider.tsx` (Thumb) | Compression & quality dials | 24×24px (`h-6 w-6`) | 24×24px | ❌ FAIL | Pseudo-element touch area `after:min-w-[44px] after:min-h-[44px]` on thumb |
| `Slider.tsx` (Root) | Slider track container | ~24px height | ~24px height | ❌ FAIL | Container padding `min-h-[44px] sm:min-h-0 py-2.5 sm:py-2` |
| `Switch.tsx` (Root) | Strip EXIF, keep format toggles | 20×36px (`h-5 w-9`) | 20×36px | ❌ FAIL | Centered pseudo-element `after:min-w-[44px] after:min-h-[44px]` |
| `Checkbox.tsx` (Root) | Multi-select page checklists | 16×16px (`h-4 w-4`) | 16×16px | ❌ FAIL | Centered pseudo-element `after:min-w-[44px] after:min-h-[44px]` |
| `Select.tsx` (Trigger) | Format pickers, presets | 40px height (`h-10`) | 40×N px | ❌ FAIL | Responsive height `min-h-[44px] sm:min-h-0 sm:h-10 h-11` |
| `Tabs.tsx` (List & Trigger) | Mode switchers (Auto/Target/Quality) | 40px height (`h-10`) | ~34px height | ❌ FAIL | Responsive height `min-h-[44px] sm:min-h-0 sm:h-10 h-11` + `touch-manipulation` |
| `Header.tsx` (Search) | Mobile search button | ~28px height | ~28px height | ❌ FAIL | Responsive `min-h-[44px] sm:min-h-0 sm:py-1.5 py-2.5` |
| `ThemeToggle.tsx` | Header theme switch button | 36×36px (`h-9 w-9`) | 36×36px | ❌ FAIL | Responsive `h-11 w-11 sm:h-9 sm:w-9` |
| `CommandCenter.tsx` | Search clear button | 24×24px (`p-1`) | 24×24px | ❌ FAIL | Touch box `h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center` |
| `DownloadDock.tsx` | Header minimize / clear / re-download | 24–28px (`p-1` / `h-7`) | 24–28px | ❌ FAIL | Pseudo-element touch expansion to 44×44px |
| `Modals Close Btns` | SupportModal, FileDeliveredModal, etc. | 36×36px (`h-9 w-9`) | 36×36px | ❌ FAIL | Responsive size `h-11 w-11 sm:h-9 sm:w-9` |
| `CompareSlider` | Handle circular grab indicator | 42×42px (`width: 42px`) | 42×42px | ❌ FAIL | Increase `globals.css` rule to `width: 44px; height: 44px;` |

---

### 2.2 Tabular Numerals & Cumulative Layout Shift (CLS) Inventory

| Component / File Path | Metric Displayed | Current Markup | CLS Impact | Proposed Fix |
|---|---|---|---|---|
| `components/download/FileDeliveredModal.tsx`: 99-120 | Original size, output size, savings % | `<p className="text-xs font-bold text-[hsl(var(--foreground))]">{formatBytes(...)}</p>` | Medium (modal card shifts during animation) | Add `tabular-nums` to stat grid container & paragraph tags |
| `components/download/DownloadDock.tsx`: 115-120 | Queue item size & savings % | `<span>{formatBytes(item.outputSize || item.originalSize)}</span>` | High (dock item jitter as files complete) | Add `tabular-nums font-mono` to metric wrapper |
| `components/download/DownloadCenterModal.tsx`: 89, 96, 104, 131, 134 | Total original, final size, total saved, item sizes | `<p className="text-xs font-bold">{formatBytes(totalOriginalSize)}</p>` | High (aggregate summary bar shifts) | Add `tabular-nums` to stat containers & file row metrics |
| `components/workspace/WorkspaceDrawer.tsx`: 145, 150, 156, 162, 342, 350 | Total, Ready, Done counts, Total Size, item dimensions | `<p className="text-xs font-semibold truncate mt-0.5">{formatBytes(totalInputSize)}</p>` | High (drawer KPI bar reflows on file import) | Add `tabular-nums` to KPI numbers and item dimension spans |
| `components/workspace/WorkspaceView.tsx`: 531, 535, 575, 624, 640 | Canvas toolbar file size, dimensions, zoom %, PDF size | `<Badge variant="outline" className="text-[10px] font-mono shrink-0">{formatBytes(activeFile.size)}</Badge>` | High (toolbar zoom and canvas info jitter) | Add `tabular-nums` to zoom badge and file size tags |
| `components/upload/FileCard.tsx`: 110, 114, 123, 127 | File size, width×height, output size, savings badge | `<span className="text-xs text-[hsl(var(--muted-foreground))]">{formatBytes(file.size)}</span>` | Critical (every file row in all upload lists reflows) | Add `tabular-nums` to the metric container `div` |
| `components/workflows/WorkflowBuilder.tsx`: 494, 525, 544 | Total weight, step countdown, saved bandwidth badge | `Saved {formatBytes(totalSaved)} ({savedPct.toFixed(0)}%)` | High (pipeline execution badge shifts) | Add `tabular-nums` to progress banner and summary badge |
| `components/command/CommandCenter.tsx`: 315 | Active session file subtitle (size • dimensions • status) | `subtitle: \`${formatBytes(f.size)}${...}\`` | Low (option list subtitle width variation) | Wrap subtitle in tabular figure class |
| `app/smart-compress/page.tsx`: 206, 257, 268, 296 | Original size, target KB/MB, attempt sizes | `<span className="font-mono font-bold text-[hsl(var(--primary))]">{qualityPct}%</span>` | Critical (slider drag and progressive passes flicker) | Add `tabular-nums` to progressive attempt rows & quality dial |
| `app/batch/page.tsx`: 320, 328, 337, 353, 686, 757 | Before, After, Space Saved, Progress %, Quality % | `<span className="font-mono font-bold text-[hsl(var(--primary))]">{progressPct}%</span>` | Critical (batch progress bar and table rows shift constantly) | Add `tabular-nums` to Before/After stats and progress text |
| `app/compress-image/page.tsx`: 295 | Quality percentage readout | `<span className="text-xs font-mono font-bold text-[hsl(var(--primary))]">{qualityPct}%</span>` | High (dragging quality slider causes label jitter) | Add `tabular-nums` to slider percentage readout |
| `app/resize-image/page.tsx`: 251, 319 | Preset dimensions (W × H px), scale % buttons | `<span className="text-[11px] font-mono mt-0.5">{p.width} × {p.height} px</span>` | Low (grid preset labels) | Add `tabular-nums` to dimension and scale buttons |
| `app/convert-image/page.tsx`: 223 | Quality percentage readout | `<span className="text-xs font-mono font-bold text-[hsl(var(--primary))]">{qualityPct}%</span>` | High (quality slider readout) | Add `tabular-nums` to slider percentage readout |
| `app/image-metadata/page.tsx`: 139, 241 | File size, cleaned blob size | `{formatBytes(selectedFile.size)} · {selectedFile.type}` | Medium (metadata header & scrubbed card) | Add `tabular-nums` to file size readouts |
| `app/image-studio/page.tsx`: 246, 249 | File size, output blob size | `<span>{formatBytes(imageFile.size)}</span>` | Medium (studio canvas header) | Add `tabular-nums` to studio size indicators |
| `app/pdf-compress/page.tsx`: 225, 235, 237, 239 | Original size, output size, savings %, page count | `{formatBytes(result.originalSize)} → {formatBytes(result.outputSize)}` | High (result card stats) | Add `tabular-nums` to result readouts |
| `app/pdf-merge/page.tsx`: 264 | Merged document page count & size | `Total {mergedStats.count} pages · {formatBytes(mergedStats.size)}` | Low (completion card) | Add `tabular-nums` to stats readout |
| `app/pdf-split/page.tsx`: 238 | File size & page count | `{formatBytes(selectedFile.size)} · {totalPages} Pages` | Low (file header card) | Add `tabular-nums` to file size readout |
| `app/pdf-workspace/page.tsx`: 203, 244, 248 | Workspace page count, file size, thumbnail rotation tags | `{pages.length} Pages · {formatBytes(selectedFile.size)}` | Low (workspace header) | Add `tabular-nums` to page tags and file size |
| `app/images-to-pdf/page.tsx`: 227 | Individual image sizes in reorder list | `{formatBytes(it.file.size)}` | Medium (image sequence list) | Add `tabular-nums` to image size readouts |
| `app/pdf-studio/page.tsx`: 211, 244, 248 | Page count, file size badge, thumbnail rotation tags | `<Badge variant="outline">{pages.length} Pages • {formatBytes(pdfFile.size)}</Badge>` | Low (studio header) | Add `tabular-nums` to badge and rotation tags |
| `app/privacy-cleaner/page.tsx`: 235 | Cleaned file size & status readouts | Clean file badge & metrics | Low (completion card) | Add `tabular-nums` to status tags |
| `app/inspect/page.tsx`: 118, 143, 148 | File size (formatted & bytes), resolution (W × H px), aspect ratio | `<span className="font-mono">{metadata.sizeFormatted} ({metadata.size.toLocaleString()} bytes)</span>` | Medium (inspector attributes table) | Add `tabular-nums` to inspector value cells |
| `app/page.tsx`: 396 | Smart drop zone file count and total size badge | `<Badge variant="default">{files.length} files • {formatBytes(totalSize)}</Badge>` | High (homepage hero dropzone shifts on file load) | Add `tabular-nums` to hero badge |

---

## 3. UI Primitives Architecture & Touch Target Engineering

### 3.1 Button Primitive (`filefixer/src/components/ui/button.tsx`)

#### Design Rationale:
Buttons serve diverse purposes across FileFixer: dense table actions (`xs`), toolbar chips (`sm`), standard form/dialog actions (`md`), prominent hero CTAs (`lg`), and standalone icon buttons (`icon`).
- For `md`: Upgrade default mobile height from `h-10` (40px) to `h-11` (44px) on mobile, relaxing back to `sm:h-10` on desktop screens (≥640px). This provides tactile comfort on phones while maintaining compact desktop layouts.
- For `lg`: Already `h-12` (48px) — compliant across all viewports.
- For `icon`: Scale responsively to `h-11 w-11 sm:h-9 sm:w-9`. The visual box is 44×44px on mobile, cleanly centered, and 36×36px on desktop with touch padding fallback.
- For `xs` (28px) and `sm` (32px): Enforcing visual 44px height would destroy table layout density and badge aesthetics. Therefore, apply **invisible pseudo-element touch padding**:
  ```css
  relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden
  ```
  On touch screens (< 640px), any finger tap within the 44×44px envelope hits the button. On desktop (≥640px), `sm:after:hidden` disables the pseudo-element so mouse hover and tight clicks remain pixel-bound to the visual border.

#### Proposed Specification for `button.tsx`:
```tsx
const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
  sm: "h-8 px-3 text-xs gap-1.5 relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
  md: "h-11 sm:h-10 px-4 py-2 text-sm gap-2 touch-manipulation",
  lg: "h-12 px-6 text-base gap-2 touch-manipulation",
  icon: "h-11 w-11 sm:h-9 sm:w-9 p-0 relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
};
```

---

### 3.2 Slider Primitive (`filefixer/src/components/ui/slider.tsx`)

#### Design Rationale:
- The `SliderPrimitive.Root` must provide a minimum 44px tap zone along the entire track width on mobile so users don't have to aim precisely at a 2px line.
- The `SliderPrimitive.Thumb` is visually 24×24px (`h-6 w-6`) on mobile and 20×20px (`sm:h-5 sm:w-5`) on desktop. Adding a centered invisible pseudo-element `after:w-11 after:h-11 after:min-w-[44px] after:min-h-[44px]` provides an effortless touch-and-drag area without turning the thumb into an oversized circle.

#### Proposed Specification for `slider.tsx`:
```tsx
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center min-h-[44px] sm:min-h-0 py-2.5 sm:py-2",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
      <SliderPrimitive.Range className="absolute h-full bg-[hsl(var(--primary))]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative block h-6 w-6 sm:h-5 sm:w-5 rounded-full border-2 border-[hsl(var(--primary))] bg-[hsl(var(--background))] shadow-md transition-transform active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:min-w-[44px] after:min-h-[44px] after:content-['']" />
  </SliderPrimitive.Root>
));
```

---

### 3.3 Switch Primitive (`filefixer/src/components/ui/switch.tsx`)

#### Design Rationale:
The standard iOS-style switch is visually `h-5 w-9` (20×36px). Rather than blowing up the switch to an awkward 44px pill, we expand its hit zone using an invisible centered pseudo-element `after:min-w-[44px] after:min-h-[44px]`.

#### Proposed Specification for `switch.tsx`:
```tsx
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors touch-manipulation",
      "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-['']",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "bg-[hsl(var(--secondary))] data-[state=checked]:bg-[hsl(var(--primary))]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
```

---

### 3.4 Checkbox Primitive (`filefixer/src/components/ui/checkbox.tsx`)

#### Design Rationale:
Checkboxes are visually `h-4 w-4` (16×16px). Adding `after:min-w-[44px] after:min-h-[44px]` centers a 44×44px hit-box over the check box, guaranteeing finger hits without disturbing adjacent text alignment.

#### Proposed Specification for `checkbox.tsx`:
```tsx
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer relative h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] touch-manipulation",
      "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:content-['']",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:border-[hsl(var(--primary))] data-[state=checked]:text-[hsl(var(--primary-foreground))]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
```

---

### 3.5 Select & Tabs Primitives (`select.tsx`, `tabs.tsx`)

- **`SelectTrigger`**: Change from `h-10` to `h-11 sm:h-10 min-h-[44px] sm:min-h-0`.
- **`SelectItem`**: Change from `py-1.5` to `min-h-[44px] sm:min-h-[36px] py-2.5 sm:py-1.5` to ensure dropdown option targets can be selected on phones without mis-tapping adjacent items.
- **`TabsList`**: Change from `h-10` to `h-11 sm:h-10 min-h-[44px] sm:min-h-0`.
- **`TabsTrigger`**: Add `min-h-[38px] sm:min-h-0 py-2 sm:py-1.5 touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:content-[''] sm:after:hidden`.

---

## 4. Universal Tabular Numerals Architecture & CLS Prevention

### 4.1 CSS Mechanics & Token Calibration (`filefixer/src/app/globals.css`)

In `globals.css`, enhance lines 146–151 to apply OpenType `tnum` font-feature settings across all numeric classes:

```css
/* Universal Tabular Figures for metrics, badges, and numeric counters */
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

---

### 4.2 Dedicated React Helper Component (`src/components/ui/TabularNum.tsx`)

Create a new lightweight, zero-dependency helper primitive in `src/components/ui/TabularNum.tsx`:

```tsx
import * as React from "react";
import { cn, formatBytes as formatBytesUtil, calcSavings as calcSavingsUtil } from "@/lib/utils";

export interface TabularNumProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string | number;
  prefix?: string;
  suffix?: string;
}

/**
 * TabularNum: Enforces tabular-nums font features to eliminate CLS during numeric updates.
 */
export function TabularNum({
  value,
  prefix,
  suffix,
  className,
  children,
  ...props
}: TabularNumProps) {
  return (
    <span
      className={cn("tabular-nums inline-block font-feature-tnum", className)}
      {...props}
    >
      {prefix}
      {value !== undefined ? value : children}
      {suffix}
    </span>
  );
}

export interface FormatBytesProps extends React.HTMLAttributes<HTMLSpanElement> {
  bytes: number;
  decimals?: number;
}

/**
 * FormatBytes: Formats numeric bytes with guaranteed tabular figures.
 */
export function FormatBytes({
  bytes,
  decimals = 2,
  className,
  ...props
}: FormatBytesProps) {
  return (
    <span
      className={cn("tabular-nums font-feature-tnum inline-block", className)}
      {...props}
    >
      {formatBytesUtil(bytes, decimals)}
    </span>
  );
}

export interface SavingsPctProps extends React.HTMLAttributes<HTMLSpanElement> {
  original: number;
  optimized: number;
  prefix?: string;
}

/**
 * SavingsPct: Computes and renders percentage savings with tabular figures.
 */
export function SavingsPct({
  original,
  optimized,
  prefix = "-",
  className,
  ...props
}: SavingsPctProps) {
  return (
    <span
      className={cn("tabular-nums font-feature-tnum inline-block", className)}
      {...props}
    >
      {prefix}{calcSavingsUtil(original, optimized)}
    </span>
  );
}
```

---

## 5. Concrete Proposed Diffs by File

### 5.1 UI Primitives

#### `filefixer/src/components/ui/button.tsx`
```diff
--- a/filefixer/src/components/ui/button.tsx
+++ b/filefixer/src/components/ui/button.tsx
@@ -33,5 +33,5 @@ const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
 const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
-  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md",
-  sm: "h-8 px-3 text-xs gap-1.5",
-  md: "h-10 px-4 py-2 text-sm gap-2",
-  lg: "h-12 px-6 text-base gap-2",
-  icon: "h-9 w-9 p-0",
+  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
+  sm: "h-8 px-3 text-xs gap-1.5 relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
+  md: "h-11 sm:h-10 px-4 py-2 text-sm gap-2 touch-manipulation",
+  lg: "h-12 px-6 text-base gap-2 touch-manipulation",
+  icon: "h-11 w-11 sm:h-9 sm:w-9 p-0 relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-[''] sm:after:hidden",
 };
@@ -57,3 +57,3 @@ export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
         className={cn(
-          "inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-colors",
+          "inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-colors touch-manipulation",
           "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
```

#### `filefixer/src/components/ui/slider.tsx`
```diff
--- a/filefixer/src/components/ui/slider.tsx
+++ b/filefixer/src/components/ui/slider.tsx
@@ -11,3 +11,3 @@ const Slider = React.forwardRef<
     className={cn(
-      "relative flex w-full touch-none select-none items-center",
+      "relative flex w-full touch-none select-none items-center min-h-[44px] sm:min-h-0 py-2.5 sm:py-2",
       className
     )}
@@ -20,1 +20,1 @@ const Slider = React.forwardRef<
-    <SliderPrimitive.Thumb className="block h-6 w-6 sm:h-5 sm:w-5 rounded-full border-2 border-[hsl(var(--primary))] bg-[hsl(var(--background))] shadow-md transition-transform active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
+    <SliderPrimitive.Thumb className="relative block h-6 w-6 sm:h-5 sm:w-5 rounded-full border-2 border-[hsl(var(--primary))] bg-[hsl(var(--background))] shadow-md transition-transform active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:min-w-[44px] after:min-h-[44px] after:content-['']" />
```

#### `filefixer/src/components/ui/switch.tsx`
```diff
--- a/filefixer/src/components/ui/switch.tsx
+++ b/filefixer/src/components/ui/switch.tsx
@@ -10,3 +10,4 @@ const Switch = React.forwardRef<
     className={cn(
-      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
+      "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors touch-manipulation",
+      "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:w-full after:h-full after:content-['']",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]",
```

#### `filefixer/src/components/ui/checkbox.tsx`
```diff
--- a/filefixer/src/components/ui/checkbox.tsx
+++ b/filefixer/src/components/ui/checkbox.tsx
@@ -12,3 +12,4 @@ const Checkbox = React.forwardRef<
     className={cn(
-      "peer h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]",
+      "peer relative h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] touch-manipulation",
+      "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:content-['']",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
```

#### `filefixer/src/components/ui/select.tsx`
```diff
--- a/filefixer/src/components/ui/select.tsx
+++ b/filefixer/src/components/ui/select.tsx
@@ -16,3 +16,3 @@ const SelectTrigger = React.forwardRef<
     className={cn(
-      "flex h-10 w-full items-center justify-between rounded-[var(--radius)] border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm",
+      "flex min-h-[44px] sm:min-h-0 sm:h-10 h-11 w-full items-center justify-between rounded-[var(--radius)] border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-2 text-sm touch-manipulation",
       "placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
@@ -71,3 +71,3 @@ const SelectItem = React.forwardRef<
     className={cn(
-      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
+      "relative flex min-h-[44px] sm:min-h-[36px] w-full cursor-default select-none items-center rounded-sm py-2.5 sm:py-1.5 pl-8 pr-2 text-sm outline-none touch-manipulation",
       "focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--foreground))]",
```

#### `filefixer/src/components/ui/tabs.tsx`
```diff
--- a/filefixer/src/components/ui/tabs.tsx
+++ b/filefixer/src/components/ui/tabs.tsx
@@ -13,3 +13,3 @@ const TabsList = React.forwardRef<
     className={cn(
-      "inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))]",
+      "inline-flex min-h-[44px] sm:min-h-0 sm:h-10 h-11 items-center justify-center rounded-[var(--radius)] bg-[hsl(var(--muted))] p-1 text-[hsl(var(--muted-foreground))]",
       className
@@ -28,3 +28,3 @@ const TabsTrigger = React.forwardRef<
     className={cn(
-      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
+      "inline-flex min-h-[38px] sm:min-h-0 items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 sm:py-1.5 text-sm font-medium transition-all relative touch-manipulation after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:min-w-[44px] after:min-h-[44px] after:content-[''] sm:after:hidden",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
```

---

### 5.2 Application Shell & Modals

#### `filefixer/src/components/layout/Header.tsx`
```diff
--- a/filefixer/src/components/layout/Header.tsx
+++ b/filefixer/src/components/layout/Header.tsx
@@ -112,3 +112,3 @@ export function Header() {
           onClick={() => setCommandCenterOpen(true)}
-          className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:text-[hsl(var(--foreground))] transition-all shadow-xs"
+          className="flex min-h-[44px] sm:min-h-0 sm:py-1.5 py-2.5 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:text-[hsl(var(--foreground))] transition-all shadow-xs touch-manipulation"
           aria-label="Open Command Center (Ctrl+K)"
@@ -185,3 +185,3 @@ export function Header() {
             className={cn(
-              "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
+              "inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all touch-manipulation",
               fileCount > 0
@@ -221,3 +221,3 @@ export function Header() {
             onClick={() => setShortcutsOpen(true)}
-            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
+            className="hidden sm:flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors touch-manipulation"
             title="Keyboard Shortcuts (?)"
```

#### `filefixer/src/components/layout/ThemeToggle.tsx`
```diff
--- a/filefixer/src/components/layout/ThemeToggle.tsx
+++ b/filefixer/src/components/layout/ThemeToggle.tsx
@@ -58,3 +58,3 @@ export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
         size="icon"
-        className="h-9 w-9 opacity-50"
+        className="h-11 w-11 sm:h-9 sm:w-9 opacity-50"
         aria-label="Toggle theme"
@@ -87,3 +87,3 @@ export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
       size={showLabel ? "sm" : "icon"}
       onClick={cycleTheme}
-      className="h-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 px-2.5"
+      className="h-11 w-11 sm:h-9 sm:w-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 px-2.5 touch-manipulation"
       title={`Theme: ${label} (Click to switch)`}
```

#### `filefixer/src/components/support/SupportModal.tsx`
```diff
--- a/filefixer/src/components/support/SupportModal.tsx
+++ b/filefixer/src/components/support/SupportModal.tsx
@@ -56,3 +56,3 @@ export function SupportModal() {
           onClick={closeSupportModal}
-          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
+          className="absolute top-4 right-4 flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation"
           aria-label="Close support dialog"
```

#### `filefixer/src/components/download/FileDeliveredModal.tsx`
```diff
--- a/filefixer/src/components/download/FileDeliveredModal.tsx
+++ b/filefixer/src/components/download/FileDeliveredModal.tsx
@@ -66,3 +66,3 @@ export function FileDeliveredModal() {
           onClick={() => setLatestDeliveredFile(null)}
-          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
+          className="absolute top-4 right-4 flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation"
           aria-label="Close delivery modal"
@@ -93,3 +93,3 @@ export function FileDeliveredModal() {
         {/* Before / After Stats Card */}
-        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] p-3 text-center">
+        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] p-3 text-center tabular-nums">
           <div className="space-y-0.5">
@@ -99,3 +99,3 @@ export function FileDeliveredModal() {
             <p className="text-xs font-bold text-[hsl(var(--foreground))]">
-              {formatBytes(latestDeliveredFile.originalSize)}
+              <span className="tabular-nums">{formatBytes(latestDeliveredFile.originalSize)}</span>
             </p>
@@ -108,3 +108,3 @@ export function FileDeliveredModal() {
             <p className="text-xs font-bold text-emerald-400">
-              {formatBytes(latestDeliveredFile.outputSize)}
+              <span className="tabular-nums">{formatBytes(latestDeliveredFile.outputSize)}</span>
             </p>
@@ -117,3 +117,3 @@ export function FileDeliveredModal() {
             <p className="text-xs font-bold text-[hsl(var(--primary))]">
-              {savingsPct && savingsPct > 0 ? `-${savingsPct.toFixed(0)}%` : "Optimized"}
+              <span className="tabular-nums">{savingsPct && savingsPct > 0 ? `-${savingsPct.toFixed(0)}%` : "Optimized"}</span>
             </p>
```

#### `filefixer/src/components/download/DownloadDock.tsx`
```diff
--- a/filefixer/src/components/download/DownloadDock.tsx
+++ b/filefixer/src/components/download/DownloadDock.tsx
@@ -62,3 +62,3 @@ export function DownloadDock() {
               onClick={() => setDownloadCenterOpen(true)}
-              className="text-[11px] font-medium text-[hsl(var(--primary))] hover:underline px-2 py-1"
+              className="min-h-[44px] flex items-center text-[11px] font-medium text-[hsl(var(--primary))] hover:underline px-2"
             >
@@ -68,3 +68,3 @@ export function DownloadDock() {
               onClick={() => setIsMinimized(!isMinimized)}
-              className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
+              className="flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] touch-manipulation"
               aria-label={isMinimized ? "Expand dock" : "Minimize dock"}
@@ -75,3 +75,3 @@ export function DownloadDock() {
               onClick={clearDownloads}
-              className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
+              className="flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] touch-manipulation"
               aria-label="Clear download dock"
@@ -113,3 +113,3 @@ export function DownloadDock() {
                       </p>
-                      <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
-                        <span>{formatBytes(item.outputSize || item.originalSize)}</span>
+                      <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] tabular-nums">
+                        <span className="tabular-nums">{formatBytes(item.outputSize || item.originalSize)}</span>
                         {item.savingsPct !== undefined && item.savingsPct > 0 && (
-                          <span className="text-emerald-500 font-medium">
+                          <span className="text-emerald-500 font-medium tabular-nums">
                             (-{item.savingsPct.toFixed(0)}%)
@@ -133,3 +133,3 @@ export function DownloadDock() {
                         title="Re-download file"
-                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
+                        className="flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors touch-manipulation"
                       >
@@ -140,3 +140,3 @@ export function DownloadDock() {
                       onClick={() => removeDownload(item.id)}
-                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
+                      className="flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] touch-manipulation"
                       aria-label="Dismiss item"
```

#### `filefixer/src/components/download/DownloadCenterModal.tsx`
```diff
--- a/filefixer/src/components/download/DownloadCenterModal.tsx
+++ b/filefixer/src/components/download/DownloadCenterModal.tsx
@@ -74,3 +74,3 @@ export function DownloadCenterModal() {
             onClick={() => setDownloadCenterOpen(false)}
-            className="flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
+            className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] touch-manipulation"
             aria-label="Close download center"
@@ -83,3 +83,3 @@ export function DownloadCenterModal() {
         {validFiles.length > 0 && (
-          <div className="grid grid-cols-3 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] p-4 text-center">
+          <div className="grid grid-cols-3 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] p-4 text-center tabular-nums">
             <div className="space-y-0.5">
@@ -88,3 +88,3 @@ export function DownloadCenterModal() {
               </span>
-              <p className="text-xs font-bold">{formatBytes(totalOriginalSize)}</p>
+              <p className="text-xs font-bold tabular-nums">{formatBytes(totalOriginalSize)}</p>
             </div>
@@ -95,3 +95,3 @@ export function DownloadCenterModal() {
               </span>
-              <p className="text-xs font-bold text-emerald-400">
+              <p className="text-xs font-bold text-emerald-400 tabular-nums">
                 {formatBytes(totalOutputSize)}
@@ -103,3 +103,3 @@ export function DownloadCenterModal() {
               </span>
-              <p className="text-xs font-bold text-[hsl(var(--primary))]">
+              <p className="text-xs font-bold text-[hsl(var(--primary))] tabular-nums">
                 {formatBytes(totalSaved)} ({totalSavedPct.toFixed(0)}%)
@@ -129,3 +129,3 @@ export function DownloadCenterModal() {
                   </p>
-                  <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
+                  <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 tabular-nums">
                     <span>{formatBytes(file.outputSize)}</span>
@@ -149,3 +149,3 @@ export function DownloadCenterModal() {
                       }}
-                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
+                      className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors touch-manipulation"
                       title="Download file"
@@ -157,3 +157,3 @@ export function DownloadCenterModal() {
                     onClick={() => removeDownload(file.id)}
-                    className="flex h-9 w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
+                    className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] touch-manipulation"
                     aria-label="Remove from list"
```

#### `filefixer/src/components/upload/FileCard.tsx`
```diff
--- a/filefixer/src/components/upload/FileCard.tsx
+++ b/filefixer/src/components/upload/FileCard.tsx
@@ -104,3 +104,3 @@ export function FileCard({
         </p>
-        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
+        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 tabular-nums">
           <Badge variant="outline" className="text-[10px] px-1.5 py-0">
@@ -166,3 +166,3 @@ export function FileCard({
             onClick={() => onRemove(file.id)}
-            className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] opacity-100 sm:opacity-70 transition-all hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] sm:group-hover:opacity-100 focus-visible:opacity-100"
+            className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] opacity-100 sm:opacity-70 transition-all hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] sm:group-hover:opacity-100 focus-visible:opacity-100 touch-manipulation"
             aria-label={`Remove ${file.name}`}
```

---

### 5.3 Workspaces, Drawers & Results

#### `filefixer/src/components/workspace/WorkspaceDrawer.tsx`
```diff
--- a/filefixer/src/components/workspace/WorkspaceDrawer.tsx
+++ b/filefixer/src/components/workspace/WorkspaceDrawer.tsx
@@ -141,3 +141,3 @@ export function WorkspaceDrawer() {
         {totalCount > 0 && (
-          <div className="grid grid-cols-4 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-center">
+          <div className="grid grid-cols-4 gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-center tabular-nums">
             <div className="rounded-lg bg-[hsl(var(--secondary)/0.6)] px-2 py-1.5">
@@ -340,3 +340,3 @@ export function WorkspaceDrawer() {
                         </p>
-                        <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
+                        <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mt-0.5 tabular-nums">
                           <span>{formatBytes(item.size)}</span>
```

#### `filefixer/src/components/workspace/WorkspaceView.tsx`
```diff
--- a/filefixer/src/components/workspace/WorkspaceView.tsx
+++ b/filefixer/src/components/workspace/WorkspaceView.tsx
@@ -529,3 +529,3 @@ export function WorkspaceView() {
                 </span>
-                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
+                <Badge variant="outline" className="text-[10px] font-mono shrink-0 tabular-nums">
                   {formatBytes(activeFile.size)}
@@ -533,3 +533,3 @@ export function WorkspaceView() {
                 {activeFile.width && activeFile.height && (
-                  <Badge variant="secondary" className="text-[10px] font-mono shrink-0 hidden sm:inline-flex">
+                  <Badge variant="secondary" className="text-[10px] font-mono shrink-0 hidden sm:inline-flex tabular-nums">
                     {activeFile.width}×{activeFile.height}
@@ -573,3 +573,3 @@ export function WorkspaceView() {
             </button>
-            <span className="text-[11px] font-mono font-semibold w-10 text-center">
+            <span className="text-[11px] font-mono font-semibold w-10 text-center tabular-nums">
               {Math.round(zoomLevel * 100)}%
```

#### `filefixer/src/components/workflows/WorkflowBuilder.tsx`
```diff
--- a/filefixer/src/components/workflows/WorkflowBuilder.tsx
+++ b/filefixer/src/components/workflows/WorkflowBuilder.tsx
@@ -492,3 +492,3 @@ export function WorkflowBuilder() {
             <p className="text-xs text-[hsl(var(--muted-foreground))]">
               {workflowFiles.length > 0
-                ? `${formatBytes(totalInputSize)} total input weight`
+                ? <span className="tabular-nums">{formatBytes(totalInputSize)} total input weight</span>
                 : "Select images to run through this workflow"}
@@ -523,3 +523,3 @@ export function WorkflowBuilder() {
             <div className="flex items-center justify-center gap-2 text-sm font-bold text-[hsl(var(--primary))]">
               <Loader2 className="h-4 w-4 animate-spin" />
-              Processing File {currentFileIdx + 1} of {workflowFiles.length}...
+              <span className="tabular-nums">Processing File {currentFileIdx + 1} of {workflowFiles.length}...</span>
             </div>
@@ -542,3 +542,3 @@ export function WorkflowBuilder() {
               </div>
-              <Badge variant="outline" className="text-xs text-emerald-400 font-mono">
+              <Badge variant="outline" className="text-xs text-emerald-400 font-mono tabular-nums">
                 Saved {formatBytes(totalSaved)} ({savedPct.toFixed(0)}%)
```

---

### 5.4 Tool Workstations (Batch, Smart Compress, Image & PDF Tools)

#### `filefixer/src/app/batch/page.tsx`
```diff
--- a/filefixer/src/app/batch/page.tsx
+++ b/filefixer/src/app/batch/page.tsx
@@ -318,3 +318,3 @@ export default function BatchPage() {
                   </span>
-                  <p className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mt-0.5 truncate">
+                  <p className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mt-0.5 truncate tabular-nums">
                     {formatBytes(totalOriginal)}
@@ -326,3 +326,3 @@ export default function BatchPage() {
                   </span>
-                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 truncate">
+                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 truncate tabular-nums">
                     {completedCount > 0 ? formatBytes(totalOutput) : "—"}
@@ -334,3 +334,3 @@ export default function BatchPage() {
                   </span>
-                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
+                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">
                     {completedCount > 0
@@ -351,3 +351,3 @@ export default function BatchPage() {
                     </span>
-                    <span className="font-mono font-bold text-[hsl(var(--primary))]">
+                    <span className="font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                       {progressPct}%
```

#### `filefixer/src/app/smart-compress/page.tsx`
```diff
--- a/filefixer/src/app/smart-compress/page.tsx
+++ b/filefixer/src/app/smart-compress/page.tsx
@@ -254,3 +254,3 @@ export default function SmartCompressPage() {
                     </h3>
-                    <Badge variant="outline" className="font-mono text-xs">
+                    <Badge variant="outline" className="font-mono text-xs tabular-nums">
                       Goal: &lt; {targetFormatted} (
@@ -266,3 +266,3 @@ export default function SmartCompressPage() {
                       </span>
-                      <span className="font-mono font-bold text-[hsl(var(--foreground))]">
+                      <span className="font-mono font-bold text-[hsl(var(--foreground))] tabular-nums">
                         {formatBytes(selectedFile.size)}
@@ -294,3 +294,3 @@ export default function SmartCompressPage() {
                         <div className="flex items-center gap-2.5 shrink-0">
-                          <span className="font-mono font-bold">
+                          <span className="font-mono font-bold tabular-nums">
                             {formatBytes(attempt.sizeBytes)}
```

#### `filefixer/src/app/compress-image/page.tsx`
```diff
--- a/filefixer/src/app/compress-image/page.tsx
+++ b/filefixer/src/app/compress-image/page.tsx
@@ -293,3 +293,3 @@ export default function CompressImagePage() {
                   </span>
-                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))]">
+                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))] tabular-nums">
                     {qualityPct}%
```

#### `filefixer/src/app/convert-image/page.tsx`
```diff
--- a/filefixer/src/app/convert-image/page.tsx
+++ b/filefixer/src/app/convert-image/page.tsx
@@ -222,3 +222,3 @@ export default function ConvertImagePage() {
                   <span className="text-xs font-medium text-[hsl(var(--foreground))]">Export Quality</span>
-                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))]">{qualityPct}%</span>
+                  <span className="text-xs font-mono font-bold text-[hsl(var(--primary))] tabular-nums">{qualityPct}%</span>
                 </div>
```

#### `filefixer/src/app/resize-image/page.tsx`
```diff
--- a/filefixer/src/app/resize-image/page.tsx
+++ b/filefixer/src/app/resize-image/page.tsx
@@ -250,3 +250,3 @@ export default function ResizeImagePage() {
                   <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{p.label}</span>
-                  <span className="text-[11px] font-mono mt-0.5 text-[hsl(var(--primary))]">
+                  <span className="text-[11px] font-mono mt-0.5 text-[hsl(var(--primary))] tabular-nums">
                     {p.width} × {p.height} px
@@ -316,3 +316,3 @@ export default function ResizeImagePage() {
                     onClick={() => handlePercentageScale(pct)}
-                    className="rounded bg-[hsl(var(--secondary))] px-2 py-1 text-xs font-mono text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.7)]"
+                    className="min-h-[44px] sm:min-h-0 sm:py-1 py-2.5 rounded bg-[hsl(var(--secondary))] px-2 text-xs font-mono text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.7)] tabular-nums touch-manipulation"
                   >
```

#### `filefixer/src/app/pdf-compress/page.tsx`
```diff
--- a/filefixer/src/app/pdf-compress/page.tsx
+++ b/filefixer/src/app/pdf-compress/page.tsx
@@ -233,3 +233,3 @@ export default function PdfCompressPage() {
                       </p>
-                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
+                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 tabular-nums">
                         {formatBytes(result.originalSize)} →{" "}
```

#### `filefixer/src/app/pdf-merge/page.tsx`
```diff
--- a/filefixer/src/app/pdf-merge/page.tsx
+++ b/filefixer/src/app/pdf-merge/page.tsx
@@ -262,3 +262,3 @@ export default function PdfMergePage() {
                 </p>
-                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
+                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 tabular-nums">
                   Total {mergedStats.count} pages · {formatBytes(mergedStats.size)}
```

#### `filefixer/src/app/inspect/page.tsx`
```diff
--- a/filefixer/src/app/inspect/page.tsx
+++ b/filefixer/src/app/inspect/page.tsx
@@ -117,3 +117,3 @@ export default function InspectPage() {
                     <span className="text-[hsl(var(--muted-foreground))]">File Size</span>
-                    <span className="font-mono text-[hsl(var(--foreground))]">{metadata.sizeFormatted} ({metadata.size.toLocaleString()} bytes)</span>
+                    <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">{metadata.sizeFormatted} ({metadata.size.toLocaleString()} bytes)</span>
                   </div>
@@ -141,3 +141,3 @@ export default function InspectPage() {
                       <span className="text-[hsl(var(--muted-foreground))]">Resolution</span>
-                      <span className="font-mono text-[hsl(var(--foreground))]">
+                      <span className="font-mono text-[hsl(var(--foreground))] tabular-nums">
                         {metadata.imageWidth ? `${metadata.imageWidth} × ${metadata.imageHeight} px` : "Unavailable"}
```

#### `filefixer/src/app/page.tsx`
```diff
--- a/filefixer/src/app/page.tsx
+++ b/filefixer/src/app/page.tsx
@@ -393,3 +393,3 @@ export default function HomePage() {
                         </h2>
-                        <Badge variant="default" className="text-[11px]">
+                        <Badge variant="default" className="text-[11px] tabular-nums">
                           {files.length} {files.length === 1 ? "file" : "files"} •{" "}
```

---

## 6. Verification & Quality Validation Method

### 6.1 Independent Automated Verification
To independently verify the implementation, the developer or test agent should execute:

1. **Compilation & Static Typing**:
   ```bash
   npm run build --prefix filefixer
   ```
   *Expected outcome*: Exit code 0, 0 TypeScript errors, 33/33 static pages generated.

2. **Mobile Touch Target Verification (Playwright / DOM Inspection)**:
   Evaluate all interactive elements on a mobile viewport (375×667 viewport, e.g. iPhone SE emulation):
   ```ts
   // Bounding box assertion for interactive targets:
   const interactiveElements = await page.locator("button, [role='slider'], [role='switch'], [role='checkbox'], a").all();
   for (const el of interactiveElements) {
     if (await el.isVisible()) {
       const box = await el.boundingBox();
       if (box) {
         // Either visual bounding box >= 44x44 or computed touch hit area via pseudo-element >= 44x44
         const height = box.height;
         const width = box.width;
         // Verify compliance
       }
     }
   }
   ```

3. **Cumulative Layout Shift (CLS) Verification**:
   - In Chrome DevTools Performance panel, record an active run of `smart-compress` and `batch` while processing files.
   - Verify CLS remains `< 0.01` (well below Google's 0.1 threshold) during real-time digit updates.
   - Inspect computed styles on all formatted numbers to confirm `font-variant-numeric: tabular-nums` is active.
