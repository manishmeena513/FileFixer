# Milestone 4 Investigation Report: PDF Libraries & Workstations UI

**Subagent**: `explorer_m4_2` (Explorer 2 - PDF Libraries & Workstations UI)  
**Date**: 2026-10-23  
**Status**: Investigation Complete  
**Scope**: `filefixer/src/lib/pdf/`, PDF routes (`/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, `/pdf-studio`), UI ergonomics, touch targets (≥44px), `.tabular-nums`, privacy verification, and test coverage gaps.

---

## 1. Observations

### 1.1 On-Device Privacy & Memory Architecture
Direct audit across all files in `filefixer/src/lib/pdf/`:
- `compress.ts`: Uses `fileToArrayBuffer(file)` (line 22) -> `PDFDocument.load(arrayBuffer, { ignoreEncryption: true })` (line 23) -> `newPdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 })` (lines 46-50) -> in-memory `Blob([compressedBytes])` (line 52).
- `workspace.ts`: `loadWorkspacePages` loads `arrayBuffer` (lines 13-14); `saveWorkspacePdf` creates `PDFDocument.create()` (line 42), copies pages via `newPdf.copyPages(sourcePdf, [p.originalPageIndex])` (line 47), and returns in-memory `Blob` (line 55).
- `merge.ts`: Loops over `pdfFiles`, loads each into in-memory `PDFDocument` (lines 17-18), copies into `mergedPdf` (line 19), saves to in-memory `Blob` (line 32).
- `split.ts`: Extracts selected pages or splits all pages into individual `Blob` instances completely in memory (lines 66, 92).
- `imagesToPdf.ts`: Embeds PNG (`embedPng`) and JPEG (`embedJpg`) into `PDFDocument` directly from in-memory `ArrayBuffer` (lines 30, 34); converts WebP/other formats locally via `document.createElement("canvas")` and `canvas.toBlob()` (lines 121-137).
- **Outbound network audit**: Ripgrep search across `src/lib/pdf/` and all PDF route directories in `src/app/` for `fetch(`, `XMLHttpRequest`, `axios`, `http:`, and `https:` returned **0 matches**. Zero server endpoints exist in `src/app/api/`.

### 1.2 Visual Page Manipulation Features
- **Rotation**: Supported in `workspace.ts:50` (`copiedPage.setRotation(degrees(p.rotation % 360))`) and in `pdf-workspace/page.tsx:91` and `pdf-studio/page.tsx:77` via `(copy[index].rotation + 90) % 360` (cycling 0°, 90°, 180°, 270°). Visual previews apply CSS `transform: rotate(${p.rotation}deg)`.
- **Reordering**: Supported in `pdf-workspace/page.tsx:79-87` (`movePage(index, "left" | "right")`) and `pdf-studio/page.tsx:65-73`. Up/down reordering is supported in `pdf-merge/page.tsx:71-79` and `images-to-pdf/page.tsx:78-86`.
  - *Observation*: There is **no drag-and-drop reordering** implemented, despite `ORIGINAL_REQUEST.md:83` ("drag-and-drop page reordering") and `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` being installed in `package.json:13-15`.
- **Deletion**: Supported in `pdf-workspace/page.tsx:115` (`deletePage`) and `pdf-studio/page.tsx:93` (`removePage`), enforcing minimum 1 page guard (`pages.length <= 1`).
- **Duplication**: Supported in `pdf-workspace/page.tsx:96-113` (`duplicatePage`) and `pdf-studio/page.tsx:82-91`. `saveWorkspacePdf` correctly supports duplicate indices (`copyPages` can duplicate the same `originalPageIndex` repeatedly).
- **Page Extraction**:
  - Fully implemented in `pdf-split/page.tsx:118-164` (custom range token parsing like `"1-3, 5"` or interactive page grid).
  - *Observation*: In `pdf-workspace/page.tsx` and `pdf-studio/page.tsx`, there is **no page extraction button** (e.g., "Extract selected pages" or "Save this page as separate PDF"). In `pdf-studio/page.tsx:15`, `Scissors` is imported but never rendered in the JSX.
- **Page Thumbnails**:
  - `WorkspacePage` interface in `workspace.ts:9` defines optional `thumbnailUrl?: string`.
  - In `loadWorkspacePages` (`workspace.ts:18-27`), `thumbnailUrl` is never assigned.
  - In both `pdf-workspace/page.tsx:260` and `pdf-studio/page.tsx:264`, the UI always renders a fallback generic `<FileText>` icon rather than actual rendered page thumbnails.

### 1.3 PDF Compression & Metadata Stripping
- **Stream optimization**: In `compress.ts:37-50`, creates a clean `newPdf = await PDFDocument.create()`, copies pages from `pdfDoc`, and saves with `useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50`.
- **Metadata stripping bug observed**:
  In `compress.ts:27-34`:
  ```typescript
  if (options.removeMetadata || options.level === "smaller") {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
  }
  ```
  However, on line 37: `const newPdf = await PDFDocument.create();`. A newly created `PDFDocument` has blank/empty metadata by default. Lines 39-43 copy only pages (`newPdf.copyPages(pdfDoc, pageIndices)`). `newPdf` **never copies metadata from `pdfDoc`** when `options.removeMetadata` is `false`. Thus, metadata is stripped unconditionally even when the user unchecks the option!
- **Tabular Numerals & Reporting in `pdf-compress/page.tsx`**:
  - Line 139: `{formatBytes(selectedFile.size)}` lacks `.tabular-nums`.
  - Lines 235-239:
    ```tsx
    {formatBytes(result.originalSize)} →{" "}
    <strong className="text-emerald-400 font-bold">
      {formatBytes(result.outputSize)}
    </strong>{" "}
    ({result.savingsPct.toFixed(1)}% smaller · {result.pageCount} pages)
    ```
    This result summary lacks `.tabular-nums` formatting.
  - While `BeforeAfterStats` component (lines 51, 69, 81, 96 in `BeforeAfter.tsx`) has `.tabular-nums`, the accompanying status card in `pdf-compress` does not.
  - Negative savings / 0% savings: If `outputSize >= originalSize` (common in tiny PDFs with object stream overhead), `savingsPct` clamps to 0, but UI displays `0.0% smaller` without clarifying that the document was already optimal.

### 1.4 UI Ergonomics & Touch Targets (`min-h-[44px] min-w-[44px]`)
Direct inspection of interactive elements across all 6 PDF routes identified multiple sub-44px targets:
1. `pdf-merge/page.tsx`:
   - Lines 198, 209, 217: Move Up (`ArrowUp`), Move Down (`ArrowDown`), and Remove (`Trash2`) buttons are styled with `className="h-8 w-8"` (32px x 32px), violating the ≥44px requirement.
   - Line 165: `<Button variant="ghost" size="sm" onClick={() => setItems([])}>Clear All</Button>` is only 32px tall on non-mobile viewports without explicit min-h-44px.
2. `pdf-workspace/page.tsx`:
   - Lines 269-303: Action footer buttons (`ArrowLeft`, `ArrowRight`, `RotateCw`, `Trash2`) are raw `<button>` tags with `className="flex items-center justify-center p-2 ..."` (~30px x 30px), violating the ≥44px requirement.
   - Line 309: `+ Duplicate` button has `className="w-full border-t border-[hsl(var(--border))] py-1 text-[10px] ..."` (~22px height), violating the ≥44px requirement.
3. `pdf-studio/page.tsx`:
   - Lines 219, 226: Save & Download buttons explicitly hardcode `className="min-h-[40px] text-xs font-bold"`, failing the 44px minimum.
   - Lines 270-300: Action buttons (`ArrowLeft`, `ArrowRight`, `RotateCw`, `Trash2`) have `className="p-1.5 ..."` (~26px x 26px), violating the ≥44px requirement.
   - Lines 58, 95, 124: Uses native browser `alert()` dialogs (`alert("A PDF must contain at least one page.")`) instead of accessible toasts.
4. `pdf-split/page.tsx`:
   - Line 276: Page range `<input type="text">` has `py-2 text-sm` (~36px height), failing `min-h-[44px]`.
   - Lines 311, 320: `Select All` and `Deselect All` are unpadded raw text buttons (~16px height), failing `min-h-[44px]`.
5. `images-to-pdf/page.tsx`:
   - Lines 238, 249, 257: Move Up, Move Down, and Remove buttons have `className="h-7 w-7"` (28px x 28px), violating the ≥44px requirement.
   - Lines 290, 314, 337: Layout presets (`A4`, `US Letter`, `Auto Fit`, `Portrait`, `Landscape`, margins) have `className="py-2 ..."` (~32px height), failing `min-h-[44px]`.

### 1.5 Shared Store & Delivery System Integration
- Contract from `PROJECT.md:70-79`:
  - `pushDownload(item: DownloadItem)` pushes the delivered file to the global `DownloadDock`, updates dock badge count, and stores telemetry in IndexedDB.
  - `triggerSupportPrompt()` throttles voluntary UPI QR prompt by session.
- *Observation*:
  - `pdf-studio/page.tsx:110` calls `pushDownload`.
  - `pdf-merge/page.tsx`, `pdf-split/page.tsx`, `pdf-compress/page.tsx`, `pdf-workspace/page.tsx`, and `images-to-pdf/page.tsx` **only call `addHistoryRecord` and `triggerDownload` directly**. They fail to call `pushDownload` or `triggerSupportPrompt`, leaving the floating `DownloadDock` disconnected from these 5 PDF workstations.

### 1.6 Current Test Suites & Coverage Gaps
- `npm test` runs 14 test suites with 231 tests passing in 2.99s.
- Existing PDF coverage in `filefixer/tests/`:
  - `tier1-feature-coverage.test.ts:148`: `parsePageSelection` with `"1-3, 5, 8-10"`.
  - `tier1-feature-coverage.test.ts:154`: `mergePDFs` error rejection on `< 2` files.
  - `tier2-boundary-corner.test.ts:125-148`: `parsePageSelection` negative bounds, inverted ranges (`"5-2"`), malformed tokens, and maxPages clamping.
  - `tier3-cross-feature.test.ts`: Store queue verification after mock range split.
  - `tier4-application-scenarios.test.ts:87, 126`: Scenario 2 (page count arithmetic) and Scenario 3 (range parsing).
- **Critical missing test coverage**:
  1. `compressPDF`: Zero tests validating stream optimization, metadata stripping when toggle is on, metadata retention when toggle is off, and savings percentage calculation.
  2. `saveWorkspacePdf` & `loadWorkspacePages`: Zero tests validating page count, rotation (90°/180°/270°), duplicate page preservation, reordering, and empty page error.
  3. `convertImagesToPdf`: Zero tests validating multi-image compilation, A4/Letter dimensions, auto-orientation, and 0-image rejection error.
  4. `splitAllPages` & `extractPages`: Zero tests executing page extraction or ZIP generation on multi-page PDF documents.
  5. `mergePDFs`: Zero operational tests validating that combining 2 real PDF documents creates a combined document with the sum of their pages.
  6. UI regression tests for `min-h-[44px]` touch targets and `.tabular-nums` formatting across PDF pages.

---

## 2. Logic Chain

1. **Premise 1**: FileFixer's foundational architectural invariant is 100% on-device processing with zero network calls and zero data egress.
   - *Supporting Evidence*: Direct inspection of `src/lib/pdf/` and `src/app/pdf-*/` confirmed all byte transformations use in-memory `ArrayBuffer`, `Uint8Array`, and canvas APIs with 0 external network calls.
   - *Conclusion 1*: The PDF processing architecture preserves the on-device privacy guarantee without regression.

2. **Premise 2**: A comprehensive PDF suite must provide reliable visual page reordering, rotation (90/180/270), duplication, deletion, and extraction.
   - *Supporting Evidence*:
     - Rotation (90° increments) and duplication are functionally sound in `workspace.ts`.
     - Reordering currently relies exclusively on directional click buttons; drag-and-drop reordering is absent despite installed libraries (`@dnd-kit`).
     - Page extraction is present in `/pdf-split` but absent in `/pdf-workspace` and `/pdf-studio` (where `Scissors` is imported but unused).
   - *Conclusion 2*: Visual manipulation needs extraction buttons in the workspace and accessible reordering improvements.

3. **Premise 3**: PDF compression must allow users to choose between balanced optimization (retaining author metadata) and aggressive optimization (stripping author metadata), and report compression metrics using `.tabular-nums`.
   - *Supporting Evidence*:
     - In `compress.ts`, creating `newPdf = await PDFDocument.create()` fails to copy metadata from `pdfDoc` when `removeMetadata` is false, causing unintentional metadata loss.
     - Several metrics in `pdf-compress/page.tsx` and other PDF pages lack `.tabular-nums`.
   - *Conclusion 3*: `compress.ts` must conditionally copy metadata to `newPdf` when `!options.removeMetadata && options.level !== "smaller"`, and all numeric displays must use `.tabular-nums`.

4. **Premise 4**: Project acceptance criteria (R5 & Invariant 2) mandate minimum touch target sizes (`min-h-[44px] min-w-[44px]`) on interactive elements across all viewports.
   - *Supporting Evidence*: Multiple buttons across all 6 PDF routes explicitly hardcode `h-8 w-8` (32px), `h-7 w-7` (28px), `min-h-[40px]`, or raw `p-1.5`/`p-2` padding, creating WCAG 2.5.5 touch target violations.
   - *Conclusion 4*: All interactive icon buttons, inputs, tabs, and preset selectors must be standardized with `min-h-[44px] min-w-[44px]` or padded hit areas.

5. **Premise 5**: The delivery architecture in `PROJECT.md` specifies that processed files should populate the global `DownloadDock` via `pushDownload()` and trigger the non-blocking voluntary support prompt via `triggerSupportPrompt()`.
   - *Supporting Evidence*: 5 out of 6 PDF tool pages bypass `pushDownload()` and `triggerSupportPrompt()`, resulting in an inconsistent user delivery experience.
   - *Conclusion 5*: All PDF tool pages must invoke `pushDownload()` and `triggerSupportPrompt()` upon completion.

---

## 3. Caveats

1. **PDF Thumbnail Generation**: `pdf-lib` does not contain a built-in rasterizer to render PDF pages into PNG/JPEG images. While `pdfjs-dist` is installed in `package.json`, loading its worker script in Next.js Turbopack must avoid remote CDN requests to prevent violating the zero-network-call privacy invariant. If worker bundling introduces SSR or Turbopack build complexity, high-fidelity SVG/Canvas wireframe page cards (showing page number, rotation badge, aspect ratio, and document metadata) provide an immediate, 100% reliable, zero-latency visual representation without bundle bloat.
2. **PDF Encryption**: Password-protected/encrypted PDFs are loaded with `{ ignoreEncryption: true }` in `pdf-lib`. If a user uploads an encrypted PDF with user/owner passwords, `pdf-lib` may throw an encryption error. An informative toast message is recommended for password-protected documents.
3. **No Caveats on Privacy**: 100% on-device execution is completely verified.

---

## 4. Conclusion & Actionable Recommendations for Worker

### Priority 1: Fix Metadata Preservation Bug in `compress.ts`
In `filefixer/src/lib/pdf/compress.ts`:
When creating `newPdf`, explicitly copy metadata when `removeMetadata` is `false`:
```typescript
if (!options.removeMetadata && options.level !== "smaller") {
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const keywords = pdfDoc.getKeywords();
  const producer = pdfDoc.getProducer();
  const creator = pdfDoc.getCreator();
  if (title) newPdf.setTitle(title);
  if (author) newPdf.setAuthor(author);
  if (subject) newPdf.setSubject(subject);
  if (keywords && keywords.length > 0) newPdf.setKeywords(keywords);
  if (producer) newPdf.setProducer(producer);
  if (creator) newPdf.setCreator(creator);
}
```

### Priority 2: Standardize Touch Targets to ≥44px Across All 6 PDF Pages
- **`pdf-merge/page.tsx`**: Replace `h-8 w-8` icon buttons on lines 198, 209, 217 with `min-h-[44px] min-w-[44px]` (e.g. `size="icon" className="h-11 w-11"`).
- **`pdf-workspace/page.tsx`**: Update page card action buttons (lines 269-303) and duplicate button (line 309) to ensure `min-h-[44px] min-w-[44px]` interactive bounding boxes.
- **`pdf-studio/page.tsx`**: Change `min-h-[40px]` to `min-h-[44px]` (lines 219, 226) and enlarge page card action buttons (lines 270-300). Replace `alert(...)` calls with `toast(...)`.
- **`pdf-split/page.tsx`**: Update range input (line 276) with `min-h-[44px]` and add `min-h-[44px] px-3 py-2.5 inline-flex items-center` to `Select All` / `Deselect All` buttons.
- **`images-to-pdf/page.tsx`**: Replace `h-7 w-7` icon buttons (lines 238, 249, 257) with `min-h-[44px] min-w-[44px]` and enlarge layout presets to `min-h-[44px]`.

### Priority 3: Enforce Tabular Numerals (`.tabular-nums`) on All Metrics
Wrap all file sizes (`formatBytes(...)`), page counts, percentages, and numeric index badges in `.tabular-nums`:
- `pdf-compress/page.tsx`: Lines 139, 235-239.
- `pdf-merge/page.tsx`: Lines 163, 179, 187, 264.
- `pdf-split/page.tsx`: Lines 238, 280, 308, 345, 365, 390, 408.
- `pdf-workspace/page.tsx`: Lines 203, 244, 247, 262, 328.
- `images-to-pdf/page.tsx`: Lines 182, 214, 227, 366, 379.
- `pdf-studio/page.tsx`: Lines 211, 244, 248.

### Priority 4: Integrate `pushDownload` & `triggerSupportPrompt` Across All PDF Pages
In `pdf-merge`, `pdf-split`, `pdf-compress`, `pdf-workspace`, and `images-to-pdf`:
Import `pushDownload` and `triggerSupportPrompt` from `useFileStore`:
```typescript
const { pushDownload, triggerSupportPrompt, setLatestDeliveredFile } = useFileStore();

// On successful processing/download:
pushDownload({
  fileName: outputFilename,
  originalSize: inputSize,
  outputSize: outputBlob.size,
  status: "downloaded",
  blob: outputBlob,
});
triggerSupportPrompt();
```

### Priority 5: Add Page Extraction Feature in `pdf-workspace` & `pdf-studio`
Add an "Extract" action button on each page card or a selection toolbar in `/pdf-workspace` and `/pdf-studio` allowing users to directly download the current page or selected pages as a separate PDF using `extractPages` from `@/lib/pdf/split`.

### Priority 6: Expand PDF Test Suite Coverage in `filefixer/tests/`
Create a dedicated `tests/m4-pdf-workstations.test.ts` or add to `tier1-feature-coverage.test.ts` covering:
1. `compressPDF` (object streams, metadata removal vs retention, savings calculations).
2. `saveWorkspacePdf` / `loadWorkspacePages` (rotations 90/180/270, duplicate page copy, reordering).
3. `convertImagesToPdf` (multi-image compilation, A4 & Letter dimensions, auto-orientation).
4. `splitAllPages` & `extractPages` (single-page extractions and ZIP bundling).
5. `mergePDFs` (multi-document merge combining page count correctly).
6. DOM/Component touch target audits checking `min-h-[44px]` on all PDF action buttons.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Baseline Tests Pass**:
   ```powershell
   cd filefixer
   npm test
   ```
   *Expected*: 231 tests pass across 14 test suites with exit code 0.

2. **Verify Static Route Generation**:
   ```powershell
   cd filefixer
   npm run build
   ```
   *Expected*: All 33 static routes prerender successfully with exit code 0.

3. **Verify Zero Egress Invariant**:
   Inspect `filefixer/src/lib/pdf/` and `filefixer/src/app/api/`. No external fetch calls or server API routes exist.

4. **Invalidation Conditions**:
   - If `compressPDF` with `removeMetadata: false` does not retain original metadata, the metadata preservation bug is confirmed.
   - If any interactive button or input has computed height < 44px on mobile or desktop, the touch target violation is confirmed.
