## 2026-10-23T17:14:48Z
You are worker_m4, the Worker subagent for FileFixer Milestone 4 (Comprehensive PDF Workstations).

## Your Identity & Workspace
- Subagent Role: Worker - Milestone 4 PDF Workstations
- Working Directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m4
- Original User Request (MANDATORY TO READ): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
- Global Project Plan: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- Explorer Reports to Read:
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m4_1\handoff.md
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m4_2\handoff.md
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\spec_miner_m4\handoff.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You have exclusive write ownership over:
- `filefixer/src/lib/pdf/compress.ts`
- `filefixer/src/lib/pdf/merge.ts`
- `filefixer/src/lib/pdf/split.ts`
- `filefixer/src/lib/pdf/imagesToPdf.ts`
- `filefixer/src/lib/pdf/workspace.ts`
- `filefixer/src/app/pdf-merge/page.tsx`
- `filefixer/src/app/pdf-split/page.tsx`
- `filefixer/src/app/pdf-compress/page.tsx`
- `filefixer/src/app/pdf-workspace/page.tsx`
- `filefixer/src/app/images-to-pdf/page.tsx`
- `filefixer/src/app/pdf-studio/page.tsx`
- `filefixer/tests/m4-pdf-workstations.test.ts` (new test suite)

## Key Implementation Tasks

### 1. Engine Fixes in `filefixer/src/lib/pdf/`
- **`compress.ts`**:
  Fix the metadata preservation bug: When `!options.removeMetadata && options.level !== "smaller"`, copy `title`, `author`, `subject`, `keywords`, `producer`, `creator` from `pdfDoc` to `newPdf` before saving.
  Ensure `{ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 }` is used.
- **`merge.ts`**, **`split.ts`**, **`imagesToPdf.ts`**:
  Add `{ useObjectStreams: true }` to all `.save()` calls for compact, optimized PDF generation.

### 2. UI Refactoring Across All 6 PDF Workstation Pages
Refactor `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, and `/pdf-studio`:
- **Shell Consistency**: Wrap each page in `<ToolPageShell>` (from `@/components/ui/ToolPageShell`), providing breadcrumbs (`/tools`), semantic icon, title, description, and format tags (`["PDF"]` or `["JPG", "PNG", "WEBP"]`).
- **Touch Target Sizing (>= 44px)**:
  - Enforce `min-h-[44px] min-w-[44px] touch-manipulation` on ALL buttons, icon buttons (reorder, remove, rotate, duplicate, delete), chips, and interactive selectors.
  - In `/pdf-merge` and `/images-to-pdf`: Replace `h-8 w-8` and `h-7 w-7` buttons with `min-h-[44px] min-w-[44px] flex items-center justify-center`.
  - In `/pdf-workspace`: Page card footer action buttons and `+ Duplicate` button must have `min-h-[44px]`.
  - In `/pdf-studio`: Change `min-h-[40px]` buttons to `min-h-[44px]` and card controls to `min-h-[44px] min-w-[44px]`.
  - In `/pdf-split`: "Select All" / "Deselect All" must have `min-h-[44px] px-3 py-2 text-xs inline-flex items-center`.
- **Tabular Numerals**: Apply `.tabular-nums` or `<TabularNum />` / `<FormatBytes />` across all file sizes, page counts, percentages, and numeric index badges.
- **WCAG AA Contrast**:
  - Replace hardcoded `text-emerald-400` with `text-emerald-700 dark:text-emerald-400` or `text-[hsl(var(--success))]` (>= 4.5:1 contrast against `#F7F9FC`).
  - Replace `text-white` on `bg-[hsl(var(--success))]` with `text-[hsl(var(--success-foreground))]`.
- **Delivery System Integration**:
  - Import `useFileStore` (`pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt`).
  - Upon successful processing: call `pushDownload` with status `"ready"`.
  - Upon user clicking Download: call `triggerDownload`, `pushDownload` with status `"downloaded"`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
- **Page-Specific Polish**:
  - In `pdf-studio/page.tsx`: Replace native `alert()` calls with `toast({ variant: "error", title, description })` or inline alert banners; expose the `duplicatePage` button in the card actions toolbar using the `Copy` icon; ensure download filenames match dock item names.

### 3. Add Comprehensive Test Suite
Create `filefixer/tests/m4-pdf-workstations.test.ts` covering:
- `compressPDF` (object streams, metadata removal toggle vs preservation, savings calculations).
- `saveWorkspacePdf` and `loadWorkspacePages` (rotations 90/180/270, duplicate page copy, reordering, single-page deletion guard).
- `convertImagesToPdf` (multi-image compilation, A4 & Letter dimensions, auto-orientation, empty image array error).
- `splitAllPages` and `extractPages` (range parsing and ZIP packaging).
- `mergePDFs` (multi-document combination and page count arithmetic).
- Touch target and tabular numeral assertions on PDF components.

### 4. Verification Requirements
- Run `npm test --prefix filefixer`: Verify 100% of tests pass with 0 failures.
- Run `npm run build --prefix filefixer`: Verify 33/33 static pages build with exit code 0.
- Verify QR code asset hash (`node -e "const fs = require('fs'); const crypto = require('crypto'); console.log(crypto.createHash('sha256').update(fs.readFileSync('filefixer/public/images/filefixer_support_qr.png')).digest('hex'));"`): Must equal `8592bd8a18457f3ac496d6735c472d7c4f3239e87b93771ed238d348b87d4744`.

### 5. Deliverable
Write a comprehensive `handoff.md` in `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m4\handoff.md` and message the orchestrator when finished.
