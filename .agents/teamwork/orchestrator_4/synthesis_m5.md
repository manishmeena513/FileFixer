# Milestone 5 Synthesis: Batch Pipelines, Utility Tools & Informational Pages

**Date**: 2026-10-23T21:45:00Z  
**Sources**:
- `explorer_m5_1` (`c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m5_1\handoff.md`)
- `explorer_m5_2` (`c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m5_2\handoff.md`)
- `spec_miner_m5` (`c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\spec_miner_m5\handoff.md` and `spec_matrix.md`)

---

## 1. Consensus Findings & Required Work Items

### Item 1: Missing Route Layout Wrapper
- `src/app/workflows/layout.tsx` is currently MISSING.
- Create `src/app/workflows/layout.tsx` with App Router metadata (title, description, canonical url `/workflows`, OpenGraph, and Twitter tags) matching project standards.

### Item 2: Unified Renaming Engine (`src/lib/batch/rename.ts`)
- Extract and implement a shared renaming utility supporting:
  - Sequence numbering with `#+` zero-padding (e.g. `Asset_###` -> `Asset_001.jpg`)
  - Arbitrary prefix and suffix addition
  - Find and replace (text string and safe regex with error protection)
  - Case transformation: `lowercase`, `uppercase`, `titlecase`, `as-is`
  - Date prefixing (`YYYY-MM-DD_`)
  - Space replacement (e.g. to `-` or `_`)
- Integrate into `batch-rename/page.tsx` (with live preview) and `batchProcessor.ts`.

### Item 3: Privacy Cleaner PDF Metadata Stripping Fix
- Currently, `src/app/privacy-cleaner/page.tsx` only scrubs images (`activeFile.type.startsWith("image/")`), leaving PDFs completely unstripped while claiming success.
- Implement PDF metadata stripping for `application/pdf` by invoking `compressPDF(activeFile, { removeMetadata: true, useObjectStreams: true })` from `src/lib/pdf/compress.ts` (or `pdf-lib` document metadata clear), ensuring 100% genuine privacy cleaning for both images and documents.

### Item 4: ToolPageShell & UI Standardization
- Wrap `/batch`, `/batch-rename`, `/workflows`, and `/privacy-cleaner` in `<ToolPageShell>` or consistent shell structure with breadcrumbs and back navigation to `/tools`.

### Item 5: Touch Targets (≥44×44px)
- Enforce `min-h-[44px] min-w-[44px] touch-manipulation` across:
  - `/batch`: Action buttons, delete buttons, format toggles, dimension inputs, and table row downloads.
  - `/batch-rename`: Add More / Clear All buttons, template and starting number inputs.
  - `/workflows`: Step up/down buttons, remove step button, add operation buttons, reset button.
  - `/privacy-cleaner`: "Choose Other File" button.
  - `/history`: Delete record button (`history/page.tsx:171-179`), increasing from 24×24px to ≥44×44px. Add "Open Tool" / "Replay" link for each record.

### Item 6: Tabular Numerals (`.tabular-nums`)
- Apply `.tabular-nums` universally to all file size metrics, counts, percentages, and progress telemetry in `/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner`, and `/history`.

### Item 7: WCAG AA Light Mode Contrast
- Fix contrast failures in light mode:
  - Replace raw `text-emerald-400` with `text-emerald-600 dark:text-emerald-400` (or `text-[hsl(var(--success))]`).
  - Replace raw `text-amber-400` / `text-amber-300` with `text-amber-600 dark:text-amber-400`.

### Item 8: Delivery System & Support Integration
- Ensure `pushDownload(item)`, `setLatestDeliveredFile(item)`, and `triggerSupportPrompt()` are properly called in `/batch-rename`, `/workflows`, and `/privacy-cleaner`.

### Item 9: Strict Invariants
- 100% on-device processing: 0 server uploads, 0 API endpoints.
- Preserve `public/images/filefixer_support_qr.png` without modification.
- Maintain 280/280 baseline tests passing and 33/33 static routes prerendered.
