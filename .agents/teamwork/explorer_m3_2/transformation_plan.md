# Technical Transformation Plan: Milestone 3 Image Workstations
**Role**: Explorer 2 (`explorer_m3_2`)  
**Target Focus**: Image Transformation & Conversion Workstations  
**Scope**: `/resize-image`, `/convert-image`, `/crop-image`  
**Working Directory**: `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m3_2`  
**Parent Orchestrator ID**: `eb7c7517-1271-47fc-acd9-e4891655cf74`  
**Date**: October 2026  

---

## 1. Executive Summary & Architectural Invariants

The FileFixer application requires purpose-built workstations for image manipulation and conversion (Requirement R2 / Milestone 3). This plan provides the complete technical specification for upgrading three core transformation pages:
1. **`/resize-image`**: Precision dimension controls, aspect-ratio lock, percentage scaling, aspect presets (16:9, 4:3, 1:1, 9:16), social size templates, and a high-clarity live dimension inspector with universal `.tabular-nums`.
2. **`/convert-image`**: Single and batch format conversion between JPG, PNG, and WebP, format-specific quality dials, background color compositing for JPG, alpha transparency preservation for PNG/WebP, live transparency detection, and queue management.
3. **`/crop-image`**: Interactive canvas crop box (`react-image-crop`), aspect presets (1:1, 4:3, 16:9, Free), lossless 90° rotation and horizontal/vertical flips with synchronized pixel coordinates, live crop area inspector with `.tabular-nums`, and original format preservation.

### Universal Constraints & Non-Negotiable Invariants
- **Zero Server Uploads**: 100% client-side processing using HTML5 Canvas (`toBlob`), Web Workers, and browser memory. Zero egress network requests.
- **Universal Tabular Numerals**: Every pixel dimension, aspect ratio, percentage, megapixel metric, and file size must carry `.tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent layout shifts.
- **Touch Target Accessibility**: Every interactive control (buttons, toggles, chips, sliders, inputs, color pickers) must enforce a touch target $\ge 44\times 44\text{px}$ on mobile viewports (`min-h-[44px]`, `min-w-[44px]`, or `h-11`).
- **WCAG AA Contrast ($\ge 4.5:1$)**: Light mode (`#F7F9FC`) and dark mode (`#0B1020`) themes must be strictly maintained. Crucially, hardcoded `text-white` on `bg-[hsl(var(--success))]` must be replaced with `text-[hsl(var(--success-foreground))]` because in dark mode, `--success` is bright green (`#22C55E`), where white text fails contrast (~1.8:1) while dark slate (`#0F172A`) achieves 7.83:1 contrast.
- **Delivery Dock & Telemetry Integration**: Completed outputs must be registered in the global `useFileStore.getState().pushDownload(...)`, trigger the celebratory delivered state, and invoke `triggerSupportPrompt()` after 1200ms without blocking user actions.

---

## 2. Workstation 1: `/resize-image` Deep Architecture

### 2.1 Current State & Identified Deficiencies
- **File**: `filefixer/src/app/resize-image/page.tsx` (414 lines) & `filefixer/src/lib/image/resize.ts` (112 lines).
- **Gaps**:
  1. *Missing Aspect Presets*: Only includes social media presets (`RESIZE_PRESETS`). Does not have direct preset aspect modes (`16:9`, `4:3`, `1:1`, `9:16`, `Custom`).
  2. *Missing Live Dimension Inspector*: There is no real-time inspection card before processing; only `BeforeAfterStats` appears after processing. Users cannot see live aspect ratios, megapixels, or scaling deltas while adjusting numbers.
  3. *Small Touch Targets*: Percentage buttons (`[25, 50, 75, 150, 200]`) and aspect lock toggle are small (`px-2 py-1` and `p-2`), violating the $\ge 44\text{px}$ touch target requirement.
  4. *Contrast Defect*: Lines 384 and 401 use `text-white` on `bg-[hsl(var(--success))]`, failing dark mode WCAG AA contrast.
  5. *Delivery Dock Disconnect*: Single and batch downloads trigger raw anchor clicks without dispatching to `pushDownload` or invoking `triggerSupportPrompt()`.

### 2.2 Target Specification & UI State

```typescript
// Component State Interface
interface ResizeState {
  width: number;
  height: number;
  lockAspect: boolean;
  aspectRatio: number; // width / height
  activeAspectPreset: "custom" | "16:9" | "4:3" | "1:1" | "9:16";
  percentage: number;
  fitMode: "stretch" | "cover" | "contain";
  originalDimensions: { width: number; height: number } | null;
  isProcessing: boolean;
}
```

### 2.3 Feature Breakdown & Implementation Details

#### 1. Dimension Inputs & Aspect-Ratio Lock
- **Inputs**: High-precision `number` inputs with `min={1}` and `max={10000}`. Wrapped in focus rings with `.tabular-nums`.
- **Aspect Lock Toggle**:
  - Touch target: `h-11 w-11` (or `min-h-[44px] min-w-[44px]`).
  - ARIA: `aria-label={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}`.
  - When locked:
    - Width change: `setHeight(Math.round(val / aspectRatio))`.
    - Height change: `setWidth(Math.round(val * aspectRatio))`.
  - When unlocked: changes apply independently and set `activeAspectPreset = "custom"`.

#### 2. Preset Aspect Modes (16:9, 4:3, 1:1, 9:16, Free)
- A dedicated segmented control / chip row:
  - `Free / Custom` (unlocks aspect lock or preserves custom ratio)
  - `16:9` (Widescreen): ratio = `16 / 9` ($\approx 1.7778$)
  - `4:3` (Standard Photo): ratio = `4 / 3` ($\approx 1.3333$)
  - `1:1` (Square): ratio = `1.0`
  - `9:16` (Story / Reel): ratio = `9 / 16` ($\approx 0.5625$)
- **Preset Selection Algorithm**:
  ```typescript
  const handleSelectAspectPreset = (preset: "custom" | "16:9" | "4:3" | "1:1" | "9:16") => {
    setActiveAspectPreset(preset);
    if (preset === "custom") {
      setLockAspect(false);
      return;
    }
    const ratios: Record<string, number> = {
      "16:9": 16 / 9,
      "4:3": 4 / 3,
      "1:1": 1,
      "9:16": 9 / 16,
    };
    const targetRatio = ratios[preset];
    setAspectRatio(targetRatio);
    setLockAspect(true);
    // Recalculate height based on current width (or natural image width if available)
    setHeight(Math.round(width / targetRatio));
  };
  ```

#### 3. Percentage Scaling Slider & Quick Chips
- **Chips**: `[25%, 50%, 75%, 100%, 150%, 200%]`. Each chip has `min-h-[44px]` touch target, `font-mono tabular-nums`.
- **Slider**: Range `10%` to `300%`, step `5%`. When adjusted, scales from initial baseline dimensions:
  `targetWidth = Math.round((baseWidth * pct) / 100)`  
  `targetHeight = Math.round((baseHeight * pct) / 100)`

#### 4. High-Clarity Live Dimension Inspector
A dedicated inspector card placed directly beneath or beside the dimensions form:
```tsx
<div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
  <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Live Dimension Inspector</span>
    <span className="text-[11px] font-mono tabular-nums text-[hsl(var(--primary))] font-medium">
      {fitMode.toUpperCase()}
    </span>
  </div>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Original</div>
      <div className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
        {origW ? `${origW} × ${origH}` : "—"}
      </div>
    </div>
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Target</div>
      <div className="text-sm font-bold text-[hsl(var(--primary))] tabular-nums">
        {width} × {height}
      </div>
    </div>
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Aspect Ratio</div>
      <div className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
        {(width / height).toFixed(2)}:1
      </div>
    </div>
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Resolution Delta</div>
      <div className={`text-sm font-bold tabular-nums ${scaleDelta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
        {origW ? `${scaleDelta > 0 ? "+" : ""}${scaleDelta}%` : "—"}
      </div>
    </div>
  </div>
  <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] pt-1">
    <span>Megapixels: <strong className="text-[hsl(var(--foreground))] tabular-nums">{((width * height) / 1000000).toFixed(2)} MP</strong></span>
    <span>Mode: <strong className="text-[hsl(var(--foreground))] capitalize">{fitMode}</strong></span>
  </div>
</div>
```

#### 5. Delivery Dock & History Telemetry
- Upon completing resize (single or batch):
  ```typescript
  pushDownload({
    fileName: outputName,
    originalSize: f.size,
    outputSize: res.blob.size,
    savingsPct: f.size > res.blob.size ? ((f.size - res.blob.size) / f.size) * 100 : 0,
    status: "ready",
    blob: res.blob,
    tool: `Resize Image (${width}×${height})`,
  });
  triggerSupportPrompt();
  ```

---

## 3. Workstation 2: `/convert-image` Deep Architecture

### 3.1 Current State & Identified Deficiencies
- **File**: `filefixer/src/app/convert-image/page.tsx` (326 lines) & `filefixer/src/lib/image/convert.ts` (54 lines).
- **Gaps**:
  1. *Transparency Visibility*: Doesn't detect or communicate whether the uploaded file contains transparency (alpha channel). When converting to JPEG, users don't see an explicit warning that transparency is converted to a background color.
  2. *Quality Controls*: PNG shows nothing, leaving users unsure whether it's lossless or what settings are applied.
  3. *Tabular Numerals Missing*: Numeric quality percentages, byte counts, and queue items lack `.tabular-nums`.
  4. *Small Touch Targets*: Color input (`h-8 w-12`) is 32px height, below 44px. Format option buttons need explicit `min-h-[48px]`.
  5. *Contrast Defect*: Lines 295 and 313 hardcode `text-white` on `bg-[hsl(var(--success))]`.
  6. *Delivery Dock Disconnect*: Does not dispatch to `pushDownload` or trigger `triggerSupportPrompt()`.

### 3.2 Target Specification & Format Strategy

| Target Format | MIME Type | Lossy / Lossless | Alpha Transparency | Quality Control | Background Handling |
|---|---|---|---|---|---|
| **WebP** | `image/webp` | Lossy (or Lossless) | Preserved 100% | Slider (10% - 100%) | Transparent canvas untouched |
| **PNG** | `image/png` | Lossless (DEFLATE) | Preserved 100% | Static Lossless Badge | Transparent canvas untouched |
| **JPG / JPEG** | `image/jpeg` | Lossy (DCT) | Not Supported | Slider (10% - 100%) | Composited with chosen background color (default `#FFFFFF`) |

### 3.3 Feature Breakdown & Implementation Details

#### 1. Alpha Transparency Detection & Status Card
- Read image or MIME type: `file.type === "image/png" || file.type === "image/webp"`.
- Real-time probe: Can draw to a 10×10 canvas or check MIME to inspect alpha channel.
- Display a dynamic Transparency State Banner:
  - If target is **WebP** or **PNG**:
    ```tsx
    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>Full Alpha Transparency preserved automatically in {targetFormat === "image/webp" ? "WebP" : "PNG"}.</span>
    </div>
    ```
  - If target is **JPG** and source has transparency:
    ```tsx
    <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>JPG does not support transparency. Alpha pixels will be composited onto the background color below.</span>
    </div>
    ```

#### 2. Format Selection & Touch Targets
- Format Selector options:
  - `WebP (Modern Web)`: `.webp` — High efficiency, 30% smaller, supports transparency.
  - `PNG (Lossless)`: `.png` — Pixel-perfect graphics, logos, screenshots.
  - `JPG / JPEG (Universal)`: `.jpg` — Universal device compatibility.
- Ensure each button has `min-h-[48px]` touch target, border highlight, and clear radio bullet indicator.

#### 3. Background Color Compositing Controls (for JPG)
- Preset swatches with $\ge 44\text{px}$ touch targets:
  - Pure White (`#FFFFFF`)
  - Deep Black (`#000000`)
  - Soft Light Slate (`#F1F5F9`)
  - Midnight Dark (`#0B1020`)
- Custom color input wrapped in an accessible container with `min-h-[44px]` and tabular hex code display.

#### 4. Delivery Dock & Batch Queue Integration
- Track per-file status: `idle` $\rightarrow$ `processing` $\rightarrow$ `done` | `error`.
- For single file: Display `BeforeAfterStats` comparing original vs. converted size and format.
- For batch: Call `pushDownload` for every converted file, update `downloadQueue`, set `latestDeliveredFile`, and display ZIP download button.
- Trigger `triggerSupportPrompt()`.

---

## 4. Workstation 3: `/crop-image` Deep Architecture

### 4.1 Current State & Identified Deficiencies
- **File**: `filefixer/src/app/crop-image/page.tsx` (255 lines) & `filefixer/src/lib/image/transform.ts` (99 lines).
- **Gaps**:
  1. *Missing Aspect Presets*: Requirement calls for `1:1, 4:3, 16:9, Free`. Currently the page has zero aspect presets!
  2. *Coordinate Misalignment Bug*: Rotation (`rotation`) and flips (`flipH`, `flipV`) are currently applied via CSS `style={{ transform: rotate(...) }}` on the `<img>` element. Because `<ReactCrop>` computes drag coordinates relative to the unrotated DOM bounding rect, dragging the crop handles on a rotated image results in inverted, skewed, or offset crops!
  3. *Missing Crop Dimension Inspector*: There is no live indicator of crop dimensions ($W \times H\text{ px}$), aspect ratio, or percentage of image retained.
  4. *Hardcoded File Extension*: Line 107 exports as `${baseName}_edited.jpg`, forcibly converting PNGs with transparency into JPEGs with black backgrounds.
  5. *Small Touch Targets*: Toolbar buttons (`size="sm"`, 32px height) fail the $\ge 44\text{px}$ touch target requirement.
  6. *Contrast Defect*: Line 210 hardcodes `text-white` on `bg-[hsl(var(--success))]`.
  7. *Delivery Dock Disconnect*: Does not call `pushDownload` or `triggerSupportPrompt()`.

### 4.2 Pixel-Synchronized Transformation Architecture
To eliminate the coordinate mismatch bug entirely:
1. **Working Canvas Pattern**:
   - Rather than applying CSS rotation to the `<img>` element inside `<ReactCrop>`, any orientation transformation (90° CW, 90° CCW, Flip H, Flip V) immediately creates a transformed canvas bitmap.
   - The transformed bitmap is rendered to an object URL and becomes the new display image.
   - `<ReactCrop>` therefore always operates on a visually true $0^\circ$ coordinate space!
   - Every handle drag, aspect ratio constraint, and pixel calculation aligns 1:1 with `image.naturalWidth` and `image.naturalHeight`.
2. **Crop Presets with `centerCrop` & `makeAspectCrop`**:
   - When an aspect preset is selected:
     ```typescript
     import { centerCrop, makeAspectCrop, convertToPixelCrop } from "react-image-crop";

     const handleAspectChange = (newAspect: number | undefined, presetKey: "free" | "1:1" | "4:3" | "16:9") => {
       setActivePreset(presetKey);
       setAspect(newAspect);
       if (imgRef.current && newAspect) {
         const { width, height } = imgRef.current;
         const centered = centerCrop(
           makeAspectCrop({ unit: "%", width: 90 }, newAspect, width, height),
           width,
           height
         );
         setCrop(centered);
         setCompletedCrop(convertToPixelCrop(centered, width, height));
       }
     };
     ```

### 4.3 Target UI State & Controls

```typescript
interface CropWorkstationState {
  originalFile: File | null;
  currentBlobUrl: string | null;
  currentDimensions: { width: number; height: number };
  crop: Crop | undefined;
  completedCrop: PixelCrop | null;
  aspect: number | undefined;
  activePreset: "free" | "1:1" | "4:3" | "16:9";
  rotationHistory: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  isProcessing: boolean;
}
```

### 4.4 Feature Breakdown & Implementation Details

#### 1. Aspect Preset Selector Bar
- Segmentation:
  - `Free` (`aspect = undefined`): Unconstrained arbitrary rectangle.
  - `1:1 (Square)` (`aspect = 1`): Square avatar, Instagram.
  - `4:3 (Standard)` (`aspect = 4 / 3`): Classic photographic frame.
  - `16:9 (Widescreen)` (`aspect = 16 / 9`): HD video thumbnails and banners.
- Each preset button is styled with `min-h-[44px]` touch target and active primary indicator.

#### 2. Synchronized Action Toolbar
- Controls with $\ge 44\text{px}$ touch targets:
  - `Rotate 90° CCW`: Counter-clockwise 90° rotation.
  - `Rotate 90° CW`: Clockwise 90° rotation.
  - `Flip Horizontal`: Mirrors image along Y-axis.
  - `Flip Vertical`: Mirrors image along X-axis.
  - `Reset All`: Restores original unedited image and clears crop boundaries.

#### 3. Live Crop Dimension Inspector
Rendered beneath the canvas workspace:
```tsx
<div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
  <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2 mb-3">
    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Crop Inspector</span>
    <span className="text-[11px] font-mono tabular-nums text-[hsl(var(--primary))] font-medium">
      Preset: {activePreset.toUpperCase()}
    </span>
  </div>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Crop Dimensions</div>
      <div className="text-sm font-bold text-[hsl(var(--primary))] tabular-nums">
        {completedCrop ? `${Math.round(actualCropW)} × ${Math.round(actualCropH)}` : `${imgW} × ${imgH}`} px
      </div>
    </div>
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Source Dimensions</div>
      <div className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
        {imgW} × {imgH} px
      </div>
    </div>
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Aspect Ratio</div>
      <div className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
        {completedCrop && actualCropH > 0 ? `${(actualCropW / actualCropH).toFixed(2)}:1` : `${(imgW / imgH).toFixed(2)}:1`}
      </div>
    </div>
    <div className="rounded-lg bg-[hsl(var(--secondary))] p-2.5">
      <div className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Area Coverage</div>
      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
        {completedCrop ? `${Math.round((actualCropW * actualCropH) / (imgW * imgH) * 100)}%` : "100%"}
      </div>
    </div>
  </div>
</div>
```

#### 4. Safe Export & Extension Preservation
- Retain the original file's format and transparency:
  ```typescript
  const ext = getExtension(selectedFile.name) || "jpg";
  const mime = selectedFile.type || "image/jpeg";
  const outputName = `${baseName}_cropped.${ext}`;
  ```
- Export blob using `transformImage` (or direct canvas export of the cropped pixel region).
- Push to download dock via `pushDownload` and trigger support prompt.

---

## 5. Ergonomics, Contrast & Design System Compliance

### 5.1 Universal `.tabular-nums` Audit Matrix

| Metric Type | Location in Workstation | Implementation Requirement |
|---|---|---|
| Pixel Dimensions ($W \times H$) | Dimension inputs, inspector cards, file cards | Apply `.tabular-nums font-mono` to prevent CLS |
| Aspect Ratios (e.g. `1.78:1`) | Live inspector badge, preset tags | Format to 2 decimal places with `.tabular-nums` |
| Scale Percentages (e.g. `75%`) | Scale chips, scale slider, delta badges | Wrap percentage values with `.tabular-nums` |
| File Sizes (e.g. `1.4 MB`) | FileCard, BeforeAfterStats, batch progress | Use `formatBytes()` enclosed in `.tabular-nums` |
| Megapixels (e.g. `8.30 MP`) | Live Dimension Inspector | Calculated with `(w * h / 1e6).toFixed(2)` + `.tabular-nums` |
| Rotation Angles (`90°`, `180°`) | Crop toolbar status badge | Wrap with `.tabular-nums` |

### 5.2 Mobile Touch Target Enforcement ($\ge 44\text{px}$)

```css
/* Sizing enforcement across all workstation controls */
.workstation-control-touch {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}
```
- **Inputs**: Number inputs use `h-11` (44px) on mobile and desktop.
- **Icon Buttons**: Lock toggle, rotate, flip, and clear buttons use `h-11 w-11` with accessible ARIA labels.
- **Preset Chips & Fit Mode**: Styled with `px-3 py-2.5 min-h-[44px]` touch targets.
- **Color Pickers**: Enclosed in a 44px container with clickable hex label.

### 5.3 Dark Mode WCAG AA Contrast Rule

#### The Defect
```tsx
// ❌ WRONG: Regresses contrast in dark mode (white text on emerald-500 = 1.8:1, FAILS WCAG AA)
<Button className="bg-[hsl(var(--success))] text-white">Download</Button>
```

#### The Compliant Solution
```tsx
// ✅ CORRECT: Calibrated semantic token (white in light mode, #0F172A in dark mode = 7.83:1, PASSES WCAG AA)
<Button className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-emerald-600 font-semibold min-h-[48px]">
  Download
</Button>
```

---

## 6. Implementation Phasing & Task Checklist

### Phase 1: `/resize-image` Upgrade
- [ ] Add aspect ratio preset state and selector (`Free`, `16:9`, `4:3`, `1:1`, `9:16`).
- [ ] Implement live dimension inspector displaying Original, Target, Aspect Ratio, Megapixels, and Resolution Delta with `.tabular-nums`.
- [ ] Enlarge aspect lock button and percentage chips to $\ge 44\text{px}$ touch targets.
- [ ] Replace `text-white` with `text-[hsl(var(--success-foreground))]` on success buttons.
- [ ] Wire `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.

### Phase 2: `/convert-image` Upgrade
- [ ] Implement alpha transparency detection and informative user banner.
- [ ] Upgrade format selector buttons with `min-h-[48px]` touch targets, format descriptions, and active highlights.
- [ ] Add quick color swatches (White, Black, Light Slate, Dark Slate) with $\ge 44\text{px}$ touch targets for JPG background compositing.
- [ ] Enforce `.tabular-nums` across quality dials, file sizes, and queue metrics.
- [ ] Replace `text-white` with `text-[hsl(var(--success-foreground))]` on download buttons.
- [ ] Wire `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.

### Phase 3: `/crop-image` Upgrade
- [ ] Refactor rotation and flip logic to apply canvas transformations directly onto the working image bitmap, guaranteeing 100% synchronized `<ReactCrop>` coordinates.
- [ ] Add aspect preset buttons (`Free`, `1:1`, `4:3`, `16:9`) utilizing `makeAspectCrop` and `centerCrop`.
- [ ] Add live crop dimension inspector displaying current crop size, source size, aspect ratio, and area coverage with `.tabular-nums`.
- [ ] Enforce $\ge 44\text{px}$ touch targets on all toolbar buttons.
- [ ] Preserve original file extension and MIME type upon export (no forced `.jpg`).
- [ ] Replace `text-white` with `text-[hsl(var(--success-foreground))]` on export buttons.
- [ ] Wire `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.

---

## 7. Verification Method & Acceptance Criteria

### 7.1 Automated Build & Test Gates
```bash
# 1. Run all unit, boundary, adversarial, and cross-feature tests
npm test

# 2. Verify complete static build and 33/33 route generation
npm run build --prefix filefixer

# 3. Verify zero TypeScript errors
npx tsc --noEmit
```

### 7.2 Manual & Adversarial Verification Checklist
1. **`/resize-image`**:
   - Upload a $4000 \times 3000\text{px}$ photo.
   - Click `16:9` preset. Verify height recalculates to $2250\text{px}$.
   - Toggle aspect lock off. Change width to $1920\text{px}$. Verify height remains $2250\text{px}$.
   - Verify live dimension inspector updates in real time with `.tabular-nums`.
   - Click `50%` scale chip. Verify dimensions update to $960 \times 1125\text{px}$.
   - Process image. Verify downloaded file appears in floating DownloadDock and support modal triggers after 1200ms.
2. **`/convert-image`**:
   - Upload a transparent PNG.
   - Select `WebP`. Verify transparency banner confirms full alpha preservation.
   - Select `JPG`. Verify warning appears indicating transparent areas will be filled, and background color picker activates.
   - Convert both single and batch files. Verify output filenames and sizes reflect selected format with `.tabular-nums`.
3. **`/crop-image`**:
   - Upload an image.
   - Click `Rotate 90° CW`. Verify image rotates cleanly.
   - Click `1:1` aspect preset. Verify crop box is centered as a perfect square.
   - Drag crop handles. Verify crop box maintains 1:1 ratio with zero coordinate drift or flipping.
   - Click Download. Verify exported image matches the visual crop area exactly without offset.
4. **Contrast & Ergonomics Audit**:
   - Inspect all buttons and inputs in both Light (`#F7F9FC`) and Dark (`#0B1020`) modes.
   - Verify all touch targets measure at least $44\times 44\text{px}$ on viewport widths $<640\text{px}$.
   - Verify zero network requests in the Network tab during any operation.
