# Milestone 4 (PDF Tools Suite) Specification Mining Report

**Subagent**: `spec_miner_m4` (Specification Miner - PDF Specifications & Contracts)  
**Date**: 2026-10-23T17:15:00Z  
**Target Milestone**: Milestone 4 (PDF Tools Suite — Features 15, 16, 17, 18)  
**Authoritative Sources**:
- `ORIGINAL_REQUEST.md` (R3, R5, AC)
- `PROJECT.md` (Features 15, 16, 17, 18, Interface Contracts, Code Layout)
- `TEST_INFRA.md` & `TEST_READY.md` (Node.js 22 test runner, 4-tier matrix, invariants)
- Reference Engine Implementations (`src/lib/pdf/compress.ts`, `imagesToPdf.ts`, `merge.ts`, `split.ts`, `workspace.ts`)
- Application Route Implementations (`src/app/pdf-studio/`, `pdf-merge/`, `pdf-split/`, `pdf-compress/`, `pdf-workspace/`, `images-to-pdf/`)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Workstation Hub | `/pdf-studio` (Feature 15) | Unified visual workbench combining multi-page inspection, reorder, rotate, duplicate, delete, merge, compress, and selective extract with zero server uploads | Single/multiple PDF files (`File[]`), user page operations (reorder, rotate 90°, duplicate, delete), export triggers | Downloadable single PDF (`organized_${filename}`), `DownloadDock` queue registration (`pushDownload`), telemetry history entry | Alerts if file load fails; disables delete when `pages.length <= 1` ("A PDF must contain at least one page"); alerts if save fails | `PROJECT.md` § Feature 15; `ORIGINAL_REQUEST.md` R3; `src/app/pdf-studio/page.tsx` |
| 2 | Metadata Wrapper | `/pdf-studio/layout.tsx` | Dedicated Next.js metadata wrapper exporting OpenGraph and Twitter cards | Next.js layout `children` prop | Standard HTML `<head>` metadata (`title`, `description`, `canonical: /pdf-studio`, `openGraph`, `twitter`) | Fallback to root metadata if layout missing | `PROJECT.md` § Feature 15; `src/app/pdf-studio/layout.tsx` |
| 3 | Document Merging | `/pdf-merge` (Feature 16) | Aggregates 2 or more separate PDF documents into a unified output document in custom sequential order | Array of >=2 PDF files, reorder operations (drag/drop or up/down), per-file page range inclusion | Consolidated PDF document (`merged_document.pdf`), total page count, combined file size, download dock item | Throws descriptive error if `< 2` files provided ("At least 2 PDF files are required for merging."); rejects non-PDFs | `PROJECT.md` § Feature 16; `src/lib/pdf/merge.ts`; `src/app/pdf-merge/page.tsx` |
| 4 | Range Inclusion | `/pdf-merge` Page Subsets | Granular page inclusion allowing users to merge specific pages or ranges from each uploaded document | String range per file (e.g. Doc 1: "all", Doc 2: "1-3", Doc 3: "5, 8-10") | Subset pages copied into combined PDF document | Clamps to valid page boundaries (1..maxPages); discards non-numeric tokens | `DISPATCH.md` ("page range inclusion"); `src/lib/pdf/split.ts` |
| 5 | Document Splitting | `/pdf-split` Range Mode (Feature 16) | Tokenized range parsing and extraction of sub-documents | Single PDF file, range string (e.g. `"1-3, 5, 8-10"`, `"2, 4-6"`) | Extracted PDF (`${baseName}_extracted.pdf`) containing the requested page indices | Discards invalid tokens; clamps out-of-range bounds; displays error toast if no valid pages resolve | `PROJECT.md` § Feature 16; `src/lib/pdf/split.ts`; `src/app/pdf-split/page.tsx` |
| 6 | Interactive Split | `/pdf-split` Interactive Mode | Visual grid of selectable page cards enabling custom multi-page extraction | Single PDF file, set of toggled page numbers (`Set<number>`), Select All / Deselect All | Extracted PDF containing toggled pages in ascending sequence | Button disabled when `selectedPageNumbers.size === 0` | `ORIGINAL_REQUEST.md` R3; `src/app/pdf-split/page.tsx` |
| 7 | Full Document Split | `/pdf-split` Split All | Deconstructs every individual page into its own standalone PDF bundled in a ZIP archive | Single PDF file | ZIP archive (`${baseName}_all_pages.zip`) containing zero-padded single-page PDFs (`${baseName}_page_001.pdf` ... `_00N.pdf`) | Throws if PDF has 0 pages or cannot be loaded | `PROJECT.md` § Feature 16; `src/lib/pdf/split.ts`; `src/lib/zip.ts` |
| 8 | Stream Optimization | `/pdf-compress` Engine (Feature 17) | Compresses PDF streams, strips unreferenced objects, and rebuilds cross-reference tables | Single PDF `File`, `PdfCompressOptions` (`level`, `removeMetadata`) | `PdfCompressResult` (`blob`, `originalSize`, `outputSize`, `pageCount`, `savingsPct`) | Throws if PDF encrypted or corrupt; clamps negative savings to 0% | `PROJECT.md` § Feature 17; `src/lib/pdf/compress.ts` |
| 9 | Compression Presets | `/pdf-compress` Profiles | Preset compression tiers: Extreme (Maximum Savings), Recommended (Balanced), and Less (Light) | User preset selection: `"smaller"` (Extreme), `"balanced"` (Recommended), `"custom"` / `"light"` (Less) | Configured `useObjectStreams`, `removeMetadata`, and dictionary rebuilding passes | Invalid preset defaults safely to `"balanced"` | `DISPATCH.md` ("Presets (e.g. Extreme, Recommended, Less)"); `src/app/pdf-compress/page.tsx` |
| 10 | Metadata Sanitization | `/pdf-compress` Metadata Strip | Strips author, title, producer, creator, subject, and keywords metadata from PDF stream dictionary | Boolean toggle `stripMeta` | PDF document with blanked author/producer/creator tags | Safe no-op if document has no existing metadata | `ORIGINAL_REQUEST.md` R3; `src/lib/pdf/compress.ts` |
| 11 | Before/After Metrics | `/pdf-compress` Metrics Display | Real-time byte comparison and savings percentage display with strict tabular figures | Original byte count, output byte count, page count | `<BeforeAfterStats />` and result card displaying `.tabular-nums` byte sizes and savings percentage | Protected against division-by-zero on 0-byte input files via `calcSavings` | `ORIGINAL_REQUEST.md` AC; `src/components/results/BeforeAfter.tsx` |
| 12 | Visual Page Grid | `/pdf-workspace` Page Grid (Feature 17) | Interactive visual grid displaying document pages with page numbering and rotation indicators | Single PDF `File` | Grid of `WorkspacePage[]` items displaying `#idx`, original page number, and orientation | Loading spinner during page discovery; fallback icon if thumbnail unavailable | `PROJECT.md` § Feature 17; `src/app/pdf-workspace/page.tsx` |
| 13 | Page Reordering | `/pdf-workspace` Reorder | Reorder pages via drag-and-drop or directional navigation buttons | Page index and target direction (`"left"` / `"right"`) or drag drop event | Reordered `WorkspacePage[]` array | Left disabled at index 0; right disabled at `pages.length - 1` | `ORIGINAL_REQUEST.md` R3; `src/lib/pdf/workspace.ts` |
| 14 | Bi-directional Rotation | `/pdf-workspace` Page Rotation | Rotate individual pages clockwise (90°) and counterclockwise (-90° / 270°) | Target page index, rotation step (+90° / -90°) | Updated rotation value `(rotation + delta) % 360` with animated CSS preview | Rotation normalized to [0, 90, 180, 270] | `DISPATCH.md` ("rotate clockwise/counterclockwise"); `src/lib/pdf/workspace.ts` |
| 15 | Page Duplication | `/pdf-workspace` Page Clone | Clones any selected page and inserts it adjacent to current position | Target page index | New `WorkspacePage` inserted at `index + 1` with unique timestamp/hash ID | Preserves original source page index and current rotation | `src/app/pdf-workspace/page.tsx` line 96 |
| 16 | Page Deletion Guard | `/pdf-workspace` Page Delete | Deletes a page from the document while maintaining document integrity | Target page index | Modified `WorkspacePage[]` with item excised | Guarded: if `pages.length <= 1`, refuses deletion with error toast "A PDF must contain at least one page" | `src/app/pdf-workspace/page.tsx` line 116 |
| 17 | Selection Download | `/pdf-workspace` Download Selection | Export either the entire arranged document or solely the user-selected subset of pages | Selection set of page IDs / indices | Exported PDF (`${base}_workspace_edited.pdf` or `${base}_selected_pages.pdf`) | Throws error if 0 pages selected for export ("Cannot save an empty PDF document with 0 pages") | `DISPATCH.md` ("download selection"); `src/lib/pdf/workspace.ts` |
| 18 | Raster Image Ingestion | `/images-to-pdf` Ingestion (Feature 18) | Ingests multiple raster images (JPG, PNG, WebP) with queue reordering | Array of `File[]` with MIME `image/jpeg`, `image/png`, `image/webp` | Reorderable image queue with preview thumbnails (`URL.createObjectURL`) | Rejects non-image files with error toast; revokes object URLs on deletion to prevent memory leaks | `PROJECT.md` § Feature 18; `src/app/images-to-pdf/page.tsx` |
| 19 | Paper Size Presets | `/images-to-pdf` Page Sizing | Formats output pages to standard standard paper sizes or native image proportions | Preset: `"a4"` (595.28×841.89 pt), `"letter"` (612.0×792.0 pt), `"auto"` (dimensions match image) | PDF document pages initialized to exact point dimensions | Default is `"a4"` | `PROJECT.md` § Feature 18; `src/lib/pdf/imagesToPdf.ts` |
| 20 | Adaptive Orientation | `/images-to-pdf` Page Orientation | Formats page orientation automatically based on image aspect ratio or user override | Options: `"portrait"`, `"landscape"`, `"auto"` | Page dimensions swapped if orientation requires landscape (`pageWidth = pageHeight`) | In `"auto"` mode, if `imgWidth > imgHeight`, automatically sets landscape | `DISPATCH.md`; `src/lib/pdf/imagesToPdf.ts` |
| 21 | Margin Control | `/images-to-pdf` Margins | Applies standard border spacing around embedded images | Margin option: `0` (None), `10` (Small), `20` (Normal) | Calculates available bounding box `pageWidth - 2*margin` and centers image | If margin is 0, image renders full-bleed | `DISPATCH.md`; `src/lib/pdf/imagesToPdf.ts` |
| 22 | WebP & Exotic Fallback | `/images-to-pdf` Canvas Transcode | Transcodes WebP or unrecognized image formats to JPEG buffer via HTML5 Canvas before embedding in `pdf-lib` | WebP or canvas-renderable `File` | ArrayBuffer of converted JPEG image | Rejects if canvas context or `FileReader` fails | `src/lib/pdf/imagesToPdf.ts` line 115 |
| 23 | Universal Tabular Numerals | Invariant: Tabular Numerals | Enforces `.tabular-nums` / `<TabularNum />` across all sizes, percentages, and page counts | Numeric values: file sizes, page numbers, progress %, savings % | Rendered text with monospaced digit widths preventing layout shifts (CLS) | Fallback to standard numbers if font lacks OpenType `tnum` | `PROJECT.md` § Interface Contracts; `src/components/ui/TabularNum.tsx` |
| 24 | Touch Target Invariant | Invariant: Touch Targets ≥44px | Enforces minimum 44×44px interactive bounding box for mobile accessibility | All buttons, icon buttons, tabs, checkboxes, and switches | WCAG 2.5.5 / 2.5.8 compliant click/touch area | Elements styled `<44px` flag accessibility audit failures | `ORIGINAL_REQUEST.md` R5, AC; `TEST_INFRA.md` § 4 |
| 25 | Privacy Invariant | Invariant: Zero Server Uploads | Guarantees 100% in-browser processing with zero remote network egress | User documents and images | Processed entirely in browser memory via `pdf-lib` and HTML5 Canvas | Network egress or API route creation strictly forbidden | `ORIGINAL_REQUEST.md` R5; `TEST_INFRA.md` Invariant 1 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `/pdf-split` Range Parser | `"-1, 0, 1-3"` | Clamps negative and 0 inputs to 1. Returns `[0, 1, 2]` (0-indexed). |
| 2 | `/pdf-split` Range Parser | `"5-2"` (Inverted range) | Automatically flips `from` and `to` (`Math.min` and `Math.max`). Resolves pages 2 through 5 -> `[1, 2, 3, 4]`. |
| 3 | `/pdf-split` Range Parser | `"abc, 1, --, 2..3"` (Malformed tokens) | Non-numeric tokens evaluate to `NaN` and are discarded without crashing. Resolves `[0]` (page 1). |
| 4 | `/pdf-split` Range Parser | `"1-100"` on a 3-page PDF | Bounds clamped to `maxPages` (3). Returns `[0, 1, 2]`. |
| 5 | `/pdf-split` Range Parser | `""` or `", , "` (Empty string) | Returns empty array `[]`. Extraction engine throws error `"No valid pages selected for extraction."`. |
| 6 | `/pdf-split` Range Parser | `"1-3, 2, 3, 1"` (Duplicates & Overlaps) | `Set<number>` deduplicates identical page requests. Output sorted in ascending order `[0, 1, 2]`. |
| 7 | `/pdf-merge` Engine | `[]` or single file `[file1]` | Rejects immediately with error `"At least 2 PDF files are required for merging."`. |
| 8 | `/pdf-merge` Engine | PDFs with mixed page sizes (A4 + US Letter + Legal) | `pdf-lib` copies each page's native dimensions and mediaBox; merged document successfully retains each page's individual dimensions. |
| 9 | `/pdf-compress` Engine | Already-compressed PDF (0% potential savings) | `calcSavings` and `savingsPct` clamp to `Math.max(0, savingsPct)`. Returns `0%` savings, output PDF remains fully valid and uncorrupted. |
| 10 | `/pdf-compress` Engine | 0-byte original file | `calcSavings(0, outputSize)` guards against division by zero, returning `0` rather than `NaN`. |
| 11 | `/pdf-compress` Engine | PDF containing encrypted streams | `PDFDocument.load(arrayBuffer, { ignoreEncryption: true })` bypasses encryption headers where permitted; throws clean error if user password required. |
| 12 | `/pdf-workspace` Page Delete | Attempting to delete the only page left (`pages.length === 1`) | Deletion blocked with toast/alert `"A PDF must contain at least one page."`. Page array length stays 1. |
| 13 | `/pdf-workspace` Rotation | 4 consecutive 90° clockwise rotations on page | `(rotation + 90) % 360` cycles `90° -> 180° -> 270° -> 0°`, returning to original orientation. |
| 14 | `/pdf-workspace` Duplication | Rapid duplication of page 1 | Generates unique IDs using `Date.now() + Math.random().toString(36)`, avoiding React key collisions during rendering. |
| 15 | `/images-to-pdf` Ingestion | WebP image format input | `pdf-lib` lacks native `embedWebp`. Caught in `try...catch` and transcoded via HTML5 Canvas into a high-quality JPEG ArrayBuffer before embedding. |
| 16 | `/images-to-pdf` Margins | `margin: 0` (No margin) | Available dimensions equal page dimensions. Image rendered full-bleed edge-to-edge. |
| 17 | `/images-to-pdf` Orientation | Landscape photo (1920×1080) with `orientation: "auto"` and `pageSize: "a4"` | Senses `imgWidth > imgHeight` and flips page dimensions (pageWidth=841.89, pageHeight=595.28) to portrait/landscape match. |
| 18 | `/images-to-pdf` Empty Input | `convertImagesToPdf([])` with empty array | Throws error `"No images provided for PDF creation."`. |
| 19 | `/images-to-pdf` Transparency | PNG with transparent alpha channel | Handled natively by `pdfDoc.embedPng(arrayBuffer)` preserving alpha channel in PDF XObject. |
| 20 | All PDF Workstations | Dropping non-PDF file into PDF dropzones | Filtered out by `accept={[".pdf"]}` or rejected with error toast `"Please select PDF documents."`. |

---

## 1. Observation

Direct code and test observations from authoritative workspace files:

1. **Test Suite Health**:
   - `npm test` executed across all suites.
   - Result: **231 tests passing across 58 suites with 0 failures, 0 cancellations, 0 skips in ~3.28s**.
   - Verified that `filefixer/tests/tier1-feature-coverage.test.ts`, `tier2-boundary-corner.test.ts`, `tier3-cross-feature.test.ts`, `tier4-application-scenarios.test.ts`, `privacy-invariant.test.ts`, and `routes-and-design.test.ts` all pass.

2. **Route and Layout Inventory**:
   - All 6 PDF routes exist under `filefixer/src/app/`:
     - `/pdf-studio/layout.tsx` & `page.tsx`
     - `/pdf-merge/layout.tsx` & `page.tsx`
     - `/pdf-split/layout.tsx` & `page.tsx`
     - `/pdf-compress/layout.tsx` & `page.tsx`
     - `/pdf-workspace/layout.tsx` & `page.tsx`
     - `/images-to-pdf/layout.tsx` & `page.tsx`
   - Every `layout.tsx` exports metadata with `title`, `description`, `alternates.canonical`, `openGraph`, and `twitter` tags referencing `/branding/filefixer-og.png`.

3. **Touch Target Sizing Discrepancies (<44px)**:
   - `src/app/pdf-merge/page.tsx`:
     - Lines 198, 207, 217: Reorder and delete icon buttons use `className="h-8 w-8"` (32×32px), violating the ≥44px requirement.
   - `src/app/pdf-workspace/page.tsx`:
     - Lines 274, 283, 292, 301: Page action buttons (left, right, rotate, delete) use `className="p-2 ..."` with `h-3.5 w-3.5` icons (~28×28px), violating ≥44px.
   - `src/app/pdf-studio/page.tsx`:
     - Lines 270–300: Page action buttons use `className="p-1.5 ..."` with `h-3.5 w-3.5` icons (~26×26px), violating ≥44px.
   - `src/app/images-to-pdf/page.tsx`:
     - Lines 238, 247, 257: List reorder and remove buttons use `className="h-7 w-7"` (28×28px), violating ≥44px.

4. **Tabular Numerals (`.tabular-nums`) Discrepancies**:
   - `src/components/ui/TabularNum.tsx` provides `<TabularNum />`, `<FormatBytes />`, and `<SavingsPct />` with `font-feature-tnum inline-block tabular-nums`.
   - In `src/app/pdf-merge/page.tsx`:
     - Line 187: `{formatBytes(it.file.size)}` lacks `.tabular-nums`.
     - Line 264: `Total {mergedStats.count} pages · {formatBytes(mergedStats.size)}` lacks `.tabular-nums`.
   - In `src/app/pdf-split/page.tsx`:
     - Line 238: `{formatBytes(selectedFile.size)} · {totalPages > 0 ? ...}` lacks `.tabular-nums`.
     - Line 308: `{selectedPageNumbers.size} of {totalPages} pages selected` lacks `.tabular-nums`.
     - Line 408: `{formatBytes(extractedResult.blob.size)}` lacks `.tabular-nums`.
   - In `src/app/pdf-compress/page.tsx`:
     - Line 237–239: `{formatBytes(result.outputSize)} ({result.savingsPct.toFixed(1)}% smaller · {result.pageCount} pages)` lacks `.tabular-nums` on the inline span.
   - In `src/app/pdf-workspace/page.tsx`:
     - Line 203: `{pages.length} Page{...} in workspace · {formatBytes(selectedFile.size)}` lacks `.tabular-nums`.
     - Line 244: `#{idx + 1}` lacks `.tabular-nums`.
     - Line 328: `{formatBytes(savedResult.blob.size)} ({pages.length} pages)` lacks `.tabular-nums`.
   - In `src/app/images-to-pdf/page.tsx`:
     - Line 227: `{formatBytes(it.file.size)}` lacks `.tabular-nums`.
     - Line 379: `Size: {formatBytes(resultBlob.size)} · {items.length} pages` lacks `.tabular-nums`.

5. **Functional Capabilities vs. Dispatch Scope**:
   - `/pdf-studio`: Currently loads a single document, lacks multi-file merge/append inside studio, lacks drag-and-drop sortable, lacks rendered page thumbnails (uses placeholder `<FileText>` icon), and lacks integrated compress/split tabs.
   - `/pdf-merge`: Currently merges all pages of each file without per-file page range inclusion, lacks drag-and-drop reordering, and lacks a visual thumbnail strip.
   - `/pdf-compress`: Has "Balanced" and "Smaller File" modes, but lacks a third preset ("Less / Light") specified in the dispatch.
   - `/pdf-workspace`: Has clockwise rotation only (lacks counterclockwise rotation), lacks drag-and-drop reordering, and lacks "Download Selection" (only saves entire workspace).
   - `/images-to-pdf`: Has arrow-based reordering rather than drag-and-drop sortable cards.

---

## 2. Logic Chain

1. **Specification Authority**:
   - `ORIGINAL_REQUEST.md` (R3) mandates: "Comprehensive PDF Workstations: /pdf-merge, /pdf-split, /pdf-compress, /pdf-workspace, /images-to-pdf, /pdf-studio: Visual thumbnail grids, drag-and-drop page reordering, page selection, and rotation."
   - `PROJECT.md` establishes Features 15 through 18 covering these 6 routes, enforcing zero server uploads, `.tabular-nums` on all metrics, and ≥44px touch targets.
   - `DISPATCH.md` specifically refines the feature expectations:
     - `/pdf-studio`: Unified workbench combining split, merge, reorder, compress, extract.
     - `/pdf-merge`: File drag/drop ordering, page range inclusion, thumbnail strip, merged output.
     - `/pdf-split`: Range token parsing (`1-3, 5, 8-10`), single page extraction, split all.
     - `/pdf-compress`: Presets (Extreme, Recommended, Less), client-side stream cleanup, before/after byte count display with `.tabular-nums`.
     - `/pdf-workspace`: Interactive page grid, drag reorder, rotate clockwise/counterclockwise, delete page, download selection.
     - `/images-to-pdf`: Multi-image upload, page orientation (portrait/landscape/auto), margins (none/small/normal), paper size (A4/Letter), reordering.

2. **Deductions Regarding Gaps**:
   - The underlying transformation engines in `src/lib/pdf/` (`compress.ts`, `imagesToPdf.ts`, `merge.ts`, `split.ts`, `workspace.ts`) are robust, client-side, and pass all 231 unit/boundary tests.
   - However, the UI layers in `src/app/pdf-*/page.tsx` and `images-to-pdf/page.tsx` were built with initial baseline UI controls (e.g. `h-7 w-7` and `h-8 w-8` icon buttons) that violate the ≥44px WCAG touch target invariant.
   - The UI layers frequently format byte counts using standard `<span>{formatBytes(...)}</span>` without the mandatory `.tabular-nums` class or `<FormatBytes />` component, which induces Cumulative Layout Shift during processing updates.
   - Several functional features explicitly enumerated in the dispatch are missing from the workstation UIs:
     1. In `/pdf-merge`: No input field for per-file page ranges (e.g., merging only pages `1-3` from Doc A and `4-6` from Doc B); no visual thumbnail strip.
     2. In `/pdf-workspace`: No counterclockwise rotation button (only `RotateCw`), no checkbox/selection state to "Download selection" (only exports all pages).
     3. In `/pdf-compress`: Only two presets ("Balanced", "Smaller"); missing the "Less / Light" preset.
     4. In `/pdf-studio`: Missing the unified workflow combining split, merge, and compress into the workbench.

3. **Architectural Safety**:
   - All engines preserve 100% on-device execution.
   - No API routes exist in `src/app/api` (verified by `tests/privacy-invariant.test.ts`).
   - All 33 routes have valid metadata in `layout.tsx`.
   - Upgrading the UI components to add drag-and-drop (@dnd-kit), ≥44px touch targets, and `.tabular-nums` will not break any existing tests or modify payment/support invariants.

---

## 3. Caveats

1. **PDF Rendering in Browser**:
   - Generating true bitmap thumbnails for PDF pages in a browser client-side requires `pdfjs-dist` canvas rendering with web worker loading. While `pdfjs-dist` is installed in `package.json`, current workstation pages use fallback SVG icons (`<FileText>`) to avoid worker bundle path issues in Next.js Turbopack. When implementing visual thumbnails, worker configuration must avoid remote CDN scripts to preserve the 0-network egress invariant.
2. **Read-Only Mining Scope**:
   - As a Specification Miner, this agent does NOT implement code changes. All identified requirements, specifications, and UI gaps are cataloged for the downstream implementation workers.

---

## 4. Conclusion

The specification mining for Milestone 4 (PDF Tools Suite) is complete.
1. The 6 PDF workstations (`/pdf-studio`, `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`) and their respective `layout.tsx` metadata wrappers are fully mapped.
2. All inputs, outputs, error conditions, edge cases, and architectural invariants are codified in the specification matrix above.
3. Downstream implementation workers must prioritize:
   - Enforcing ≥44px touch targets on all list reorder, move, rotate, duplicate, and delete buttons.
   - Applying `.tabular-nums` or `<FormatBytes />` / `<TabularNum />` to all byte counts, page counts, and percentage figures.
   - Adding per-file page range inclusion and thumbnail strip to `/pdf-merge`.
   - Adding counter-clockwise rotation and "Download Selection" to `/pdf-workspace`.
   - Adding the 3-preset selection ("Extreme", "Recommended", "Less") to `/pdf-compress`.
   - Unifying split/merge/compress actions in `/pdf-studio`.

---

## 5. Verification Method

To independently verify the facts and specifications in this report:

1. **Verify Test Suite & Privacy Invariants**:
   ```bash
   cd filefixer
   npm test
   ```
   *Expected outcome*: 231 tests pass with 0 failures across all 14 test files.

2. **Verify Route Existence & Metadata**:
   Inspect the presence of `layout.tsx` in all 6 routes:
   - `filefixer/src/app/pdf-studio/layout.tsx`
   - `filefixer/src/app/pdf-merge/layout.tsx`
   - `filefixer/src/app/pdf-split/layout.tsx`
   - `filefixer/src/app/pdf-compress/layout.tsx`
   - `filefixer/src/app/pdf-workspace/layout.tsx`
   - `filefixer/src/app/images-to-pdf/layout.tsx`

3. **Verify Invariant Violations in Current Codebase**:
   - Inspect `filefixer/src/app/pdf-merge/page.tsx` lines 198, 207, 217 for `h-8 w-8` touch target violations.
   - Inspect `filefixer/src/app/images-to-pdf/page.tsx` lines 238, 247, 257 for `h-7 w-7` touch target violations.
   - Inspect `filefixer/src/app/pdf-workspace/page.tsx` line 274 for `p-2` (<44px) button sizes.
   - Inspect numeric displays for absence of `tabular-nums` class.
