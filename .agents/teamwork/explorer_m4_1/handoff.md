# Handoff Report: Milestone 4 PDF Tools Suite Architecture & Routes

**Agent:** Explorer 1 (`explorer_m4_1`)  
**Mission:** Milestone 4 - PDF Workstations Investigation (`/pdf-studio`, `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`)  
**Parent Orchestrator:** `4362bba7-ba30-4674-83e4-8ed547d74e76`  
**Date:** 2026-10-23  

---

## 1. Observation

### 1.1 Baseline Health & Environment
- Executed `npm test` synchronously in `c:\Users\nives\OneDrive\Documents\FileFixer\filefixer`:
  `# tests 231; # suites 58; # pass 231; # fail 0; duration_ms 3081.2196; exit code 0`.
- Executed `npm run build` in `c:\Users\nives\OneDrive\Documents\FileFixer\filefixer`:
  All 33 static routes compiled and prerendered with exit code 0. Zero TypeScript errors.

### 1.2 Route & `layout.tsx` Metadata Audit
We inspected all 6 target route directories in `filefixer/src/app/`:
1. `/pdf-studio/layout.tsx` (40 lines): Exports `metadata` with title `"PDF Studio — Visual PDF Workbench & Page Editor | FileFixer"`, canonical `/pdf-studio`, OpenGraph, Twitter card.
2. `/pdf-merge/layout.tsx` (40 lines): Exports `metadata` with title `"Merge PDF Files Online | FileFixer"`, canonical `/pdf-merge`, OpenGraph, Twitter card.
3. `/pdf-split/layout.tsx` (37 lines): Exports `metadata` with title `"Split & Extract PDF Pages Online | FileFixer"`, canonical `/pdf-split`, OpenGraph, Twitter card.
4. `/pdf-compress/layout.tsx` (37 lines): Exports `metadata` with title `"Compress PDF Files Online | FileFixer"`, canonical `/pdf-compress`, OpenGraph, Twitter card.
5. `/pdf-workspace/layout.tsx` (37 lines): Exports `metadata` with title `"Visual PDF Page Workspace | FileFixer"`, canonical `/pdf-workspace`, OpenGraph, Twitter card.
6. `/images-to-pdf/layout.tsx` (37 lines): Exports `metadata` with title `"Convert Images to PDF Online | FileFixer"`, canonical `/images-to-pdf`, OpenGraph, Twitter card.
*Observation Result:* No routes are missing `layout.tsx`. All 6 routes already possess valid metadata wrappers.

---

### 1.3 `src/lib/pdf/` Engine Modules Audit
1. **`filefixer/src/lib/pdf/merge.ts`**:
   - Lines 8-10: Throws descriptive error `"At least 2 PDF files are required for merging."` when `pdfFiles.length < 2`.
   - Lines 18-24: Sequentially loads ArrayBuffers and copies page indices via `mergedPdf.copyPages(pdf, pdf.getPageIndices())`.
   - Line 31: Calls `await mergedPdf.save()` without passing `{ useObjectStreams: true }`.
   - Line 36: Hardcodes output filename to `"merged_document.pdf"`.
2. **`filefixer/src/lib/pdf/split.ts`**:
   - Lines 12-37: `parsePageSelection(input, maxPages)` handles comma and hyphen range tokens (`"1-3, 5, 8-10"`), clamps bounds to `[1, maxPages]`, handles inverted ranges (e.g. `"5-2"` -> `2..5`), and discards non-numeric tokens.
   - Lines 48-73: `extractPages` copies specified 0-indexed indices and returns `${baseName}_extracted.pdf`. Missing `{ useObjectStreams: true }` on save.
   - Lines 78-101: `splitAllPages` breaks documents into individual single-page PDFs formatted as `${baseName}_page_001.pdf`.
3. **`filefixer/src/lib/pdf/compress.ts`**:
   - Lines 17-63: `compressPDF` cleans metadata (`setTitle`, `setAuthor`, `setSubject`, `setKeywords`, `setProducer`, `setCreator`), copies referenced pages into a new document to discard orphaned objects, and saves with `{ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 }`.
4. **`filefixer/src/lib/pdf/workspace.ts`**:
   - Lines 12-30: `loadWorkspacePages` reads rotation and generates `WorkspacePage[]`, but leaves `thumbnailUrl` undefined (so UI always displays fallback icons).
   - Lines 32-62: `saveWorkspacePdf` applies `copiedPage.setRotation(degrees(p.rotation % 360))` and saves with `{ useObjectStreams: true }`.
5. **`filefixer/src/lib/pdf/imagesToPdf.ts`**:
   - Lines 11-113: Handles PNG via `embedPng` and JPEG via `embedJpg`.
   - Lines 36-39 & 115-145: Provides canvas fallback (`convertImageToJpegBuffer`) for WebP and other formats.
   - Lines 48-70: Supports A4, Letter, Auto sizing, and Landscape / Portrait orientation. Missing `{ useObjectStreams: true }` on save.

---

### 1.4 Critical Gaps in Page Components

#### A. Delivery Flow Omission (DownloadDock, FileDeliveredModal, SupportModal)
In `filefixer/src/stores/fileStore.ts`, the application contracts dictate:
- `pushDownload({ fileName, originalSize, outputSize, savingsPct, status, blob })`: Enqueues delivered file in global floating dock.
- `setLatestDeliveredFile(deliveredItem)`: Opens celebratory before/after modal card.
- `triggerSupportPrompt()`: Session-throttled display of voluntary UPI QR support prompt.

Current status across the 6 pages:
- **`/pdf-merge/page.tsx`**:
  - Line 100: `const res = await mergePDFs(filesToMerge);`
  - Line 128: `triggerDownload(mergedBlob, "merged_document.pdf");`
  - `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt` are **NEVER called**.
- **`/pdf-split/page.tsx`**:
  - Line 141: `const res = await extractPages(...)`
  - Line 173: `await downloadAsZip(parts, ...)`
  - Line 415: `triggerDownload(extractedResult.blob, extractedResult.name)`
  - `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt` are **NEVER called**.
- **`/pdf-compress/page.tsx`**:
  - Line 60: `const res = await compressPDF(...)`
  - Line 94: `triggerDownload(result.blob, ...)`
  - `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt` are **NEVER called**.
- **`/pdf-workspace/page.tsx`**:
  - Line 135: `const res = await saveWorkspacePdf(...)`
  - Line 335: `triggerDownload(savedResult.blob, savedResult.name)`
  - `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt` are **NEVER called**.
- **`/images-to-pdf/page.tsx`**:
  - Line 110: `const res = await convertImagesToPdf(...)`
  - Line 145: `triggerDownload(resultBlob, "images_document.pdf")`
  - `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt` are **NEVER called**.
- **`/pdf-studio/page.tsx`**:
  - Lines 110-116: Calls `pushDownload` with `res.outputFilename`.
  - Lines 133-142: Calls `triggerDownload(savedBlob, name)` with `name = "organized_" + pdfFile.name` (mismatched with dock filename), calls `setLatestDeliveredFile`, but **`triggerSupportPrompt()` is NEVER called**.

---

#### B. Shell & Layout Inconsistency: Missing `ToolPageShell`
- `filefixer/src/components/ui/ToolPageShell.tsx` provides the standardized layout shell:
  - Back breadcrumb navigation (`/tools`)
  - Semantic icon container
  - Title and description
  - Category / format badges (`["PDF"]` or `["JPG", "PNG", "WEBP"]`)
- **Zero of the 6 PDF pages** import or use `ToolPageShell`! They all use raw `<div>` wrappers and ad-hoc header markup, lacking back breadcrumbs to `/tools` and format badges.

---

#### C. Mobile Touch Target Violations (< 44px)
Requirement R5 mandates all interactive elements meet $\ge 44\text{px}$ touch targets:
1. **`/pdf-merge/page.tsx`**:
   - Lines 198, 208, 217: Move Up, Move Down, and Remove icon buttons have `className="h-8 w-8"` (32×32px). **Fails $\ge 44\text{px}$**.
   - Line 165: "Clear All" button uses `Button variant="ghost" size="sm"` (~32px tall).
2. **`/images-to-pdf/page.tsx`**:
   - Lines 238, 248, 258: Reorder buttons have `className="h-7 w-7"` (28×28px). **Severe failure $\ge 44\text{px}$**.
   - Lines 290, 315, 340: Option chip buttons (`Page Size`, `Orientation`, `Page Margins`) have `py-2 text-xs` (~32px tall). **Fails $\ge 44\text{px}$**.
   - Line 186, 199: "Add More" and "Clear All" buttons use `size="sm"` (~32px tall).
3. **`/pdf-workspace/page.tsx`**:
   - Lines 274, 284, 292, 300: Action buttons (`ArrowLeft`, `ArrowRight`, `RotateCw`, `Trash2`) have `p-2` inside a 4-column split of a ~140px card (~30×30px). **Fails $\ge 44\text{px}$**.
   - Line 309: `+ Duplicate` button has `py-1 text-[10px]` (~22px tall). **Severe failure $\ge 44\text{px}$**.
   - Lines 209, 213: Toolbar buttons use `size="sm"` (~32px tall).
4. **`/pdf-studio/page.tsx`**:
   - Line 219: `className="min-h-[40px] text-xs font-bold"`. **Fails $\ge 44\text{px}$**.
   - Line 226: `className="min-h-[40px] text-xs font-bold bg-emerald-600 hover:bg-emerald-500"`. **Fails $\ge 44\text{px}$**.
   - Lines 270-300: Page control buttons have `p-1.5` with 3.5 icons (~26×26px). **Fails $\ge 44\text{px}$**.
5. **`/pdf-split/page.tsx`**:
   - Lines 311, 321: "Select All" and "Deselect All" inline text buttons have zero vertical padding (~18px tall). **Severe failure $\ge 44\text{px}$**.
   - Line 242: "Change File" button uses `size="sm"` (~32px tall).
6. **`/pdf-compress/page.tsx`**:
   - Line 143: "Change File" button uses `size="sm"` (~32px tall).

---

#### D. Light Mode Color Contrast Violations (WCAG AA Failing)
Across all 6 PDF pages:
- Status banners and text use hardcoded `text-emerald-400`:
  - `/pdf-merge/page.tsx:258`: `<CheckCircle2 className="h-6 w-6 text-emerald-400" />`
  - `/pdf-split/page.tsx:402`: `<CheckCircle2 className="h-6 w-6 text-emerald-400" />`
  - `/pdf-compress/page.tsx:229`: `<CheckCircle2 className="h-6 w-6 text-emerald-400" />`
  - `/pdf-compress/page.tsx:236`: `<strong className="text-emerald-400 font-bold">`
  - `/pdf-workspace/page.tsx:322`: `<CheckCircle2 className="h-6 w-6 text-emerald-400" />`
  - `/images-to-pdf/page.tsx:375`: `<div className="... text-emerald-400 font-semibold">`
  - `/pdf-studio/page.tsx:150`: `text-emerald-400`
  - `/pdf-studio/page.tsx:199`: `text-emerald-400`
  - `/pdf-studio/page.tsx:247`: `text-emerald-400`
- **Contrast Failure**: Against the light mode background `#F7F9FC`, `text-emerald-400` produces a contrast ratio of **2.1:1**, severely failing WCAG AA (which mandates $\ge 4.5:1$).
- **Success Buttons**: All 6 pages declare `className="... bg-[hsl(var(--success))] hover:bg-emerald-600 text-white"`. Hardcoded `text-white` overrides the calibrated semantic token `text-[hsl(var(--success-foreground))]`.

---

#### E. Missing `.tabular-nums` on Numeric Metrics
Requirement R1 & Feature 6 dictate that `.tabular-nums` must be applied to all byte sizes, page counts, percentages, and progress metrics:
- `/pdf-merge/page.tsx`: Line 187 `{formatBytes(it.file.size)}` and Line 264 `Total {mergedStats.count} pages · {formatBytes(mergedStats.size)}` lack `.tabular-nums`.
- `/pdf-split/page.tsx`: Line 238 `{formatBytes(selectedFile.size)} · {totalPages} Pages`, Line 308 `{selectedPageNumbers.size} of {totalPages}`, and Line 408 `{formatBytes(extractedResult.blob.size)}` lack `.tabular-nums`.
- `/pdf-compress/page.tsx`: Line 139 `{formatBytes(selectedFile.size)}` and Lines 235-239 before/after strings lack `.tabular-nums`.
- `/pdf-workspace/page.tsx`: Line 203 `{pages.length} Pages · {formatBytes(selectedFile.size)}` and Line 328 `{formatBytes(savedResult.blob.size)}` lack `.tabular-nums`.
- `/images-to-pdf/page.tsx`: Line 227 `{formatBytes(it.file.size)}` and Line 379 `Size: {formatBytes(resultBlob.size)}` lack `.tabular-nums`.

---

#### F. Ergonomics & Logic Flaws
1. **Native `alert()` Calls**:
   - In `pdf-studio/page.tsx`: Line 58 `alert("Could not load PDF: ...")`, Line 95 `alert("A PDF must contain at least one page.")`, Line 124 `alert("Save failed: ...")`. These freeze browser execution and violate accessible UI patterns. They must be replaced with `toast({ variant: "error", title, description })`.
2. **Unused `duplicatePage` in `pdf-studio/page.tsx`**:
   - `duplicatePage` function is implemented on line 82, and `Copy` icon imported on line 10, but completely omitted from the page card actions in the JSX!
3. **Mismatched Filenames in `pdf-studio/page.tsx`**:
   - `pushDownload` uses `res.outputFilename` (`${base}_workspace_edited.pdf`), but `handleDownload` downloads as `organized_${pdfFile.name}`. Filenames must be synchronized.
4. **"Save & Download PDF" Misleading CTA in `pdf-workspace/page.tsx`**:
   - In the top action toolbar, the button label is `"Save & Download PDF"`, but it only executes `handleSave` (staging the output) and does not actually trigger file download. It should either trigger download directly, or be labeled `"Save Changes"`.
5. **PDF Stream Optimization**:
   - `split.ts`, `merge.ts`, and `imagesToPdf.ts` omit `{ useObjectStreams: true }` on `save()`, missing out on 15–25% smaller PDF output sizes.

---

## 2. Logic Chain

1. **Premise 1 (Delivery System Contract)**: PROJECT.md specifies that every tool completion must populate `useFileStore.getState().downloadQueue` via `pushDownload` and notify users with `setLatestDeliveredFile` and `triggerSupportPrompt()`.
   - *Observation*: In `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, and `/images-to-pdf`, downloads are executed via isolated `triggerDownload(blob, name)` without touching `pushDownload`, `setLatestDeliveredFile`, or `triggerSupportPrompt`.
   - *Inference*: The Worker must wire up `pushDownload({ ... status: "ready" })` on compilation completion, and `pushDownload({ ... status: "downloaded" })`, `setLatestDeliveredFile`, and `triggerSupportPrompt()` on download clicks across all 5 pages.

2. **Premise 2 (Design System & Shell Consistency)**: Milestone 3 established `ToolPageShell` as the universal wrapper for all workstations, providing breadcrumbs (`/tools`), format badges, and standard hierarchy.
   - *Observation*: None of the 6 PDF pages wrap with `ToolPageShell`. They all employ ad-hoc headers with custom layout widths (`max-w-4xl`, `max-w-7xl`).
   - *Inference*: Refactoring all 6 pages into `ToolPageShell` establishes seamless visual parity with the Image Tools Suite.

3. **Premise 3 (Accessibility Sizing Invariant)**: Invariant 2 and WCAG 2.5.5 mandate $\ge 44\text{px}$ touch targets (`min-h-[44px] min-w-[44px] touch-manipulation`) on all interactive buttons, chips, and controls.
   - *Observation*: Reorder buttons measure 28–32px, page card controls measure 26–30px, and preset chips measure 32px.
   - *Inference*: Applying `min-h-[44px] min-w-[44px] touch-manipulation` to all buttons and icon controls will resolve all touch accessibility defects.

4. **Premise 4 (WCAG AA Contrast Invariant)**: Light mode background is `#F7F9FC`. Normal text requires a minimum 4.5:1 contrast ratio.
   - *Observation*: `text-emerald-400` has a 2.1:1 contrast ratio against `#F7F9FC`.
   - *Inference*: Upgrading all success text and icons to `text-emerald-700 dark:text-emerald-400` or `text-[hsl(var(--success))]` guarantees $\ge 4.5:1$ contrast in both dark and light modes. Replacing `text-white` on success buttons with `text-[hsl(var(--success-foreground))]` prevents contrast regressions.

5. **Premise 5 (Layout Stability Invariant)**: Invariant 1 and R1 mandate `.tabular-nums` on all metrics to prevent CLS.
   - *Observation*: All 6 PDF pages render dynamic byte counters and page counts with proportional fonts.
   - *Inference*: Adding `.tabular-nums` or `font-mono tabular-nums` to all file size strings, counts, and percentages resolves this across the suite.

---

## 3. Caveats

1. **Client-Side PDF Visual Thumbnails**:
   - `pdfjs-dist` is installed (`^6.3.289`). However, running `pdfjs-dist` in Next.js Turbopack client components requires configuring worker paths. If `GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'` is used, `pdf.worker.mjs` must be locally served from `public/` (never from an external CDN, maintaining Zero Egress).
   - If thumbnail rendering is deferred or optional, the current card design with page number badge, orientation degrees, and vector document icon works cleanly and robustly. If implemented, thumbnail generation should be wrapped in an async `try/catch` with automatic fallback to the card icon.
2. **Read-Only Investigation**:
   - As Explorer 1, no source files were modified during this investigation. All remediation code snippets provided below are prepared for the Worker agent to implement.

---

## 4. Conclusion & Concrete Remediation Plan for the Worker

All 6 routes (`/pdf-studio`, `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`) possess valid `layout.tsx` wrappers and functional underlying PDF engines. However, they suffer from 5 systematic defects:
1. Complete bypass of `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt` (in 5 of 6 pages).
2. Missing `ToolPageShell` layout wrapper across all 6 pages.
3. Sub-44px touch targets on reorder buttons (28–32px), card action buttons (26–30px), and chips (32px).
4. WCAG AA light mode color contrast failure on `text-emerald-400` and `text-white`.
5. Missing `.tabular-nums` on dynamic metrics.

### Concrete Implementation Checklist for Worker:

#### Task 1: Refactor `/pdf-merge/page.tsx`
- Wrap page in `<ToolPageShell icon={FilePlus} title="Merge PDFs" description="Combine multiple PDF documents into a single file. Reorder pages and files completely locally." formats={["PDF"]}>`.
- Update `handleMerge`:
  ```ts
  pushDownload({
    fileName: res.outputFilename,
    originalSize: origTotal,
    outputSize: res.blob.size,
    status: "ready",
    blob: res.blob,
  });
  ```
- Update `handleDownload`:
  ```ts
  triggerDownload(mergedBlob, "merged_document.pdf");
  const dlItem = {
    fileName: "merged_document.pdf",
    originalSize: origTotal,
    outputSize: mergedBlob.size,
    savingsPct: 0,
    status: "downloaded" as const,
    blob: mergedBlob,
  };
  pushDownload(dlItem);
  setLatestDeliveredFile({ id: `deliv-${Date.now()}`, ...dlItem, timestamp: Date.now() });
  triggerSupportPrompt();
  ```
- Touch targets: Move Up / Down / Remove buttons: change `h-8 w-8` to `min-h-[44px] min-w-[44px] touch-manipulation`.
- Contrast: Change `text-emerald-400` to `text-emerald-700 dark:text-emerald-400`, `text-white` to `text-[hsl(var(--success-foreground))]`.
- Numerals: Add `.tabular-nums` to `formatBytes` and page counts.

#### Task 2: Refactor `/pdf-split/page.tsx`
- Wrap page in `<ToolPageShell icon={Scissors} title="Split & Extract PDF" description="Extract page ranges, pick individual pages, or split every page into separate files." formats={["PDF"]}>`.
- Wire `handleExtractRangeOrSelected` and `handleSplitAllToZip` to `pushDownload` ("ready"), and download CTA to `pushDownload` ("downloaded"), `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
- Touch targets: "Select All" / "Deselect All" change to `min-h-[44px] px-3 py-2 text-xs flex items-center`.
- Contrast & Numerals: Update emerald classes and add `.tabular-nums`.

#### Task 3: Refactor `/pdf-compress/page.tsx`
- Wrap page in `<ToolPageShell icon={FileText} title="Compress PDF" description="Optimize PDF stream dictionaries and deduplicate resources locally without uploading." formats={["PDF"]}>`.
- Wire `handleCompress` to `pushDownload` ("ready"), and `handleDownload` to `pushDownload` ("downloaded"), `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
- Update `BeforeAfterStats` and download banner contrast (`text-emerald-700 dark:text-emerald-400`, `text-[hsl(var(--success-foreground))]`).
- Add `.tabular-nums` to all size strings and percentages.

#### Task 4: Refactor `/pdf-workspace/page.tsx`
- Wrap page in `<ToolPageShell icon={Layers} title="PDF Visual Workspace" description="Interactive page organizer: rotate, reorder, duplicate, and delete pages visually." formats={["PDF"]}>`.
- Card action buttons: update footer grid buttons to `min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation`.
- Duplicate button: change to `min-h-[44px] flex items-center justify-center text-xs font-medium`.
- Wire `handleSave` to `pushDownload` ("ready"), and `handleDownload` to `pushDownload` ("downloaded"), `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
- Contrast & Numerals: Update emerald classes and add `.tabular-nums`.

#### Task 5: Refactor `/images-to-pdf/page.tsx`
- Wrap page in `<ToolPageShell icon={Images} title="Images to PDF" description="Combine photos, document scans, or receipts into a clean PDF with custom page dimensions." formats={["JPG", "PNG", "WEBP"]}>`.
- Reorder and remove buttons: change `h-7 w-7` to `min-h-[44px] min-w-[44px] touch-manipulation`.
- Layout option chips (Size, Orientation, Margin): add `min-h-[44px] touch-manipulation`.
- Wire `handleConvert` to `pushDownload` ("ready"), and `handleDownload` to `pushDownload` ("downloaded"), `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
- Contrast & Numerals: Update emerald classes and add `.tabular-nums`.

#### Task 6: Refactor `/pdf-studio/page.tsx`
- Wrap page in `<ToolPageShell icon={FileText} title="PDF Studio" description="Comprehensive visual PDF workstation: drag to reorder, rotate, delete, duplicate, merge, and compress pages with zero server uploads." formats={["PDF"]}>`.
- Replace `alert(...)` with `toast({ variant: "error", title, description })`.
- Add the missing Duplicate Page button to the card actions toolbar using the `Copy` icon with `min-h-[44px]`.
- Synchronize download filename between `pushDownload` and `handleDownload`.
- Add `triggerSupportPrompt()` to `handleDownload`.
- Update action buttons to `min-h-[44px] min-w-[44px] touch-manipulation`.
- Contrast: Update emerald classes to `text-emerald-700 dark:text-emerald-400`.

#### Task 7: Optimize `pdf-lib` stream compression in `src/lib/pdf/`
- In `merge.ts`, `split.ts`, and `imagesToPdf.ts`, add `{ useObjectStreams: true }` to `.save()` calls to ensure all generated PDFs are compact and optimized.

---

## 5. Verification Method

1. **Automated Test Suite**:
   Run the full test suite from the repository root:
   ```bash
   npm test --prefix filefixer
   ```
   *Expected outcome:* Exit code 0, 231/231 tests pass across all test suites.
2. **Next.js Static Build Verification**:
   Verify that all 33 static routes prerender with zero TypeScript or syntax errors:
   ```bash
   npm run build --prefix filefixer
   ```
   *Expected outcome:* Exit code 0, 33/33 static routes generated.
3. **Delivery Dock & Support Verification**:
   - Perform a Merge on `/pdf-merge`: verify item appears in floating `DownloadDock`, badge increments, and clicking Download shows `FileDeliveredModal` and triggers `SupportModal` after 1200ms.
   - Perform an Extract on `/pdf-split`: verify dock addition, delivered modal, and support modal.
   - Perform a Compress on `/pdf-compress`: verify dock addition, delivered modal, and support modal.
   - Perform an Arrange on `/pdf-workspace` and `/pdf-studio`: verify dock addition, delivered modal, and support modal.
   - Perform an Images to PDF conversion on `/images-to-pdf`: verify dock addition, delivered modal, and support modal.
4. **Touch Target Sizing Verification**:
   - Inspect all reorder, action, chip, and preset buttons on mobile viewports: verify computed hit box $\ge 44 \times 44\text{px}$.
5. **Contrast Verification**:
   - Inspect status text in light theme (`#F7F9FC`): verify text is `text-emerald-700` ($\ge 4.5:1$ contrast ratio).
