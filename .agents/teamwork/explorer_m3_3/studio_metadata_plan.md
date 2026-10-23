# Implementation Plan: Purpose-Built Image Studio & Metadata Workstations (M3)

**Author:** Explorer 3 (`explorer_m3_3`)  
**Target Milestone:** Milestone 3 — Purpose-Built Image Workstations  
**Focus Routes:**  
- `/image-metadata` (`filefixer/src/app/image-metadata/page.tsx`)  
- `/image-studio` (`filefixer/src/app/image-studio/page.tsx`)  
- Associated metadata layout wrappers (`layout.tsx`)  
- Shared image engine modules (`src/lib/image/metadata.ts`, `src/lib/image/transform.ts`, etc.)

---

## 1. Executive Summary

Milestone 3 elevates FileFixer's image processing capabilities into purpose-built, high-density professional workstations. While Explorer 1 focuses on `/compress-image` & `/smart-compress`, and Explorer 2 focuses on `/resize-image`, `/convert-image`, & `/crop-image`, Explorer 3's domain covers the two unified, data-dense workstations:
1. **`/image-metadata`**: The privacy & camera diagnostics workstation. Provides deep sensor/optics inspection (Make, Model, Lens, ISO, Aperture, Focal Length, Exposure, Software, Megapixels), high-precision GPS coordinate detection & coordinate viewer with copy actions and privacy warnings, and single-click client-side EXIF/GPS elimination via Canvas re-rasterization.
2. **`/image-studio`**: The flagship all-in-one image workbench. Integrates cropping (interactive visual crop box with aspect presets), multi-format resizing, real-time CSS/Canvas color adjustments & filters (Brightness, Contrast, Saturation, B&W, Sepia, etc.), 90° orientation & flips, and quality compression into an ergonomic multi-tool workspace with compare sliders and zero cloud uploads.

---

## 2. Codebase Baseline & Gap Analysis

### 2.1 `/image-metadata` Baseline vs Requirements
- **Current State (`src/app/image-metadata/page.tsx`)**:
  - Contains a basic 2-column table displaying Make, Model, Software, Date, Exposure & ISO, Lens Model.
  - **Critical Gap 1 — GPS Location**: When GPS data is present, it only shows a badge `"GPS Location Attached"`. It fails to display the actual latitude, longitude, altitude, GPS timestamp, coordinate format (DMS / Decimal), copy button, or safe external map link (e.g. OpenStreetMap).
  - **Critical Gap 2 — Sensor & Camera Details**: Focal length (`focalLength`) is extracted by `exifr` in `metadata.ts` but omitted from the UI table! Dimensions, Megapixels (MP), and aspect ratios are missing.
  - **Critical Gap 3 — Exposure Time Edge Case**: In `src/lib/image/metadata.ts`: `exposureTime ? '1/' + Math.round(1 / exposureTime) + 's'` causes broken formatting (`1/0s` or `1/-1s`) for long exposures (>= 1.0s, e.g. 2.5s or 30s).
  - **Critical Gap 4 — Delivery Dock & Telemetry**: When sanitized, the file triggers a direct download via `triggerDownload`, but does not call `pushDownload` from `useFileStore`. Thus, the sanitized image never appears in the global floating `DownloadDock` or triggers the delivery confirmation modal.
  - **Critical Gap 5 — Typography**: Uses `font-mono` but lacks universal `.tabular-nums` across all numeric metrics.
  - **Status of `layout.tsx`**: Present at `src/app/image-metadata/layout.tsx` with valid metadata.

### 2.2 `/image-studio` Baseline vs Requirements
- **Current State (`src/app/image-studio/page.tsx`)**:
  - Only features basic width/height inputs, 3 format buttons, and a quality slider.
  - **Critical Gap 1 — Cropping**: Completely missing! Zero crop UI, zero crop state, no aspect ratio presets, even though `react-image-crop` is already installed in `package.json`.
  - **Critical Gap 2 — Color Adjustments & Filters**: Completely missing! No sliders for Brightness, Contrast, Saturation. No presets for B&W / Grayscale, Sepia, Invert, Warm, Cool.
  - **Critical Gap 3 — Flips**: Icons `FlipHorizontal` and `FlipVertical` were imported on line 23-24 but never rendered or hooked up.
  - **Critical Gap 4 — Workstation Ergonomics**: Controls are dumped into a single unstructured column. No tabbed tool switching ([Crop & Orient], [Resize], [Adjust & Filter], [Export & Compress]).
  - **Critical Gap 5 — Undo / Redo / Reset**: Icons `Undo2` and `Redo2` were imported on lines 14-15 but never wired to any state.
  - **Critical Gap 6 — EXIF Scrubbing Option**: Detects EXIF with a badge, but has no toggle in the export settings to strip metadata during processing.
  - **Critical Gap 7 — Typography**: Lacks `.tabular-nums` on dimensions, percentages, and byte stats.
  - **Status of `layout.tsx`**: Present at `src/app/image-studio/layout.tsx` with valid metadata.

---

## 3. Detailed Component & Module Specifications

### 3.1 Metadata Module Enhancement (`src/lib/image/metadata.ts`)

#### 3.1.1 Updated `DetailedExif` Interface
```typescript
export interface DetailedExif {
  // Camera & Hardware
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  lensMake?: string;
  artist?: string;
  copyright?: string;

  // Exposure & Sensor
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  focalLengthIn35mm?: number;
  flash?: string;
  whiteBalance?: string;
  meteringMode?: string;
  exposureProgram?: string;

  // Image Geometry
  imageWidth?: number;
  imageHeight?: number;
  megapixels?: string;
  aspectRatio?: string;

  // GPS Location
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsTimestamp?: string;
  dmsLatitude?: string;
  dmsLongitude?: string;

  // Raw Tag Inventory (for complete diagnostic list)
  rawTagCount: number;
}
```

#### 3.1.2 Formatting Helpers to Add:
1. **Exposure Time Formatter**:
   ```typescript
   function formatShutterSpeed(seconds: number | undefined): string | undefined {
     if (seconds === undefined || isNaN(seconds)) return undefined;
     if (seconds >= 1) return `${seconds.toFixed(1).replace(/\.0$/, "")}s`;
     const denominator = Math.round(1 / seconds);
     return `1/${denominator}s`;
   }
   ```
2. **DMS (Degrees, Minutes, Seconds) Converter**:
   ```typescript
   function toDMS(deg: number, isLat: boolean): string {
     const absolute = Math.abs(deg);
     const degrees = Math.floor(absolute);
     const minutesNotTruncated = (absolute - degrees) * 60;
     const minutes = Math.floor(minutesNotTruncated);
     const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
     const direction = deg >= 0 ? (isLat ? "N" : "E") : (isLat ? "S" : "W");
     return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
   }
   ```
3. **Safe Latitude / Longitude Verification**:
   ```typescript
   const hasGps = typeof data.latitude === "number" && typeof data.longitude === "number";
   ```

---

### 3.2 `/image-metadata` Workstation Implementation (`src/app/image-metadata/page.tsx`)

#### 3.2.1 UI Layout Architecture
1. **Workstation Header**:
   - Shield icon with `primary/0.15` accent badge.
   - Title: `Image Metadata & Privacy Cleaner`.
   - Subtitle: `Inspect optical sensor data and eliminate sensitive GPS coordinates before sharing.`
   - "Change Image" action when image is loaded.

2. **Quick File Summary Bar**:
   - File name (truncated with tooltip), format, natural dimensions (`WxH`), Megapixels (`X.X MP`), and byte size formatted with `.tabular-nums`.

3. **GPS Location Security Section (Conditional Banner)**:
   - **If GPS Detected**:
     - Red/Amber privacy alert box (`border-destructive/30 bg-destructive/10`).
     - Alert title: `"Sensitive GPS Location Embedded"`.
     - Message: `"This image contains exact geographical coordinates. Anyone with this file can pinpoint where it was captured."`
     - **Coordinate Card**:
       - Decimal: `<span className="tabular-nums font-mono">{lat.toFixed(6)}, {lon.toFixed(6)}</span>`
       - DMS: `<span className="tabular-nums font-mono">{dmsLat}, {dmsLon}</span>`
       - Altitude: `<span className="tabular-nums font-mono">{altitude ? altitude.toFixed(1) + "m" : "N/A"}</span>`
       - GPS Date/Time: `<span className="tabular-nums font-mono">{gpsTimestamp || "N/A"}</span>`
       - **Action Bar**:
         - "Copy Coordinates" Button (copies `lat, lon` to clipboard with toast notification, touch target ≥44px).
         - "View on OpenStreetMap" External Link (`target="_blank" rel="noopener noreferrer"`, URL: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`).
   - **If No GPS**:
     - Emerald success banner: `"Clean of GPS Data — No geographical coordinates detected."`

4. **Detailed Camera & Sensor Table**:
   - Organized into a structured 2-column or 3-column card with clear section headers:
     - **Camera & Lens**:
       - Make: `{metadata.make || "Unknown"}`
       - Model: `{metadata.model || "Unknown"}`
       - Lens: `{metadata.lensModel || "Unknown"}`
       - Software / OS: `{metadata.software || "Unknown"}`
     - **Exposure & Optics**:
       - Aperture: `<span className="tabular-nums">{metadata.fNumber ? "f/" + metadata.fNumber : "N/A"}</span>`
       - Shutter Speed: `<span className="tabular-nums">{metadata.exposureTime || "N/A"}</span>`
       - ISO: `<span className="tabular-nums">{metadata.iso ? "ISO " + metadata.iso : "N/A"}</span>`
       - Focal Length: `<span className="tabular-nums">{metadata.focalLength ? metadata.focalLength + "mm" : "N/A"}</span>`
       - 35mm Equiv: `<span className="tabular-nums">{metadata.focalLengthIn35mm ? metadata.focalLengthIn35mm + "mm" : "N/A"}</span>`
     - **Capture Settings & Geometry**:
       - Date Taken: `<span className="tabular-nums font-mono">{metadata.dateTime || "N/A"}</span>`
       - Resolution: `<span className="tabular-nums font-mono">{metadata.imageWidth} × {metadata.imageHeight}</span>`
       - Megapixels: `<span className="tabular-nums font-mono">{metadata.megapixels}</span>`
       - Flash: `{metadata.flash || "N/A"}`
       - White Balance: `{metadata.whiteBalance || "N/A"}`

5. **Single-Click EXIF Sanitization Action**:
   - High-contrast destructive button (`min-h-[48px]`, ≥44px touch target).
   - Label: `"Strip All Metadata & Sanitize Image"`.
   - On click: Runs Canvas rasterization via `stripImageMetadata`, creating a 100% clean image buffer.
   - Pushes output to `useFileStore.pushDownload(...)`.
   - Records telemetry in IndexedDB via `addHistoryRecord(...)`.

6. **Post-Sanitization Deliverable Card**:
   - Emerald bordered card (`border-emerald-500/30 bg-emerald-500/10`).
   - Comparison Grid:
     - Tags Removed: `<span className="tabular-nums">{metadata.rawTagCount} metadata tags</span>` → `<span className="font-bold text-emerald-400">0 tags (Clean)</span>`
     - GPS Status: `<span className="tabular-nums">Eliminated</span>`
     - Output Size: `<span className="tabular-nums font-mono">{formatBytes(cleanedBlob.size)}</span>`
   - Actions:
     - "Download Sanitized Image" button (≥48px height, `Button variant="default"`).
     - "Open in Image Studio" button (links to `/image-studio` with file loaded).

---

### 3.3 `/image-studio` All-in-One Workstation Implementation (`src/app/image-studio/page.tsx`)

#### 3.3.1 Workspace Architecture & Layout
The screen layout is divided into a 12-column responsive grid:
- **Left/Center Canvas Stage (7-8 cols)**: Live visual stage with interactive zoom, rotate, crop overlay, and compare slider.
- **Right Controls Dock (4-5 cols)**: Multi-tab tool palette with data-dense adjustments.

#### 3.3.2 Tool Tabs in Controls Dock
1. **Tab 1: Crop & Transform**:
   - **Interactive Crop Toggle**: `"Enable Crop Mode"` button.
   - **Aspect Ratio Presets**:
     - Chips with ≥44px touch targets:
       - `Free` (Unconstrained)
       - `1:1` (Square / Instagram / Avatar)
       - `4:3` (Standard Photo)
       - `16:9` (Widescreen / YouTube)
       - `9:16` (Story / Reels / TikTok)
       - `3:2` (35mm Classic)
   - **Crop Dimension Indicator**: Shows current crop width & height in pixels (`<span className="tabular-nums font-mono">{cropW} × {cropH} px</span>`).
   - **Orientation Controls**:
     - Rotate 90° CCW (`RotateCcw` icon)
     - Rotate 90° CW (`RotateCw` icon)
     - Flip Horizontal (`FlipHorizontal` icon)
     - Flip Vertical (`FlipVertical` icon)
   - "Apply Crop" and "Cancel Crop" buttons.

2. **Tab 2: Dimensions & Resize**:
   - Width & Height inputs with `.tabular-nums` and aspect-ratio lock switch.
   - Percentage Scaling Quick-Select Chips: `25%`, `50%`, `75%`, `100%`, `150%`, `200%`.
   - Preset Resolutions:
     - `1080p FHD (1920×1080)`
     - `720p HD (1280×720)`
     - `Square (1080×1080)`
     - `Story (1080×1920)`

3. **Tab 3: Color Adjustments & Filters**:
   - **Sliders (with live CSS filter preview on canvas element)**:
     - Brightness: `50%` to `150%` (default `100%`)
     - Contrast: `50%` to `150%` (default `100%`)
     - Saturation: `0%` to `200%` (default `100%`)
   - **Quick Filter Preset Buttons**:
     - `Normal` (Default)
     - `B&W / Grayscale` (`grayscale(100%)`)
     - `Warm Tone` (`sepia(25%) saturate(120%)`)
     - `Cool Tone` (`hue-rotate(180deg) saturate(90%)` or blue tint)
     - `Sepia` (`sepia(80%)`)
     - `Invert` (`invert(100%)`)
   - "Reset Filters" action button.

4. **Tab 4: Export & Quality**:
   - **Target Format**: `WebP` (Recommended), `JPG`, `PNG`.
   - **Quality Slider**: `10%` to `100%` (default `85%`), formatted with `.tabular-nums`.
   - **Privacy Strip Toggle**: Switch for `"Strip EXIF & GPS Metadata"` (Enabled by default).
   - Estimated Output Size indicator.

#### 3.3.3 Execution Pipeline (`executeStudioPipeline`)
The workstation executes a clean, single-pass or chained browser-native Canvas pipeline:
```typescript
async function renderStudioCanvas(
  sourceImage: HTMLImageElement,
  options: {
    crop?: { x: number; y: number; width: number; height: number };
    rotation: number; // 0, 90, 180, 270
    flipH: boolean;
    flipV: boolean;
    targetWidth: number;
    targetHeight: number;
    brightness: number; // 100 = normal
    contrast: number;   // 100 = normal
    saturation: number; // 100 = normal
    filterPreset?: string;
    format: string;     // 'image/webp', 'image/jpeg', 'image/png'
    quality: number;    // 0.1 to 1.0
  }
): Promise<Blob>
```
1. Create off-screen canvas.
2. Apply `ctx.filter` string:
   `ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%) ${presetFilterString}`;`
3. Translate and rotate/scale for orientation & flips.
4. Draw source crop region or full image into destination canvas dimensions.
5. Export blob via `canvas.toBlob(blob => ..., options.format, options.quality)`.
6. Return clean Blob.

#### 3.3.4 Stage Display & Visual Feedback
- **Live Preview Modes**:
  1. **Working Canvas**: Real-time CSS filter and transforms applied to the stage `<img>` or `<canvas>` for zero-latency 60fps adjustments.
  2. **Crop Mode**: Interactive `ReactCrop` bounding box with drag handles.
  3. **Compare Mode**: When output is generated, displays `CompareSlider` with draggable handle (≥44px handle) and `BeforeAfterStats` showing:
     - Original byte size vs Optimized byte size
     - Original dimensions vs New dimensions
     - Savings percentage with `.tabular-nums`
- **Output Actions**:
  - Primary button: `"Download Finished File"` (≥48px height, `Button variant="default"` or emerald).
  - Pushes download to `pushDownload` in `useFileStore`.
  - Sets `setLatestDeliveredFile` to trigger File Delivered celebratory card.

---

## 4. Ergonomics, Accessibility & Design Token Validation

### 4.1 Tabular Numerals (`.tabular-nums`) Enforcement
In accordance with R1/R5 and Milestone 3 acceptance criteria, layout shift caused by digit changes (e.g. `1` vs `8`) is strictly prevented by applying `.tabular-nums` to:
- File sizes (`formatBytes(...)`)
- Image pixel dimensions (`1920 × 1080 px`)
- Megapixels (`24.2 MP`)
- Sliders and percentages (`85%`, `+12%`, `-42%`)
- GPS coordinates (`37.774929° N, 122.419416° W`)
- Camera exposure values (`1/250s`, `f/2.8`, `ISO 400`, `50mm`)

### 4.2 Touch Targets (≥44px)
Every interactive element must satisfy the WCAG 2.5.5 / 2.5.8 target size criteria:
- Preset aspect ratio chips: `min-h-[44px]`
- Format switch buttons: `min-h-[44px]`
- Rotate / Flip icon buttons: `min-h-[44px] min-w-[44px]`
- Slider thumbs: Styled with `after:min-w-[44px] after:min-h-[44px]`
- Tab triggers: `min-h-[44px]`
- DropZone clickable trigger: Full responsive area
- Action buttons: `min-h-[48px]`

### 4.3 High Contrast (WCAG AA ≥ 4.5:1)
Verified against the established design system tokens:
- **Light Theme (`#F7F9FC`)**:
  - Primary buttons: `bg-[hsl(var(--primary))]` (`#2563EB`) with white text (`#FFFFFF`) → 4.86:1 contrast.
  - Card text: `text-[hsl(var(--foreground))]` (`#0F172A`) on `bg-[hsl(var(--card))]` (`#FFFFFF`) → 16.5:1 contrast.
  - Muted labels: `text-[hsl(var(--muted-foreground))]` (`#334155`) on light background → 9.82:1 contrast.
  - Destructive buttons: `bg-[hsl(var(--destructive))]` (`#DC2626`) with white text → 4.83:1 contrast.
  - Success text: `text-[hsl(var(--success))]` (`#15803D`) → 5.02:1 contrast.
- **Dark Theme (`#0B1020`)**:
  - Primary buttons: `bg-[hsl(var(--primary))]` (`#3B82F6`) with dark slate text (`#0F172A`) → 4.85:1 contrast.
  - Card text: `text-[hsl(var(--foreground))]` (`#F8FAFC`) on card (`#111827`) → 15.2:1 contrast.
  - Muted labels: `text-[hsl(var(--muted-foreground))]` on dark card → 6.5:1 contrast.
  - Destructive text/buttons: `text-red-400` / `bg-red-500` → ≥5.6:1 contrast.
  - Success badge: `text-emerald-400` on `bg-emerald-500/10` → ≥7.8:1 contrast.

### 4.4 Invariant: Zero Server Uploads
- Verified with `privacy-invariant.test.ts`:
  - 100% in-browser Canvas manipulation and `exifr` parsing.
  - Zero API route dependencies.
  - Zero outbound requests to external analytics or upload providers.

---

## 5. Step-by-Step Worker Task Breakdown

| Task ID | Component / File | Specific Changes | Acceptance Gate |
|---------|-----------------|------------------|-----------------|
| **T-M3-3.1** | `src/lib/image/metadata.ts` | 1. Enhance `DetailedExif` interface with `focalLengthIn35mm`, `flash`, `whiteBalance`, `megapixels`, `dmsLatitude`, `dmsLongitude`, `rawTagCount`.<br>2. Fix `formatShutterSpeed` edge case for >= 1s exposures.<br>3. Add DMS latitude/longitude conversion.<br>4. Ensure safe `hasGps` boolean verification. | TypeScript compiles cleanly; no regressions in `inspect.ts` or `metadata.ts`. |
| **T-M3-3.2** | `src/app/image-metadata/page.tsx` | 1. Implement rich camera & sensor table (Make, Model, Lens, ISO, Aperture, Focal Length, 35mm Equiv, Shutter, Megapixels, Dimensions).<br>2. Implement GPS Location Card with Decimal, DMS, Altitude, Copy Coordinates button, and OpenStreetMap external link.<br>3. Enforce `.tabular-nums` on all metrics.<br>4. Connect single-click sanitization to `pushDownload` and `addHistoryRecord`.<br>5. Display Post-Sanitization comparison card. | Touch targets ≥44px; WCAG AA contrast; zero layout shifts; downloads dock updated. |
| **T-M3-3.3** | `src/app/image-studio/page.tsx` | 1. Implement 4-tab workstation controls: [Crop & Transform], [Resize], [Color & Filters], [Export & Quality].<br>2. Integrate `ReactCrop` with aspect presets (Free, 1:1, 4:3, 16:9, 9:16, 3:2).<br>3. Integrate real-time CSS/Canvas color adjustments (Brightness, Contrast, Saturation, B&W, Sepia, Invert, Warm, Cool).<br>4. Add 90° Rotate and Flip H / Flip V.<br>5. Add `CompareSlider` and `BeforeAfterStats` for output review.<br>6. Integrate `pushDownload`, `setLatestDeliveredFile`, and EXIF strip toggle. | Full canvas multi-tool pipeline executes cleanly; touch targets ≥44px; tabular numerals applied. |
| **T-M3-3.4** | Layout Wrappers Validation | Validate `src/app/image-metadata/layout.tsx` and `src/app/image-studio/layout.tsx` metadata objects (title, description, canonical, openGraph, twitter). | Both routes generate static SEO metadata with zero errors. |
| **T-M3-3.5** | Test Suite Verification | Run full test suite: `npm test` (157+ tests). Run build gate: `npm run build` (33/33 static routes). | 100% test pass rate, 0 TypeScript errors, 0 ESLint errors. |

---

## 6. Independent Verification & Testing Commands

1. **Unit & Integration Tests**:
   ```powershell
   npm test
   ```
   *Expected outcome*: All test suites pass (157+ tests), 0 failures.

2. **Static Route Generation & Type Check**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: 33/33 static routes build with exit code 0, prerendering both `/image-metadata` and `/image-studio`.

3. **Privacy Invariant Test**:
   ```powershell
   npx tsx --test tests/privacy-invariant.test.ts
   ```
   *Expected outcome*: Zero outbound requests, strictly client-side canvas and exifr.
