# Milestone 5 Specification Matrix & Behavioral Requirements

**Date**: 2026-10-23  
**Track**: Specification Mining (Milestone 5)  
**Author**: Specification Miner Agent (`spec_miner_m5`)  
**Scope**: Features 19, 20, 21, 22, 23 of FileFixer  
**Target Environment**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Turbopack  

---

## 1. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 19.1 | Batch | Sequential Pipeline Engine | Executes multi-stage image processing (resize, convert, compress, rename) 1 item at a time | Array of image `File` objects, `BatchPipelineConfig` | Array of `BatchItemResult` objects (`id`, `blob`, `outputName`, `outputSize`, `status`) | Catches error per-item; marks status as `"error"`, preserves original blob, sets `error` message string; proceeds to next item | `src/lib/batch/batchProcessor.ts`, `tests/tier1-feature-coverage.test.ts` |
| 19.2 | Batch | Batch Studio Workstation | Tabular UI for configuring and running 4-stage pipeline with live progress telemetry | User-uploaded images, stage toggles (resize, convert, compress, rename) | Processed files table, individual download, ZIP bundle download, history record | Rejects non-image files with error toast; displays per-item error badge with retry option | `src/app/batch/page.tsx`, `tests/adversarial-m2-challenger.test.ts` |
| 19.3 | Batch | Partial Retry Mechanism | Re-executes only failed batch pipeline items without discarding completed ones | Array of existing results containing `status: "error"` or `undefined` | Re-processed items updated in-place to `status: "done"` | Re-attempts processing; if still failing, maintains `"error"` badge and updates error message | `src/app/batch/page.tsx` (`handleRetryFailed`) |
| 19.4 | Batch | Visual Workflow Builder | Draggable/reorderable multi-step pipeline runner with starter presets and custom operation chaining | Image files, customizable `WorkflowStep[]` array | Sequentially transformed files, automatic ZIP bundle download | Catches step-level failure in `console.error`; falls back to current blob and continues to subsequent steps | `src/app/workflows/page.tsx`, `src/components/workflows/WorkflowBuilder.tsx` |
| 19.5 | Batch | ZIP Archive Bundling | In-browser client-side bundling of multiple processed files into a single `.zip` file | Array of `{ filename: string, blob: Blob }`, zip filename string | Triggered browser download of `.zip` archive via `jszip` | Handles empty queue gracefully; throws or toasts error if compression fails | `src/lib/zip.ts`, `tests/tier4-application-scenarios.test.ts` |
| 20.1 | Rename | Batch Sequence Rename | Standardizes filenames into numbered sequences with template `#` padding, case conversion, date prefixing | Array of arbitrary `File` objects, template pattern string (e.g. `Project_###`), start index, toggles | Live preview list mapping `origName → finalName`, downloadable ZIP bundle | If template lacks `#`, defaults to static name or unpadded index without crashing; safe space replacement | `src/app/batch-rename/page.tsx`, `tests/tier1-feature-coverage.test.ts`, `tests/tier2-boundary-corner.test.ts` |
| 20.2 | Privacy | Privacy Cleaner Inspector | Audits image and PDF headers for sensitive EXIF, GPS coordinates, camera serials, and author tags | Single image or PDF `File` | `FileMetadata` object with `hasGps`, `cameraMake`, `cameraModel`, `dateTaken`, `pdfAuthor`, etc. | If EXIF/PDF parsing fails, safely returns base metadata (name, size, type) without throwing | `src/app/privacy-cleaner/page.tsx`, `src/lib/inspect.ts` |
| 20.3 | Privacy | Privacy Metadata Stripping | Re-encodes images without metadata segments and scrubs PDF author tags | Image `File` or PDF `File` | Cleaned `Blob` with `_privacy_clean` suffix, free of location/device identifiers | On failure, alerts with specific error message and leaves source untouched | `src/app/privacy-cleaner/page.tsx`, `src/lib/image/metadata.ts` |
| 20.4 | Privacy | Privacy Cleaner Layout Metadata | Next.js App Router metadata wrapper for `/privacy-cleaner` | Static metadata request | Metadata export (title, description, canonical url, OpenGraph, Twitter cards) | Missing file causes build failure; must match SEO and route parity standards | `src/app/privacy-cleaner/layout.tsx`, `PROJECT.md` |
| 21.1 | Delivery | Floating DownloadDock | Global floating UI dock displaying recent deliveries across route navigation | `DownloadQueueItem` additions via `pushDownload()` | Floating docked drawer with badge count, individual re-download, dismiss, clear all, minimize | Maximum capacity cap enforced at 20 items (slices off oldest); handles 0-byte items safely | `src/components/download/DownloadDock.tsx`, `src/stores/fileStore.ts`, `tests/tier1-feature-coverage.test.ts` |
| 21.2 | Delivery | Celebratory FileDeliveredModal | Accessible modal showing before/after size comparisons, savings percentage, and reuse action | `latestDeliveredFile` object in `useFileStore` | Modal with checkmark animation, tabular stats card, Download Again, Reuse in Another Tool | Non-blocking: closing does not abort downloads; focus trapped; Escape key dismiss; restores focus | `src/components/download/FileDeliveredModal.tsx`, `tests/adversarial-modal-accessibility.test.ts` |
| 21.3 | Delivery | Session Download Center Modal | Full dialog view of all delivered files in current session memory with bulk ZIP download | `downloadQueue` items with valid Blobs | Aggregate stats summary (Total Original, Final Size, Bandwidth Saved), selective/all ZIP download | Disables actions when queue is empty; renders empty state illustration | `src/components/download/DownloadCenterModal.tsx`, `tests/adversarial-modal-accessibility.test.ts` |
| 22.1 | Support | Session-Throttled Support Prompt | Non-intrusive floating toast prompting voluntary contribution 1200ms after completion | File delivery trigger via `triggerSupportPrompt()` | Floating card with "Support FileFixer" button and "Maybe later" dismiss | Strictly checks `sessionStorage`; appears at most once per session; shifts position when dock is open | `src/components/support/SupportPrompt.tsx`, `src/stores/fileStore.ts`, `tests/adversarial-modal-accessibility.test.ts` |
| 22.2 | Support | Voluntary Support Modal | Accessible modal displaying the verified UPI QR code asset without blocking downloads | User click from SupportPrompt, Header, or Footer | Modal with UPI QR image, descriptive alt text, accessible focus trapping | If image fails to load, `onError` sets `imageFailed(true)` and displays accessible explanation | `src/components/support/SupportModal.tsx`, `tests/tier1-feature-coverage.test.ts`, `tests/tier2-boundary-corner.test.ts` |
| 22.3 | Support | QR Code Asset Integrity | Exact vector/raster asset preservation for voluntary contribution | Filesystem inspection of `public/images/filefixer_support_qr.png` | Valid PNG image (>500 KB, magic bytes `0x89 0x50 0x4E 0x47`) | Invariant: File must NEVER be deleted, replaced, modified, or regenerated | `public/images/filefixer_support_qr.png`, `tests/routes-and-design.test.ts` |
| 23.1 | Info | Editorial About Page | Explains FileFixer mission, zero-server architecture, local processing, and creator credit | Route `/about` | Responsive editorial page with feature cards, tech stack overview, creator badge | Fully responsive down to 320px; zero external tracking scripts | `src/app/about/page.tsx`, `ORIGINAL_REQUEST.md` |
| 23.2 | Info | Privacy Center & Architecture Flow | Visual 4-step diagram of zero-upload architecture, verification guide, offline capability | Route `/privacy` | Visual architecture pipeline (Your File → Your Browser → Local Processing → Your Download) | Displays 3 verification tests (Airplane mode, Network DevTools audit, Local storage clear) | `src/app/privacy/page.tsx`, `ORIGINAL_REQUEST.md` |
| 23.3 | Info | Terms of Service Page | Plain-language terms emphasizing client-side execution, absence of accounts, and backup responsibility | Route `/terms` | Editorial terms layout with effective date and cross-links | Accessible typography; WCAG AA contrast compliance | `src/app/terms/page.tsx`, `PROJECT.md` |
| 23.4 | Info | Brand System & Assets Page | Reference manual for design tokens, logo geometry, and downloadable SVG/PNG brand assets | Route `/branding` | Color palette cards with click-to-copy HEX, logo lockup displays, downloadable asset cards | Clipboard API failure caught gracefully; responsive asset download links | `src/app/branding/page.tsx`, `PROJECT.md` |
| 23.5 | Telemetry | IndexedDB Local History | Local database storing session processing telemetry and KPI calculations | Route `/history`, `src/lib/storage/history.ts` | KPI cards (Files Processed, Bandwidth Saved, Privacy Status), history table, clear all | Zero binary file blobs stored; only numeric metadata; handles empty DB with `EmptyState` | `src/app/history/page.tsx`, `src/lib/storage/history.ts`, `tests/privacy-invariant.test.ts` |

---

## 2. Edge Cases

| # | Feature | Input / Condition | Observed & Required Behavior |
|---|---------|-------------------|-----------------------------|
| E1 | Batch Processor | Empty file list (`files = []`) | Processing buttons disabled; clicking does nothing; no errors thrown. |
| E2 | Batch Processor | Non-image files dropped on Batch Studio | Rejected immediately with toast `"Invalid files: Please select image files (JPG, PNG, WebP) for the batch pipeline."`. |
| E3 | Batch Processor | Single item in pipeline fails (e.g. corrupt image) | Individual item records `status: "error"` and error string; remaining items continue processing; overall batch finishes with count of successes and failures. |
| E4 | Batch Processor | Partial retry with 2 failed and 5 succeeded items | Only the 2 failed items re-execute; 5 already-successful items are untouched in table; summary updates dynamically. |
| E5 | Batch Processor | Output size larger than original size | Savings percentage clamped to `0%` (or `"0.0%"` via `calcSavings`); prevents negative savings badges or NaN division. |
| E6 | Batch Rename | Pattern with single hash (`Item_#`) | Pads with 1 digit: `Item_1`, `Item_2` ... `Item_9`, `Item_10`. |
| E7 | Batch Rename | Pattern with 3 hashes (`Asset_###`) starting at 100 | Pads with 3 digits: `Asset_100`, `Asset_101` ... `Asset_109`. |
| E8 | Batch Rename | Pattern with zero hashes (`Static_File`) | Replaces pattern with static base name, appending extension without throwing. |
| E9 | Batch Rename | Filename with multiple dots (`backup.2026.final.png`) | Extension isolated correctly as `png`; base extracted as `backup.2026.final`. |
| E10 | Batch Rename | Filename with no extension (`README`) | Base retained as `README`; output does not produce trailing dangling dot (`.`). |
| E11 | Batch Rename | 1000+ character template or regex metacharacters (`.*+?^${}()|[]\`) | Processed as literal string in template replacement; does NOT trigger unsafe `RegExp` crash or catastrophic backtracking. |
| E12 | Privacy Cleaner | Image without EXIF or GPS data | Inspector reports `hasGps: false`, `exifAvailable: false`; UI shows green checkmark `"No Sensitive GPS or Camera Tags Detected"`. |
| E13 | Privacy Cleaner | Image with GPS latitude/longitude | Inspector flags `hasGps: true`; UI displays amber alert card with warning: `"• GPS Coordinates: Embedded geographical latitude & longitude"`. |
| E14 | Privacy Cleaner | PDF document input | Inspector reads PDF pages, Author, Title, Creator, Producer via `pdf-lib`; displays author tag in audit list. |
| E15 | DownloadDock | Pushing more than 20 items to `downloadQueue` | Store slices queue to first 20 items (`[fullItem, ...s.downloadQueue].slice(0, 20)`); queue size strictly bounded. |
| E16 | DownloadDock | 0-byte file pushed to download queue | `formatBytes(0)` returns `"0 B"`; `calcSavings(0, 0)` returns `"0%"`; no layout jitter or NaN. |
| E17 | DownloadDock | Coexistence with Mobile Bottom Nav | Dock positioned at `bottom-20` on mobile viewports (<768px) to clear the 64px MobileBottomNav; shifts to `bottom-6` on desktop. |
| E18 | Support Prompt | DownloadDock is visible on screen | `SupportPrompt` vertically shifts to `bottom-80` (or `bottom-72`) to prevent visual overlap with the floating dock. |
| E19 | Support Prompt | Triggered multiple times in same session | `sessionStorage.getItem("filefixer_support_prompt_shown")` prevents second prompt; returns silently. |
| E20 | Support Modal | QR image fails to load (`onError` triggered) | `imageFailed` state set to `true`; renders accessible fallback message: `"Unable to load the support QR code at this moment. The rest of FileFixer remains fully functional and private."`. |
| E21 | Modals (All) | Rapid Escape key presses or background clicks | State updates synchronously; cleans up event listeners and body scroll lock; restores focus to trigger element without focus loss. |
| E22 | Modals (All) | Keyboard Tab navigation inside modal | Intercepts Tab and Shift+Tab; loops focus strictly between first and last focusable elements in modal; prevents focus leaking into background page. |
| E23 | History Store | Clearing empty history or fetching with 0 records | Returns empty array `[]`; UI renders `EmptyState` component with `HardDrive` icon and description without crashing. |
| E24 | History Store | Browser in private/incognito mode or storage restricted | `getDB()` catches errors gracefully; falls back without crashing application; privacy guarantees intact. |

---

## 3. Deep Feature Specifications

### 3.1 Feature 19: Batch Queue & Workflows

#### A. Input Specifications
- **Files**: Array of browser `File` objects.
  - Allowed MIME types in `/batch`: `image/jpeg`, `image/png`, `image/webp`.
  - Allowed MIME types in `/workflows`: `image/*`.
- **Pipeline Configuration (`BatchPipelineConfig`)**:
  - `resizeEnabled`: boolean.
  - `targetWidth`: integer (e.g. 1920, min 100, max 8000).
  - `targetHeight`: integer (e.g. 1080, min 100, max 8000).
  - `maintainAspectRatio`: boolean (default `true`).
  - `convertEnabled`: boolean.
  - `targetFormat`: `"image/webp" | "image/jpeg" | "image/png"`.
  - `compressEnabled`: boolean.
  - `qualityPct`: integer (20 to 100, default 80–82).
  - `renamePattern`: string (e.g. `"asset_###"`).
  - `startNumber`: integer (default 1).

#### B. Output Specifications
- **Batch Results Table**:
  - Desktop view (≥768px): 12-column grid (Original File: 5 cols, Pipeline Output: 4 cols, Status & Action: 3 cols).
  - Mobile view (<768px): Stacked card layout with thumbnail, metrics, and touch-friendly buttons (≥40–44px).
- **Deliverables**:
  - Individual file download via `triggerDownload(blob, outputName)`.
  - Consolidated ZIP archive via `downloadAsZip(entries, "filefixer_batch_assets.zip")`.
  - Automatic push of each successful result to `fileStore.pushDownload()`.
  - Automatic telemetry logging to `filefixer_db` via `addHistoryRecord()`.

#### C. State Transitions
```
[IDLE / READY IN QUEUE]
       │
       ▼ (User clicks "Process All")
[RUNNING PIPELINE (Sequential Loop: i = 0 ... N-1)]
       │
       ├─ Item i: [PROCESSING] (RefreshCw spinner, active index highlighted)
       │       │
       │       ├─ Success ──► [DONE] (Output name, green size, savings badge, Save button)
       │       └─ Failure ──► [ERROR] (Red alert icon, error message string)
       │
       ▼ (Loop completes: currentIdx = -1)
[BATCH COMPLETE]
       │
       ├─ If failedCount > 0 ──► Show "Retry Failed" button
       └─ If completedCount > 0 ──► Show "Download ZIP" & "Download All Individually" cards
```

#### D. Accessibility & Typography
- Touch targets: All action buttons (`Add More`, `Retry Failed`, `Clear All`, `Save`, `Download ZIP`, stage toggles) measure at least 40–48px height.
- Tabular Numerals: Class `.tabular-nums` applied to:
  - File counters (`${completedCount} / ${failedCount}`).
  - Original and output byte sizes (`formatBytes(...)`).
  - Savings percentage (`${savingsPct.toFixed(0)}%`).
  - Live progress counter (`${progressPct}%`).

---

### 3.2 Feature 20: Batch Rename & Privacy Cleaner

#### A. Batch Rename Specifications (`/batch-rename`)
- **Inputs**:
  - Arbitrary files of any MIME type or extension.
  - `template`: string (e.g. `"Project_###"`, `"Photo_#"`).
  - `startingNumber`: integer (default 1).
  - `lowercase`: boolean.
  - `includeDate`: boolean (prepends `YYYY-MM-DD_`).
  - `replaceSpaces`: boolean (replaces whitespace with `spaceReplacement`, default `_`).
- **Live Preview Engine**:
  - Computes `previewList` dynamically via `useMemo` as user edits rules.
  - Displays original filename with arrow `→` and new filename in monospace primary color.
  - Preserves original extension unless explicitly altered.
- **Export**:
  - "Download All Renamed (ZIP)": Packages renamed files into `renamed_files.zip`.
  - Records history in IndexedDB.

#### B. Privacy Cleaner Specifications (`/privacy-cleaner`)
- **Inputs**: Image (`image/*`) or PDF document (`application/pdf`).
- **Inspection Engine (`inspectFile`)**:
  - Uses in-browser `exifr` with `{ tiff: true, exif: true, gps: true }`.
  - Uses in-browser `pdf-lib` for document properties (Pages, Title, Author, Subject, Creator, Producer, CreationDate).
  - Detects GPS coordinates (`latitude`, `longitude`).
  - Detects hardware fingerprinting (`Make`, `Model`, `ISO`, `FNumber`, `ExposureTime`).
- **Scrubbing Engine (`stripImageMetadata`)**:
  - Re-encodes image onto HTML5 Canvas without metadata segments.
  - Outputs `${base}_privacy_clean.${ext}`.
  - Pushes clean output to global `DownloadDock`.
- **Layout Metadata Wrapper**:
  - `src/app/privacy-cleaner/layout.tsx` must export complete `Metadata` with title, description, canonical url `/privacy-cleaner`, OpenGraph image, and Twitter cards.

---

### 3.3 Feature 21: Delivery System (Dock, Modal, Download Center)

#### A. Floating `DownloadDock`
- **Visibility**: Rendered if and only if `downloadQueue.length > 0`.
- **Z-Index & Position**: `z-40`, fixed `bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm`.
- **Queue Cap**: Strictly 20 items.
- **Item States**:
  - `preparing` / `processing` / `downloading`: `Loader2` spinning icon.
  - `ready` / `downloaded`: `CheckCircle2` green icon.
  - `error`: `AlertCircle` red icon.
- **Actions**:
  - "View All": Opens `DownloadCenterModal`.
  - Minimize: collapses queue list, shows header count.
  - Clear: wipes queue.
  - Re-download: triggers download of blob and updates delivered modal.

#### B. Celebratory `FileDeliveredModal`
- **Trigger**: `latestDeliveredFile !== null`.
- **Dialog Attributes**:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-label="File Delivered"`
- **Interaction Contract**:
  - Focus placed on close button within 30ms.
  - Tab key trapped in modal focus ring.
  - Escape key dismisses modal (`setLatestDeliveredFile(null)`).
  - Background backdrop click dismisses modal.
  - Body scroll locked (`overflow: hidden`) during display.
  - Focus restored to previous active element on close.
  - NON-BLOCKING: Does NOT interrupt active browser downloads or future modal triggers.
- **Stats Card**: 3-column before/after metrics with universal `.tabular-nums`.

#### C. Session Download Center (`DownloadCenterModal`)
- **Trigger**: `isDownloadCenterOpen === true`.
- **Capabilities**:
  - Aggregates all files in browser memory with valid Blobs.
  - Aggregate metrics: Total Original, Final Size, Bandwidth Saved (`.tabular-nums`).
  - "Download All as ZIP" via `downloadAsZip`.
  - Focus trap, Escape dismiss, and body scroll lock.

---

### 3.4 Feature 22: Voluntary Support Modal

#### A. Session-Throttled Prompt (`SupportPrompt`)
- **Trigger**: `triggerSupportPrompt()` called after successful processing.
- **Delay**: Exact 1200ms delay (`setTimeout(..., 1200)`).
- **Throttling Mechanism**:
  ```ts
  if (sessionStorage.getItem("filefixer_support_prompt_shown") === "true") return;
  sessionStorage.setItem("filefixer_support_prompt_shown", "true");
  setTimeout(() => set({ isSupportPromptVisible: true }), 1200);
  ```
- **Vertical Coordination**:
  - If `downloadQueue.length > 0`: `bottom-80 sm:bottom-72 md:bottom-6` (stacks cleanly above the floating dock).
  - If `downloadQueue.length === 0`: `bottom-20 sm:bottom-20 md:bottom-6`.
- **Dismissal**:
  - "Maybe later" button: calls `dismissSupportPrompt()`.
  - Escape key listener: calls `dismissSupportPrompt()`.
  - Close icon (≥44px touch target on mobile).

#### B. Voluntary Support Modal (`SupportModal`)
- **Dialog Attributes**:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-labelledby="support-dialog-title"`
  - `aria-describedby="support-dialog-desc"`
- **Focus & Keyboard Navigation**:
  - Focus trap loop handling Tab and Shift+Tab.
  - Initial focus on close button.
  - Escape key handler calls `closeSupportModal()`.
  - Body scroll lock during display.
  - Restores focus to previous active element.
- **Asset Integrity**:
  - Image path: `/images/filefixer_support_qr.png` (mapped to `filefixer/public/images/filefixer_support_qr.png`).
  - Alt text: `"FileFixer voluntary support UPI QR code"`.
  - Fallback handling: `onError` switches to fallback notice explaining the QR code could not be loaded while confirming all file utilities remain fully functional and private.
  - Physical file invariant: size > 500 KB, valid PNG header bytes (`0x89 0x50 0x4E 0x47`), NEVER modified.

---

### 3.5 Feature 23: Informational Pages & Telemetry

#### A. Informational Pages (`/about`, `/privacy`, `/terms`, `/branding`)
- **Typography & Styling**:
  - High contrast Swiss/editorial typography.
  - Font pairings: Geist Sans headings, Geist Mono code/metrics.
  - Container widths: `max-w-4xl` to `max-w-6xl`.
  - Spacing: `pb-safe`, `pt-safe`, consistent grid gaps (gap-4 to gap-8).
- **Architecture Flow (`/privacy`)**:
  - 4-step diagram: Step 01 (Your File) → Step 02 (Your Browser) → Step 03 (Local Processing) → Step 04 (Your Download).
  - Offline badge: "Works 100% Offline After Load" with `WifiOff` icon.
  - 3-part verification guide:
    1. Airplane Mode test.
    2. DevTools Network tab zero-egress inspection.
    3. Local Storage / IndexedDB clear test.
- **Creator & Legal**:
  - Creator credit: "Manish Meena" on `/about`.
  - Plain English terms on `/terms`: client-side execution, no accounts, user backup responsibility.
  - Complete brand guide on `/branding`: clickable color swatches, downloadable SVGs/PNGs.

#### B. Local History & Telemetry (`/history`, `src/lib/storage/history.ts`)
- **Database Schema**:
  - Database name: `filefixer_db`
  - Version: 1
  - Object store: `"history"` with keyPath `"id"`
  - Index: `"by-timestamp"` on field `"timestamp"`
- **Record Interface (`HistoryRecord`)**:
  - `id`: string (`hist-${Date.now()}-${random}`)
  - `filename`: string
  - `tool`: string
  - `originalSize`: number (bytes)
  - `outputSize`: number (bytes)
  - `savingsPct`: number (percentage, 1 decimal)
  - `timestamp`: number (epoch ms)
- **Privacy Guarantee**:
  - **Zero file blobs or binary streams are stored in IndexedDB**.
  - Only anonymous numerical metrics are recorded.
- **KPI Metrics**:
  - Files Processed: count of records (`.tabular-nums`).
  - Total Bandwidth Saved: sum of positive differences `(originalSize - outputSize)` formatted via `formatBytes()` with `.tabular-nums`.
  - Privacy Status: "Zero Cloud Persistence" badge.
- **Operations**:
  - `getAllHistory()`: retrieves records sorted newest-first.
  - `deleteHistoryRecord(id)`: removes single entry.
  - `clearAllHistory()`: purges all records from `"history"` store.

---

## 4. Invariant Verification Standards

| Invariant | Specification Requirement | Verification Rule & Method |
|---|---|---|
| **Zero Network Calls** | No remote API endpoints, no outbound file uploads | `src/app/api` must contain 0 files. No forbidden domains (`google-analytics`, `mixpanel`, `uploadcare`, `cloudinary`) anywhere in `src/`. Verified by `tests/privacy-invariant.test.ts`. |
| **Zero Server Uploads** | All processing is 100% on-device | Image engines use Canvas & Web Workers; PDF engines use `pdf-lib`; ZIP uses `jszip`; Metadata uses `exifr`. Verified by `tests/privacy-invariant.test.ts`. |
| **QR Code Asset Preservation** | Voluntary support QR code must never be overwritten or deleted | `public/images/filefixer_support_qr.png` must exist, have valid PNG magic bytes, and size > 500 KB. Verified by `tests/routes-and-design.test.ts`. |
| **Non-Blocking Delivery** | Delivery and support modals must never block workflow | Modals have accessible Escape listeners, close buttons, and backdrop clicks. File downloads occur independently of modals. Verified by `tests/adversarial-modal-accessibility.test.ts`. |
| **Touch Target Compliance** | All mobile interactive elements ≥44×44px (or ≥48px on nav) | Buttons enforce `min-h-[44px]` or `min-h-[48px]`, `touch-manipulation`. Verified by `tests/routes-and-design.test.ts`. |
| **Tabular Numerals** | All metrics, byte counts, and counters must use `.tabular-nums` | Universal `.tabular-nums` class applied across all byte counters, progress bars, and KPI figures to eliminate CLS. Verified by `tests/adversarial-modal-accessibility.test.ts`. |
| **33-Route Static Generation** | All 26 user pages + 7 metadata routes must compile cleanly | `npm run build` must succeed with exit code 0 and generate all 33 static routes without missing page errors. Verified by `tests/routes-and-design.test.ts`. |
| **WCAG AA Contrast** | Minimum 4.5:1 contrast in dark and light modes | `--primary-foreground`, `--success-foreground`, and `--muted-foreground` meet contrast standards against `--background`. Verified by `tests/adversarial-contrast-layout-challenger-m1r2.test.ts`. |
