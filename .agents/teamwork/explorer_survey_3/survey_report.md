# FileFixer 3.0: Engines, Preservation, Privacy & Support Survey Report

**Author**: Engines & Preservation Explorer (`explorer_survey_3`)  
**Date**: 2026-10-22  
**Target Path**: `c:\Users\nives\OneDrive\Documents\FileFixer\filefixer`  
**Working Directory**: `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_survey_3`  
**Investigation Mode**: Read-Only Survey & Architectural Synthesis  

---

## 1. Executive Summary

FileFixer is an on-device, zero-server-upload file utility suite built on Next.js 16 (Turbopack), React 19, TypeScript 5, and Tailwind CSS v4. It executes file transformations—such as multi-stage image compression, format transcoding, dimension scaling, EXIF/GPS metadata stripping, PDF manipulation, and multi-file batch processing—entirely inside the client browser sandbox.

### Core Architectural Findings
- **Zero Server Upload Guarantee: 100% Verified**:
  - The API directory (`src/app/api`) is completely empty.
  - There are **zero** `fetch()`, `XMLHttpRequest`, `navigator.sendBeacon()`, or `WebSocket` outgoing network calls anywhere in the `src/` codebase.
  - The only absolute URLs present are static SEO and canonical references in `sitemap.ts`, `robots.ts`, and `layout.tsx`.
- **Pure Client-Side Engine Stack**:
  - Image compression is executed via Web Workers with `browser-image-compression` and falls back gracefully to HTML5 Canvas 2D contexts (`canvas.toBlob()`).
  - Image conversion, cropping, rotation, and resizing are powered by native HTML5 `<canvas>` rendering with bilinear interpolation and aspect ratio locking.
  - Metadata parsing is handled client-side via `exifr` (supporting TIFF, EXIF, and GPS tag parsing), while metadata stripping is accomplished by redrawing raw pixel data onto a clean canvas context, stripping all APP1 markers.
  - PDF manipulation (merging, splitting, page extraction, page rotation, image-to-PDF generation, and object-stream compression) is executed in-browser using `pdf-lib` and `pdfjs-dist/legacy`.
  - Batch archiving packages files into `.zip` archives client-side using `jszip`.
- **Privacy-Safe Local Persistence**:
  - Session history is persisted in browser IndexedDB via `idb` (`filefixer_db`), storing only lightweight operational metadata (file names, sizes, timestamps, and bandwidth saved). **Zero file blobs or image bytes are stored in IndexedDB.**
  - Telemetry KPIs (total files processed, total bandwidth saved, zero cloud persistence) are computed on-the-fly from local records.
  - Theme preference is stored in `localStorage` (`filefixer_theme`) and synchronized before paint via an inline `<head>` script to prevent theme flashing.
- **Processing Feedback & Deliveries**:
  - Output files are tracked in a centralized memory queue (`useFileStore`) rendered via a floating, collapsible Download Dock (`DownloadDock.tsx`), a full-session modal (`DownloadCenterModal.tsx`), and celebratory completion cards (`FileDeliveredModal.tsx`).
- **Voluntary Support Integration**:
  - Integrated via a non-blocking floating prompt (`SupportPrompt.tsx`) and an accessible modal (`SupportModal.tsx`).
  - Displays the official UPI QR code (`public/images/filefixer_support_qr.png`).
  - Triggered automatically only after successful processing operations, throttled by `sessionStorage` (`filefixer_support_prompt_shown`) to appear at most once per session after a 1200ms delay.
  - 100% voluntary: no payment gateways, no checkout forms, no tracking tokens, and zero interference with downloads.
- **Build & Quality Gates**:
  - `npm run build` runs with Next.js 16.3.5 Turbopack and completes with **Exit Code 0**, generating all 33 static routes with zero TypeScript errors.
  - No automated test runner (Jest, Vitest, Playwright) is currently configured in `package.json`.
  - `npm run lint` flags 173 lint issues (59 errors, 114 warnings), primarily stemming from React 19's strict `react-hooks/set-state-in-effect` rule and unused TypeScript imports.

---

## 2. On-Device Processing Engines & Privacy Architecture

### 2.1 Engine Technology Matrix

| Processing Domain | Primary Engine / Library | Sandbox / Execution Context | Fallback / Redundancy | Key Source Files |
| :--- | :--- | :--- | :--- | :--- |
| **Image Compression** | `browser-image-compression` v2.0.2 | Dedicated Web Worker (`useWebWorker: true`) | HTML5 Canvas 2D (`toBlob`) | `src/lib/image/compress.ts`<br>`src/lib/smartCompress.ts` |
| **Image Conversion** | HTML5 `<canvas>` 2D Context | Main UI Thread Canvas rendering | None (Native Canvas API) | `src/lib/image/convert.ts` |
| **Image Resizing** | HTML5 `<canvas>` (`imageSmoothingQuality: "high"`) | Main UI Thread Canvas rendering | Contain / Cover / Stretch math | `src/lib/image/resize.ts` |
| **Transform & Crop** | HTML5 `<canvas>` Matrix transform | Main UI Thread Canvas rendering | Rotation & Flip translation | `src/lib/image/transform.ts` |
| **Metadata Parsing** | `exifr` v7.1.3 | Client-side ArrayBuffer parsing | Silent empty record fallback | `src/lib/image/metadata.ts`<br>`src/lib/inspect.ts` |
| **Metadata Scrubbing** | HTML5 `<canvas>` Pixel Redraw | Clean Canvas re-encode (`canvas.toBlob`) | Discards all APP1/EXIF segments | `src/lib/image/metadata.ts`<br>`src/app/privacy-cleaner/page.tsx` |
| **PDF Manipulation** | `pdf-lib` v1.17.1 | In-memory ArrayBuffer parsing | Object stream deduplication | `src/lib/pdf/merge.ts`<br>`src/lib/pdf/split.ts`<br>`src/lib/pdf/compress.ts`<br>`src/lib/pdf/imagesToPdf.ts`<br>`src/lib/pdf/workspace.ts` |
| **PDF Rendering** | `pdfjs-dist` v6.3.289 (legacy build) | Webpack alias in `next.config.ts` | Client canvas rendering | `next.config.ts` |
| **ZIP Archiving** | `jszip` v3.10.2 | In-memory blob stream generation | Browser anchor download trigger | `src/lib/zip.ts` |
| **Data Persistence** | `idb` v8.0.3 (IndexedDB) | Browser IndexedDB sandbox | Memory state fallback if disabled | `src/lib/storage/history.ts` |

---

### 2.2 Deep-Dive: Image Engines

#### A. Compression (`src/lib/image/compress.ts`)
- **Modes Supported**:
  - `recommended`: Automatically scales target megabytes based on original file size (e.g. >10MB targets 2.0MB at 0.75 quality; 4-10MB targets 1.0MB at 0.8 quality; 1-4MB targets 0.5MB at 0.82 quality; <1MB targets 70% of original size at 0.85 quality).
  - `targetSize`: Enforces a hard upper ceiling specified in megabytes (`targetSizeMB`).
  - `quality`: Lets visual quality drive output without aggressive dimensional downscaling (`initialQuality` between 0.1 and 1.0).
- **Execution Pattern**:
  ```ts
  const compressionConfig = {
    maxSizeMB: maxMB,
    maxWidthOrHeight: 4096,
    useWebWorker: true,
    initialQuality: initialQuality,
    alwaysKeepResolution: options.mode === "quality",
    onProgress: (p: number) => { if (onProgress) onProgress(p); },
  };
  const compressedFile = await imageCompression(file, compressionConfig);
  ```
- **Fallback Mechanism**:
  If `browser-image-compression` throws (e.g., worker instantiation failure in restricted iframes), it falls back to `fallbackCanvasCompress(file, initialQuality, options.targetSizeMB)` using `FileReader` -> `HTMLImageElement` -> `HTMLCanvasElement` -> `canvas.toBlob()`.
- **Oversize Protection**:
  If the compressed file is larger than the original (frequent in already heavily compressed JPEGs), `compressImage` discards the oversized output and retains the original file.

#### B. Smart Compression (`src/lib/smartCompress.ts`)
- Multi-pass progressive engine for meeting exact file size constraints (e.g. "Under 1 MB" or "Under 500 KB").
- If the file is already under the target threshold, it bypasses processing immediately.
- For images, executes up to 5 progressive passes with stepped quality and resolution limits:
  1. High Quality Pass: Quality 0.82, max 2560px
  2. Balanced Pass: Quality 0.68, max 2048px
  3. Strong Compression: Quality 0.52, max 1600px
  4. Target Optimization: Quality 0.40, max 1280px
  5. Extreme Optimization: Quality 0.28, max 1024px
- Returns detailed telemetry for every attempt (`CompressionAttempt[]`) and picks the best blob.
- For PDFs, executes Pass 1 (Object stream deduplication) followed by Pass 2 (Structural hierarchy compaction across a new `PDFDocument`).

#### C. Conversion, Resizing, and Transformation
- **Transparency Protection** (`src/lib/image/convert.ts`):
  When converting transparent PNG/WebP files to JPEG, `ctx.fillStyle = options.backgroundColor || "#ffffff"` fills the canvas to prevent alpha pixels from rendering as black boxes.
- **Aspect Ratio Locking & Fitting** (`src/lib/image/resize.ts`):
  Supports `contain` (letterbox/pillarbox centering), `cover` (aspect crop to center), and `stretch`. Uses `ctx.imageSmoothingQuality = "high"`.
  Pre-loaded with 9 popular presets (`RESIZE_PRESETS`): Instagram Post (1080x1080), Instagram Story (1080x1920), YouTube Thumbnail (1280x720), YouTube Banner (2560x1440), WhatsApp Profile (500x500), LinkedIn Cover (1584x396), Passport Photo (600x600), Twitter/X Post (1200x675), and Facebook Cover (820x312).
- **Geometric Transformations** (`src/lib/image/transform.ts`):
  Translates the canvas center origin, applies radian rotation (`(rotation * Math.PI) / 180`), scales horizontal/vertical flip (`flipH ? -1 : 1, flipV ? -1 : 1`), draws the image offset by negative half-dimensions, and crops to custom pixel bounds if specified.

---

### 2.3 Deep-Dive: PDF Engines (`pdf-lib`)

- **PDF Merge** (`src/lib/pdf/merge.ts`):
  Reads each file as `ArrayBuffer` via `FileReader`, loads into an ephemeral `PDFDocument`, calls `mergedPdf.copyPages(pdf, pdf.getPageIndices())`, adds copied pages to a root `mergedPdf`, and serializes via `mergedPdf.save()`.
- **PDF Split & Extraction** (`src/lib/pdf/split.ts`):
  - `parsePageSelection("1-3, 5, 8-10", maxPages)`: Tokenizes page selection syntax, bounds checks values, and produces a sorted, deduplicated 0-indexed array.
  - `extractPages(file, pageIndices)`: Copies selected pages into a single new PDF document.
  - `splitAllPages(file)`: Iterates through each page index and outputs an array of single-page PDF blobs named `${baseName}_page_001.pdf`.
- **PDF Compression** (`src/lib/pdf/compress.ts`):
  - Removes document metadata (`setTitle("")`, `setAuthor("")`, `setSubject("")`, `setKeywords([])`, `setProducer("")`, `setCreator("")`).
  - Re-encodes pages into a brand new `PDFDocument` instance, effectively stripping orphan indirect objects, unused XObjects, and dead revision streams.
  - Serializes with `{ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 }`.
- **Images to PDF** (`src/lib/pdf/imagesToPdf.ts`):
  - Supports PNG embedding via `pdfDoc.embedPng(arrayBuffer)` and JPEG embedding via `pdfDoc.embedJpg(arrayBuffer)`.
  - For WebP or unusual raster images, converts to JPEG in an offscreen canvas (`convertImageToJpegBuffer`) before embedding.
  - Supports page sizes: A4 (`PageSizes.A4`), Letter (`PageSizes.Letter`), and auto-fitted to image dimensions.
  - Handles auto-orientation matching and margin centering.
- **PDF Visual Workspace** (`src/lib/pdf/workspace.ts`):
  - Ingests PDF documents and enumerates all pages into `WorkspacePage` descriptors (`id`, `originalPageIndex`, `displayNumber`, `rotation`).
  - `saveWorkspacePdf(file, pages)`: Reconstructs a new PDF by copying the pages in the user's reordered sequence and applying custom degrees rotation (`copiedPage.setRotation(degrees(p.rotation % 360))`).

---

### 2.4 Deep-Dive: Metadata & Privacy Cleaner

- **Inspection** (`src/lib/image/metadata.ts` & `src/lib/inspect.ts`):
  - Parses EXIF, TIFF, and GPS tags via `exifr.parse(file, { tiff: true, exif: true, gps: true })`.
  - Extracts camera make, model, software, datetime, artist, copyright, exposure time, f-number, ISO, focal length, lens model, GPS latitude, longitude, and altitude.
- **Sanitization Mechanism** (`stripImageMetadata` in `src/lib/image/metadata.ts`):
  - Does NOT simply edit binary markers (which can leave residual orphaned chunks).
  - Reads the file into an `HTMLImageElement`, draws raw raster pixels onto a freshly instantiated `<canvas>`, and exports a new clean blob via `canvas.toBlob()`.
  - This completely purges all EXIF, XMP, IPTC, GPS, and camera metadata tags.

---

### 2.5 Verification of Zero Server Upload Guarantee

A rigorous codebase audit was conducted to confirm the privacy claims:
1. **API Endpoints**: Directory `filefixer/src/app/api` exists but contains **0 files**.
2. **Network Search**:
   - `grep_search` for `fetch(` in `filefixer/src`: **0 occurrences**.
   - `grep_search` for `XMLHttpRequest` in `filefixer/src`: **0 occurrences**.
   - `grep_search` for `sendBeacon` in `filefixer/src`: **0 occurrences**.
   - `grep_search` for `WebSocket` in `filefixer/src`: **0 occurrences**.
   - `grep_search` for `https://` in `filefixer/src`: Only 3 matches, all static metadata:
     - `src/app/sitemap.ts:3`: `const BASE_URL = "https://filefixer.vercel.app";`
     - `src/app/layout.tsx:29`: `metadataBase: new URL("https://filefixer.vercel.app")`
     - `src/app/robots.ts:11`: `sitemap: "https://filefixer.vercel.app/sitemap.xml"`
3. **Download Mechanism**:
   - Downloads are executed via `triggerDownload(blob, filename)` (`src/lib/file-utils.ts:89-98`):
     ```ts
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     setTimeout(() => URL.revokeObjectURL(url), 1000);
     ```
   - No external URL redirects or download relay services are used.

**Conclusion**: The zero server upload guarantee is absolute and fully enforced at the code level.

---

## 3. Batch Pipeline Processing Engine, Task Queues & Progress

### 3.1 Batch Studio Architecture (`src/app/batch/page.tsx` & `src/lib/batch/batchProcessor.ts`)

- **Sequential Processing Queue**:
  Files are queued and processed sequentially using an async loop:
  ```ts
  for (let i = 0; i < files.length; i++) {
    setCurrentIdx(i);
    const itemResult = await processBatchItem(files[i], i, config);
    tempResults[i] = itemResult;
    setResults([...tempResults]);
  }
  ```
  *Design Rationale*: Processing images sequentially prevents browser memory spikes, tab crashes, and WebGL/Canvas context loss when users drop 50+ high-resolution camera files.
- **Pipeline Stage Configuration**:
  1. `Resize`: Clamped to `targetWidth` / `targetHeight` with aspect ratio preservation.
  2. `Convert`: Transcodes to `image/webp`, `image/jpeg`, or `image/png`.
  3. `Compress`: Configurable quality percentage (`qualityPct`).
  4. `Rename`: Template-based sequential naming (`asset_###` -> `asset_001.webp`, `asset_002.webp`).
- **Telemetry & State Tracking**:
  - `Stats Bar`: Files count, Done / Failed counter, Before size, After size, and Space Saved with percentage.
  - `Live Progress Bar`: Deterministic percentage (`Math.round((definedResults.length / files.length) * 100)`).
  - Per-item status indicators: `Queued`, `Processing...` (spinning indicator), `Done` (green savings badge), or `Error` (red message).
- **Fault Tolerance & Partial Retries**:
  `handleRetryFailed()` iterates exclusively through items where `!results[i] || results[i]?.status === "error"`, reprocessing failed items without re-running successful ones.
- **Global Deliveries Integration**:
  Every successfully processed item is pushed into `useFileStore.getState().pushDownload(...)`, making it accessible in the floating Download Dock.
- **Archiving**:
  Completed items can be downloaded as a single `.zip` file via `downloadAsZip(entries, "filefixer_batch_assets.zip")` or triggered individually with staggered download intervals (150ms delay).

---

### 3.2 Visual Workflow Builder (`src/components/workflows/WorkflowBuilder.tsx`)

- Allows users to visually compose and reorder pipeline steps:
  - `resize`
  - `convert`
  - `compress`
  - `strip_metadata`
  - `rename`
- Pre-packaged starter presets:
  - *Website Images*: Resize (1920px) -> Convert (WebP) -> Compress (82%) -> Strip EXIF.
  - *Email Safe Images*: Resize (1280px) -> Compress (70%) -> Convert (JPG).
  - *WhatsApp / Chat*: Compress (75%) -> Strip GPS Location.
  - *Fast Upload & Rename*: Resize (1024px) -> Convert (WebP) -> Sequential Rename (`asset_###`).
- Executes chained transforms in top-to-bottom sequence across all selected files, tracks live active file/step indicators, and automatically packages the output into `filefixer-workflow-output.zip`.

---

### 3.3 Batch Rename Engine (`src/app/batch-rename/page.tsx`)

- Dedicated filename transformer for sanitizing file collections.
- Real-time reactive preview (`previewList` via `useMemo`):
  - Dynamic pattern substitution (`#` -> `1`, `##` -> `01`, `###` -> `001`).
  - Optional ISO date prepending (`YYYY-MM-DD_`).
  - Whitespace replacement with configurable character (default `_`).
  - Automatic lowercasing option.
- Exports all renamed files packaged in a single ZIP file (`renamed_files.zip`) with zero re-encoding artifacts.

---

## 4. History System, Telemetry KPIs & Local Persistence

### 4.1 IndexedDB Storage Architecture (`src/lib/storage/history.ts`)

- **Database Name**: `filefixer_db`
- **Schema Version**: `1`
- **Object Store**: `history` (keyPath: `"id"`)
- **Indexes**: `"by-timestamp"` on field `"timestamp"`
- **Record Data Structure**:
  ```ts
  export interface HistoryRecord {
    id: string;          // e.g. "hist-1729617300000-a1b2c"
    filename: string;    // Name of file or batch summary
    tool: string;        // e.g. "Batch Studio", "Compress Image"
    originalSize: number;// Bytes
    outputSize: number;  // Bytes
    savingsPct: number;  // e.g. 45.2
    timestamp: number;   // Epoch milliseconds
  }
  ```
- **Privacy Design Rule**:
  No raw file content, blobs, base64 data, or image pixels are persisted to IndexedDB. Only numerical statistics and labels are retained.
- **Operations**:
  - `addHistoryRecord`: Inserts record with auto-generated ID and computed savings percentage.
  - `getAllHistory`: Queries index `"by-timestamp"`, returning most recent records first.
  - `deleteHistoryRecord(id)`: Removes a single record.
  - `clearAllHistory`: Purges the entire `history` object store.

---

### 4.2 History Page & Telemetry KPIs (`src/app/history/page.tsx`)

- **Telemetry KPI Tiles**:
  1. *Files Processed Locally*: Total count of records in IndexedDB (`tabular-nums`).
  2. *Total Bandwidth Saved*: Sum of `Math.max(0, originalSize - outputSize)` across all records, formatted via `formatBytes` (`tabular-nums`).
  3. *Privacy Status*: Static verified badge: `Zero Cloud Persistence`.
- **Management & Deletion**:
  - Global `Clear Local Data` button with confirmation toast.
  - Per-item trash can icon for granular removal.

---

### 4.3 Browser Storage Persistence Matrix

| Storage Mechanism | Key / Store Name | Purpose | Lifecycle / Policy |
| :--- | :--- | :--- | :--- |
| **IndexedDB** | `filefixer_db` -> `history` | Bandwidth savings & session processing logs | Persistent across sessions; user clearable |
| **localStorage** | `filefixer_theme` | Theme mode (`dark`, `light`, `system`) | Persistent; read by inline `<head>` script |
| **sessionStorage** | `filefixer_support_prompt_shown` | Tracks if voluntary support prompt was displayed | Cleared on browser tab close (once per session) |
| **Memory (`Zustand`)** | `useFileStore.files` | Central temporary workspace files | Ephemeral; destroyed on page refresh |
| **Memory (`Zustand`)** | `useFileStore.downloadQueue` | Recent delivered output files (max 20) | Ephemeral; destroyed on page refresh |

---

## 5. Processing Feedback, Download Dock & Deliveries

### 5.1 Feedback & Status Indicators

- **Tabular Numerals**: Numeric metrics, file sizes, percentages, and counters utilize CSS `.tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent layout shifts during live processing updates.
- **Micro-Interactions**:
  - Animated SVG checkmark on delivery: `<polyline points="20 6 9 17 4 12" className="animate-check-draw" />`.
  - Spinners: `Loader2` and `RefreshCw` with `animate-spin` classes.
  - Clear visual badges with semantic color tokens (`bg-[hsl(var(--primary)/0.15)]`, `text-emerald-400`, `text-[hsl(var(--destructive))]`).

---

### 5.2 Floating Download Dock (`src/components/download/DownloadDock.tsx`)

- **Placement**: Fixed floating dock positioned at `fixed bottom-20 md:bottom-6 right-4 z-40 max-w-sm w-full`.
- **States & Interactivity**:
  - Automatically hidden when `downloadQueue.length === 0`.
  - Header displays total delivery count and active in-flight count.
  - Minimize / Expand toggle (`isMinimized`) preserves screen real estate on mobile and tablet devices.
  - "View All" link opens the comprehensive `DownloadCenterModal`.
  - Dismiss all (`X`) clears the queue.
  - Stacked item cards display filename, size, savings percentage, status, individual re-download button, and item dismiss button.

---

### 5.3 "File Delivered" Modal Cards (`src/components/download/FileDeliveredModal.tsx`)

- **Trigger**: Appears when a single tool finishes and marks `setLatestDeliveredFile(item)`.
- **Visual Presentation**: Centered modal card with blurred backdrop (`bg-black/65 backdrop-blur-xs`), animated green checkmark badge, and headline `"Ready on your device."`.
- **Metrics Grid**: 3-column breakdown displaying `Original Size`, `Final Size`, and `Saved %`.
- **Guarantee Banner**: Features `HardDrive` icon: `"Processed 100% in your browser • Never sent to cloud"`.
- **Action Buttons**:
  - `Download Again`: Re-triggers direct file download.
  - `Reuse in Another Tool`: Calls `promoteOutputToInput(correspondingFile.id)` to chain the processed file into another editing step without re-uploading.
  - `Done`: Dismisses modal.

---

### 5.4 Download Center Modal (`src/components/download/DownloadCenterModal.tsx`)

- Full-screen/centered dialog aggregating all outputs generated in the current browser session.
- Displays combined statistics: `Total Original`, `Final Size`, and `Bandwidth Saved`.
- Features single-click `Download All as ZIP` which uses `downloadAsZip()` to bundle all memory blobs into `filefixer-deliveries.zip`.

---

## 6. Voluntary Support Integration & Payment Semantics

### 6.1 Non-Blocking UX Architecture

The voluntary support architecture is designed to respect user focus while providing an easy avenue for contributions:
1. **Never Blocks Workflow**: File processing and downloads are completely decoupled from support prompts. Downloads never wait for user interaction with support modals.
2. **Frequency Throttling**: The support prompt is governed by `sessionStorage.getItem("filefixer_support_prompt_shown")`. It appears **at most once per browser session**.
3. **Gentle Timing Delay**: The prompt triggers via `triggerSupportPrompt()` inside `components/ui/toaster.tsx` only after a successful processing toast, with a **1200ms delay** so it does not interrupt immediate user feedback. Excludes trivial toast events (copying, clearing, downloading).
4. **Accessible Dismissal**: Pressing `Escape`, clicking "Maybe later", or clicking the `X` dismisses the prompt immediately without persistent re-prompting.

---

### 6.2 Component Structure & Assets

- **Support Prompt** (`src/components/support/SupportPrompt.tsx`):
  - Fixed non-blocking container: `fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 animate-slide-up`.
  - Accessible announcement via `role="region"` and `aria-live="polite"`.
  - Message: *"If FileFixer helped you, consider supporting its development. Your support helps me continue improving free, privacy-focused file tools."*
  - CTA Button: `"❤️ Support FileFixer"` opens the modal.
- **Support Modal** (`src/components/support/SupportModal.tsx`):
  - Accessible modal dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="support-dialog-title"`).
  - Background scroll lock and focus restoration: remembers `previousFocusRef` on open and returns focus to the initiating element on close.
  - Escape key listener and backdrop click-outside dismissal.
  - Displays the QR code image with high priority and responsive constraints:
    ```tsx
    <Image
      src="/images/filefixer_support_qr.png"
      alt="FileFixer voluntary support UPI QR code"
      width={320}
      height={332}
      unoptimized
      priority
      className="w-full h-auto max-h-[46vh] sm:max-h-[340px] object-contain transition-opacity rounded-lg"
    />
    ```
  - Graceful image error state with fallback warning text if the asset fails to render.
- **Footer Support Button** (`src/components/support/FooterSupportButton.tsx`):
  - Persistent voluntary link embedded in the global footer: `<Heart /> Support FileFixer`.
- **UPI QR Asset Verification**:
  - File exists at `filefixer/public/images/filefixer_support_qr.png`.
  - Verified valid PNG image (320×332 px) with the FileFixer branding icon centered in the QR pattern.

---

### 6.3 Payment Semantics

- **Pure Voluntary UPI Donation**:
  - The payment method is a direct UPI (Unified Payments Interface) scan-and-pay QR code.
  - No payment gateway SDKs (Stripe, Razorpay, PayPal) are embedded.
  - No credit card entry, subscription tiers, or checkout workflows exist.
  - Zero transaction tokens or financial tracking scripts are included.
  - Explicit copy: `"Any amount is appreciated ❤️"` and `"Completely optional. All FileFixer tools remain free."`

---

## 7. Testing, Build & Quality Analysis

### 7.1 Existing Test Setup Audit

- **Unit Tests**: Currently **none**. No Vitest, Jest, or Mocha configuration exists in `package.json`. No `*.test.*` or `*.spec.*` files exist in `src/`.
- **E2E Tests**: Currently **none**. No Playwright or Cypress dependencies are configured.
- **Scripts in `package.json`**:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
  ```

---

### 7.2 Build Command Behavior (`npm run build`)

The build was executed via `npm run build` using Next.js 16.3.5 Turbopack:
```
> filefixer@0.1.0 build
> next build

▲ Next.js 16.3.5 (Turbopack)
✓ Running next.config.ts took 59ms
  Creating an optimized production build ...
✓ Compiled successfully in 2.7s
  Running TypeScript ...
  Finished TypeScript in 3.4s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/33) ...
  Generating static pages using 7 workers (33/33) in 1601ms
✓ Generating static pages using 7 workers (33/33) in 1601ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ○ /apple-icon.png
├ ○ /batch
├ ○ /batch-rename
├ ○ /branding
├ ○ /compress-image
├ ○ /convert-image
├ ○ /crop-image
├ ○ /history
├ ○ /icon.svg
├ ○ /image-metadata
├ ○ /image-studio
├ ○ /images-to-pdf
├ ○ /inspect
├ ○ /pdf-compress
├ ○ /pdf-merge
├ ○ /pdf-split
├ ○ /pdf-studio
├ ○ /pdf-workspace
├ ○ /privacy
├ ○ /privacy-cleaner
├ ○ /resize-image
├ ○ /robots.txt
├ ○ /sitemap.xml
├ ○ /smart-compress
├ ○ /terms
├ ○ /tools
├ ○ /workflows
└ ○ /workspace

○  (Static)  prerendered as static content
```

**Result**:
- **Exit Code: 0 (SUCCESS)**
- **Static Pages Generated**: Exactly 33 out of 33 routes pre-rendered statically.
- **TypeScript Errors**: 0 errors.

---

### 7.3 ESLint Analysis (`npm run lint`)

Execution of `npm run lint` (`eslint`) yielded:
- **Total Problems**: 173 (59 errors, 114 warnings).
- **Primary Root Causes**:
  1. `react-hooks/set-state-in-effect`: React 19's new ESLint rule flags direct synchronous `setState()` calls inside `useEffect` (e.g. initializing dimensions or preview URLs when `activeFile` changes in `WorkspaceView.tsx`).
  2. `react-hooks/exhaustive-deps`: Missing effect dependencies in hook dependency arrays.
  3. `@typescript-eslint/no-unused-vars`: Unused type imports and parameters in processing modules (e.g., `SupportedImageFormat`, `getExtensionFromMime` in `compress.ts` and `metadata.ts`).

---

## 8. Architectural Recommendations for Implementation Phase

1. **Preserve Processing Engines & Signatures**:
   Keep the public API of `src/lib/image/*`, `src/lib/pdf/*`, `src/lib/batch/*`, and `src/lib/storage/history.ts` stable so existing tools and workstations retain 100% functional parity.
2. **Standardize Numerical Formats**:
   Ensure all file size outputs, compression ratios, and dimensions use `.tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent layout shifts across tools.
3. **Guard Memory Blobs & Object URLs**:
   Whenever creating temporary object URLs for image or PDF previews (`URL.createObjectURL`), ensure cleanup via `URL.revokeObjectURL()` inside `useEffect` unmount handlers or after download execution to avoid client memory leaks during extensive sessions.
4. **Preserve Support Modal Flow**:
   Retain the exact session storage check (`filefixer_support_prompt_shown`), the 1200ms delay, the `public/images/filefixer_support_qr.png` asset, and the non-blocking dismiss mechanics.
5. **Lint Cleanliness in Upgraded Components**:
   When redesigning tool pages or shared workspace components, avoid calling `setState` directly inside effect bodies to satisfy React 19 rules (e.g., derive state directly, or update state inside event handlers).
