# Orchestrator 3 Execution Plan

## Objective
Drive FileFixer completion from Milestone 3 Iteration 2 through Milestone 6 Final Verification and Victory Claim to Sentinel.

## Step 1: Milestone 3 Iteration 2 (Remediation)
- **Agent**: `worker_m3_r2` (`teamwork_preview_worker`)
- **Scope**:
  1. Fix DMS direction inversion in `filefixer/src/lib/image/metadata.ts:56`.
  2. Add `typeof file.arrayBuffer === "function"` check before FileReader fallback in `filefixer/src/lib/file-utils.ts:62`.
  3. Ensure view toggle buttons in `filefixer/src/app/image-studio/page.tsx:444` meet `min-h-[44px]` touch target requirement.
  4. Run `npm test --prefix filefixer` and `npm run build --prefix filefixer`.
- **Exit Criteria**: All tests pass, static build passes 33/33 routes.

## Step 2: Milestone 3 Iteration 2 Verification & Gate
- **Agents**: `challenger_m3_r2_1`, `challenger_m3_r2_2` (`teamwork_preview_challenger`)
- **Scope**: Validate DMS coordinates, Node/browser ArrayBuffer compatibility, touch targets, and full test regression suite.
- **Exit Criteria**: Both challengers APPROVE. Update `GATE_STATUS.md` and set M3 status to DONE in `PROJECT.md`.

## Step 3: Milestone 4 (PDF Workstations)
- **Scope**:
  - `/pdf-merge`: Multi-file upload, thumbnail reordering, rotation, page range selection, combine into single PDF.
  - `/pdf-split`: Split by page ranges, extract single/multiple pages, split each page to separate PDF.
  - `/pdf-compress`: Visual compression preset options (e.g., screen/ebook/prepress), client-side stream optimization.
  - `/pdf-workspace`: Page deletion, rotation, reordering, duplicate, zoomable canvas preview.
  - `/images-to-pdf`: Drag/drop multiple images, rearrange order, margin/orientation controls, combine to PDF.
  - `/pdf-studio`: Unified multi-tool PDF powerhouse combining split, merge, reorder, compress, and extract.
  - Metadata wrappers: Ensure all PDF routes have proper `layout.tsx` metadata and title/descriptions.
- **Cycle**: Worker implementation -> 2 Reviewers -> 2 Challengers -> 1 Auditor -> Gate check.

## Step 4: Milestone 5 (Batch Pipelines, Utility Tools & Informational Pages)
- **Scope**:
  - `/batch-rename`: Rule-based pattern renaming (prefix, suffix, find/replace, number sequence, case conversion), live preview, zip export.
  - `/workflows`: Multi-step automation pipeline builder (e.g., Resize -> Watermark -> Convert to WebP -> Zip).
  - `/privacy-cleaner`: Deep privacy scanner and scrub engine for images and documents.
  - `/history`: Local-only recent activity and batch rerun history (stored in localStorage / IndexedDB).
  - Support & FAQ modals/pages: Accessible documentation and privacy FAQ explaining client-side security architecture.
- **Cycle**: Worker implementation -> 2 Reviewers -> 2 Challengers -> 1 Auditor -> Gate check.

## Step 5: Milestone 6 (Final Verification & Victory Claim)
- **Scope**:
  - Run 100% of E2E tests across Tiers 1-4.
  - Execute Tier 5 adversarial coverage hardening (Challengers probing untested edge cases).
  - Verify static export: 33/33 static routes cleanly generated.
  - Verify zero external network requests (100% on-device privacy guarantee).
  - Verify QR code asset integrity.
  - Perform final forensic audit.
  - Report victory to Sentinel (`8fa1e825-9d32-4d8f-aa6e-5ea4991a6df5`).
