# Milestone 5 Architecture & Engine Analysis: Batch Processing, Pipelines & Utility Tools

**Author**: Explorer Subagent `explorer_m5_1`  
**Target Milestone**: Milestone 5 (Features 19, 20, 21, 22, 23)  
**Investigation Date**: 2026-10-23  
**Status**: COMPLETE (Read-Only Investigation)  

---

## 1. Executive Summary

Milestone 5 encompasses the multi-file, sequential, and pipeline tools of FileFixer:
1. `/batch`: Batch processing workstation (Resize → Convert → Compress → Rename).
2. `/batch-rename`: Advanced rule-based renaming engine with live preview.
3. `/workflows`: Multi-step automated pipeline builder (drag-and-drop / preset recipe runner).
4. `/privacy-cleaner`: Deep metadata inspector and scrubbing utility for images and PDF documents.
5. Delivery System & Engines: `src/lib/batch/batchProcessor.ts`, `src/lib/zip.ts`, `src/stores/fileStore.ts` (`pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt`).

### Key Findings Summary
- **Route Parity**: All 4 routes exist, and `npm run build` succeeds with exit code 0 across all 33 static routes.
- **Privacy Cleaner Layout**: `src/app/privacy-cleaner/layout.tsx` is **already present** and properly configured with metadata, OpenGraph, and Twitter tags.
- **Critical Functional Defect in `/privacy-cleaner`**: Currently, `PrivacyCleanerPage` ONLY strips metadata for images (`if (activeFile.type.startsWith("image/"))`). When a PDF is loaded with detected author/creator tags, clicking "Strip All Metadata & Clean File" skips PDF scrubbing entirely and hands back the unmodified PDF.
- **Deficiencies in `/batch-rename`**: The page implements basic `#` template numbering, but lacks custom prefix, suffix, find/replace strings, case conversion (upper/title case), and regex pattern matching with live preview. Furthermore, it completely bypasses `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt`.
- **Deficiencies in `/workflows`**: The pipeline builder does not integrate with `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt`, or `addHistoryRecord`. Step error handling silently swallows failures.
- **Layout Shell Consistency**: None of the 4 routes (`/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner`) currently wrap their root view in `<ToolPageShell>`, despite `batch/page.tsx` importing it on line 37.
- **Delivery System ZIP Blob Omission**: `downloadAsZip` in `src/lib/zip.ts` returns `Promise<void>`, so callers cannot pass the generated ZIP blob into `setLatestDeliveredFile` (disabling "Download Again" inside `FileDeliveredModal`).

---

## 2. Route-by-Route Deep Dive

### 2.1 `/batch` (Batch Image Processing Hub)
- **Path**: `filefixer/src/app/batch/page.tsx` (796 lines), `layout.tsx` (37 lines).
- **Core Processing Engine**: `src/lib/batch/batchProcessor.ts` (`processBatchItem`).
- **Sequential vs Concurrent Invariant**:
  - Processing is strictly sequential:
    ```typescript
    for (let i = 0; i < files.length; i++) {
      setCurrentIdx(i);
      const itemResult = await processBatchItem(files[i], i, config);
      tempResults[i] = itemResult;
      setResults([...tempResults]);
    }
    ```
  - **Verdict**: Sequential processing is correct and necessary on the web platform. Running 20+ simultaneous canvas rasterizations and compression web workers risks memory exhaustion (OOM) on mobile devices.
  - Per-item progress tracking allows an honest live spinner on `currentIdx` with tabular progress percent `progressPct`.
- **Partial Retry**:
  - `handleRetryFailed` re-runs `processBatchItem` only for files where `results[i]?.status === "error"`.
- **Delivery Integration**:
  - Calls `pushDownload` for each completed file.
  - In `handleDownloadZip`: Calls `downloadAsZip(entries, "filefixer_batch_assets.zip")`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
  - **Issue Identified**: In `setLatestDeliveredFile({ ... })`, the `blob` property is omitted because `downloadAsZip` does not return the ZIP blob. Consequently, `FileDeliveredModal`'s "Download Again" button is not shown for ZIP downloads.
- **Layout & Ergonomics Gaps**:
  - Line 37 imports `ToolPageShell`, but the component returns a naked `<div className="mx-auto max-w-6xl ...">` without wrapping in `<ToolPageShell>`.
  - Stats bar at lines 308, 316, 337, 344 lacks `.tabular-nums` on metric containers, causing layout jitter during batch processing.
  - React 19 ESLint warning: `setFiles` is called inside `useEffect` on line 77 when synchronizing with `storeFiles`.

---

### 2.2 `/batch-rename` (Advanced Batch Renaming Engine)
- **Path**: `filefixer/src/app/batch-rename/page.tsx` (271 lines), `layout.tsx` (37 lines).
- **Current Capabilities**:
  - Template with `#+` sequence matching (e.g., `Project_###` -> `Project_001.ext`).
  - Starting number offset.
  - Lowercase switch.
  - Date prepend switch (`YYYY-MM-DD_`).
  - Space replacement switch (` ` -> `_`).
- **Critical Feature Deficiencies vs Feature 20**:
  1. **Prefix & Suffix Fields**: No text input for custom prefix or suffix strings.
  2. **Find & Replace**: No substring search and replace fields (only fixed space replacement).
  3. **Case Conversion**: Only lowercase toggle. Missing: `UPPERCASE` and `Title Case`.
  4. **Regex Mode**: No regular expression search/replace input with live preview.
  5. **Duplicate Name Collisions**: If the user provides a template without `#` (e.g., `Archive`), every file gets the exact same name, resulting in ZIP archive collisions. Fallback padding must be appended if `#` is missing.
- **Delivery Flow Violation**:
  - `handleDownloadZip` calls `downloadAsZip` and `addHistoryRecord`, but:
    - **Does NOT call `pushDownload`** (Download Dock remains empty).
    - **Does NOT call `setLatestDeliveredFile`** (File Delivered modal does not trigger).
    - **Does NOT call `triggerSupportPrompt()`** (Voluntary support prompt is skipped).
- **Layout & Accessibility**:
  - Missing `<ToolPageShell>` wrapper.
  - Missing `.tabular-nums` on preview file counts and byte sizes.
  - ESLint errors: Synchronous `setItems` in `useEffect` (line 38), explicit `any` on event handler (line 164), unused variable `_base` (line 65).

---

### 2.3 `/workflows` (Visual Workflow Builder)
- **Path**: `filefixer/src/app/workflows/page.tsx` (35 lines), `src/components/workflows/WorkflowBuilder.tsx` (584 lines).
- **Architecture**:
  - `page.tsx` is a Next.js Server Component exporting metadata and rendering `<WorkflowBuilder />`.
  - `WorkflowBuilder` maintains an array of `WorkflowStep` items (`resize`, `convert`, `compress`, `strip_metadata`, `rename`).
  - Includes 4 starter presets: "Website Images", "Email Safe Images", "WhatsApp / Chat", "Fast Upload & Rename".
- **Gaps & Deficiencies**:
  1. **Delivery System Isolation**:
     - `runWorkflow` (lines 285–298) automatically calls `downloadAsZip(..., "filefixer-workflow-output.zip")`.
     - **Does NOT call `pushDownload`**.
     - **Does NOT call `setLatestDeliveredFile`**.
     - **Does NOT call `triggerSupportPrompt()`**.
     - **Does NOT call `addHistoryRecord`** to IndexedDB.
  2. **Silent Failure in Intermediate Steps**:
     ```typescript
     try {
       // step execution...
     } catch (err) {
       console.error(`Workflow step failed for ${curName}:`, err);
     }
     ```
     If an intermediate conversion fails, the pipeline silently proceeds with the prior un-transformed blob, and pushes it as "done" without alerting the user or flagging the item.
  3. **Layout & UX**:
     - Missing `<ToolPageShell>` wrapper.
     - Starter preset buttons and step action buttons need explicit `min-h-[44px]` touch target sizing.
     - File size savings stats need `.tabular-nums`.

---

### 2.4 `/privacy-cleaner` (Metadata & Privacy Inspector & Scrubber)
- **Path**: `filefixer/src/app/privacy-cleaner/page.tsx` (277 lines), `layout.tsx` (40 lines).
- **Layout Verification**:
  - `src/app/privacy-cleaner/layout.tsx` is **confirmed to exist**. It defines title, description, canonical link (`/privacy-cleaner`), OpenGraph, and Twitter tags.
- **Deep Inspector Engine**:
  - Uses `inspectFile` from `src/lib/inspect.ts`.
  - Parses camera make, model, date taken, exposure, ISO, and GPS latitude/longitude via `exifr`.
  - Parses PDF page count, title, author, subject, creator, and producer via `pdf-lib`.
- **CRITICAL BUG: PDF Metadata Cleaning is Completely Missing**:
  - Lines 69–73 of `privacy-cleaner/page.tsx`:
    ```typescript
    if (activeFile.type.startsWith("image/")) {
      const res = await stripImageMetadata(activeFile);
      resultBlob = res.blob;
    }
    ```
  - When the active file is a PDF (e.g. `application/pdf`), `resultBlob` remains unchanged (`let resultBlob: Blob = activeFile;`).
  - The UI displays detected author tags, shows the "Strip All Metadata & Clean File" button, and then celebrates "All Metadata Successfully Stripped" while downloading the exact same un-scrubbed PDF!
  - **Remediation**:
    - Import `compressPDF` from `src/lib/pdf/compress.ts`.
    - If `activeFile.type === "application/pdf"` or `isPDFFile(activeFile)`:
      ```typescript
      const res = await compressPDF(activeFile, { level: "smaller", removeMetadata: true });
      resultBlob = res.blob;
      ```
- **Delivery Integration**:
  - `handleCleanPrivacy` calls `pushDownload` with status `"ready"`.
  - `handleDownloadClean` calls `setLatestDeliveredFile` with status `"downloaded"`.
  - **Omission**: Omits `triggerSupportPrompt()`, which should be invoked on file delivery.
- **Layout & Typography**:
  - Missing `<ToolPageShell>` wrapper.
  - Missing `.tabular-nums` on file size display.
  - "Choose Other File" button (line 162) needs `min-h-[44px]` touch target verification.

---

## 3. Underlying Engines & Utility Libraries

### 3.1 `src/lib/batch/batchProcessor.ts`
- **Current Pipeline**:
  1. `resizeImage`: Applies target width/height with aspect ratio lock.
  2. `convertImage`: Converts to target format (`image/webp`, `image/jpeg`, `image/png`).
  3. `compressImage`: Applies quality dial compression.
  4. Sequence renaming: Applies `#` token padding and extension update.
- **Error Handling**:
  - Uses `try...catch` per item, returning `{ status: "error", error: ... }` on failure.
  - Safe against single-file crashes aborting the whole queue.
- **Hash Fallback Bug**:
  - If `config.renamePattern` does not contain `#`, `config.renamePattern.match(/#+/)` returns null. Line 85 replaces `/#+/` with `paddedNum` (which matches nothing), leaving all files named identically.
  - Fix: If no `#` is detected, append `_${paddedNum}` before the extension to guarantee unique filenames.

### 3.2 `src/lib/zip.ts`
- **Current Function**:
  ```typescript
  export async function downloadAsZip(
    entries: ZipEntry[],
    zipName = "filefixer_output.zip"
  ): Promise<void>
  ```
- **Deficiency**: Does not return the created `Blob`.
- **Recommended Signature**:
  ```typescript
  export async function downloadAsZip(
    entries: ZipEntry[],
    zipName = "filefixer_output.zip"
  ): Promise<Blob> {
    const zip = new JSZip();
    for (const entry of entries) {
      zip.file(entry.filename, entry.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerDownload(zipBlob, zipName);
    return zipBlob;
  }
  ```
  This enables callers to pass the ZIP blob directly to `pushDownload` and `setLatestDeliveredFile`.

---

## 4. 100% On-Device Privacy Invariant Verification

| Invariant Requirement | Codebase Evidence | Compliance Status |
|---|---|---|
| **Zero Server Endpoints** | `filefixer/src/app/api` directory does not exist / 0 route files | **VERIFIED PASS** |
| **Zero Outbound Uploads** | No HTTP POST/PUT/multipart upload endpoints in `src/` | **VERIFIED PASS** |
| **No Remote SDKs/Tracking** | 0 references to Google Analytics, Hotjar, Mixpanel, Segment | **VERIFIED PASS** |
| **Client-Only Canvas/Wasm** | `browser-image-compression`, `pdf-lib`, `exifr`, `jszip` executed strictly in-browser | **VERIFIED PASS** |
| **Local Telemetry Persistence** | IndexedDB database `filefixer_db` stores metadata only; zero file blobs | **VERIFIED PASS** |

---

## 5. UI Ergonomics & Styling Compliance

| Requirement | `/batch` | `/batch-rename` | `/workflows` | `/privacy-cleaner` |
|---|---|---|---|---|
| **Wrapped in `<ToolPageShell>`** | ❌ (Imported, unused) | ❌ | ❌ | ❌ |
| **Touch Targets ≥44×44px** | ⚠️ Partial (inputs yes, icon buttons check) | ⚠️ Partial (Add More / Clear sm) | ⚠️ Partial | ⚠️ Partial |
| **`.tabular-nums` on Metrics** | ⚠️ Missing on stats bar | ❌ Missing on preview | ❌ Missing | ❌ Missing |
| **`pushDownload` Integration** | ✅ Yes | ❌ Missing | ❌ Missing | ✅ Yes |
| **`setLatestDeliveredFile`** | ✅ Yes (missing zip blob) | ❌ Missing | ❌ Missing | ✅ Yes |
| **`triggerSupportPrompt`** | ✅ Yes | ❌ Missing | ❌ Missing | ❌ Missing |
| **IndexedDB Telemetry** | ✅ Yes | ✅ Yes | ❌ Missing | ❌ Missing |

---

## 6. Concrete Recommendations for Worker Implementation

1. **Wrap All 4 Routes in `<ToolPageShell>`**:
   - `/batch`: Replace naked container with `<ToolPageShell icon={Layers} title="Batch Image Processing Pipeline" description="Execute multi-stage image processing (Resize, Convert, Compress, Rename) in one pass." formats={["JPG", "PNG", "WEBP"]}>`.
   - `/batch-rename`: Wrap with `<ToolPageShell icon={Layers} title="Batch Rename Files" description="Standardize filenames using sequential numbering, prefix/suffix, find/replace, and regex patterns." formats={["ALL"]}>`.
   - `/workflows`: Wrap `WorkflowBuilder` with `<ToolPageShell icon={Workflow} title="Visual Workflow Builder" description="Combine multiple file operations into automated sequential pipelines." formats={["JPG", "PNG", "WEBP"]}>`.
   - `/privacy-cleaner`: Wrap with `<ToolPageShell icon={Shield} title="Privacy Cleaner" description="Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags." formats={["JPG", "PNG", "PDF"]}>`.

2. **Fix PDF Metadata Scrubbing in `/privacy-cleaner`**:
   - In `handleCleanPrivacy`, check `if (isPDFFile(activeFile) || activeFile.type === "application/pdf")`.
   - Call `compressPDF(activeFile, { level: "smaller", removeMetadata: true })`.
   - Set output file name as `${base}_privacy_clean.pdf`.
   - Call `triggerSupportPrompt()` in `handleDownloadClean`.

3. **Enhance `/batch-rename` Rule Engine**:
   - Add input fields for:
     - Custom Prefix (`prefix`)
     - Custom Suffix (`suffix`)
     - Find Text (`findText`) & Replace Text (`replaceText`)
     - Regex toggle (`useRegex`) with `try { new RegExp(...) } catch` syntax guard
     - Case options dropdown/radios: Original, Lowercase, UPPERCASE, Title Case
   - Fix duplicate name collision bug: if template has no `#`, append `_${paddedNum}`.
   - Integrate delivery: In `handleDownloadZip`, call `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.

4. **Integrate Delivery & Telemetry in `/workflows`**:
   - In `runWorkflow`: Upon completion, call `pushDownload` for each output item or the ZIP, call `setLatestDeliveredFile`, call `triggerSupportPrompt()`, and call `addHistoryRecord`.
   - Handle intermediate step errors by flagging `status: "error"` on failed outputs and displaying an error toast.

5. **Enhance `src/lib/zip.ts`**:
   - Return the created `zipBlob` from `downloadAsZip`: `Promise<Blob>`.
   - Use the returned blob in `setLatestDeliveredFile({ ..., blob: zipBlob })` so "Download Again" works in `FileDeliveredModal`.

6. **Fix React 19 Lint Feedback**:
   - Refactor `useEffect` in `batch-rename/page.tsx` and `batch/page.tsx` that sets state synchronously from `storeFiles`, or derive items during render / populate on user drop action.
   - Fix explicit `any` in `batch-rename/page.tsx` line 164 (`(e: React.ChangeEvent<HTMLInputElement>)`).
