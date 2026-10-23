## 2026-10-23T21:14:54Z
You are worker_m5, the Worker subagent for FileFixer Milestone 5 (Batch Processing, Pipelines & Utility Tools + Informational Pages).

## Your Identity & Workspace
- Subagent Role: Worker - Milestone 5 Batch & Delivery
- Working Directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m5
- Original User Request (MANDATORY TO READ): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
- Global Project Plan: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- Synthesis & Explorer Reports to Read:
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\orchestrator_4\synthesis_m5.md
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m5_1\handoff.md
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m5_2\handoff.md
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\spec_miner_m5\handoff.md
  - c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\spec_miner_m5\spec_matrix.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You have exclusive write ownership over:
- `filefixer/src/app/workflows/layout.tsx`
- `filefixer/src/app/batch/page.tsx`
- `filefixer/src/lib/batch/rename.ts`
- `filefixer/src/app/batch-rename/page.tsx`
- `filefixer/src/app/workflows/page.tsx`
- `filefixer/src/app/privacy-cleaner/page.tsx`
- `filefixer/src/app/history/page.tsx`
- `filefixer/src/lib/zip.ts`
- `filefixer/tests/m5-batch-workflows.test.ts`

## Key Implementation Tasks

### 1. Fix Layout Wrapper & Batch Workstation
- Create `filefixer/src/app/workflows/layout.tsx`:
  Export Next.js `metadata` with title `"Automated File Workflows | FileFixer"`, description, canonical `/workflows`, OpenGraph, and Twitter tags referencing `/branding/filefixer-og.png`.
- In `filefixer/src/app/batch/page.tsx`:
  Wrap cleanly in `<ToolPageShell>`. Fix all touch targets to ≥44×44px (`min-h-[44px] min-w-[44px] touch-manipulation`). Enforce `.tabular-nums` on all sizes, percentages, and counters. Fix light-mode contrast: replace raw `text-emerald-400` with `text-emerald-600 dark:text-emerald-400`.

### 2. Implement Batch Rename Engine (`src/lib/batch/rename.ts`)
Create a robust, genuine rule-based rename engine supporting:
- Prefix and Suffix addition
- Find and Replace (with global and case-insensitive options)
- Number sequencing with custom start index and configurable zero-padding (`#+` replacement)
- Case transforms (`"lowercase"`, `"uppercase"`, `"titlecase"`, `"kebab"`, `"snake"`, `"as-is"`)
- Regex pattern matching and replacement with safe error boundaries
- Functions: `applyRenameRules`, `previewRenames`, `packageRenamedZip`

### 3. Refactor `/batch-rename/page.tsx`
- Connect to `src/lib/batch/rename.ts`.
- Wrap in `<ToolPageShell>`.
- Provide live before/after rename table with `.tabular-nums`.
- Enforce touch targets ≥44×44px (`min-h-[44px] min-w-[44px] touch-manipulation`) on all buttons, inputs, and chips.
- Wire up delivery flow: `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.

### 4. Refactor `/workflows/page.tsx`
- Wrap in `<ToolPageShell>`.
- Provide multi-step automation pipeline builder with pre-configured recipes.
- Enforce touch targets ≥44×44px on all step cards, add/remove step buttons, and run triggers.
- Apply `.tabular-nums` on all progress and size metrics.
- Fix light-mode contrast on badges.
- Wire up delivery flow: `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.

### 5. Refactor `/privacy-cleaner/page.tsx`
- Enhance metadata scrubbing to genuinely support BOTH Images (EXIF/GPS/IPTC) AND PDF documents (using `compressPDF` with `removeMetadata: true` or `pdf-lib` to strip Title, Author, Subject, Keywords, Producer, Creator).
- Wrap in `<ToolPageShell>`.
- Enforce touch targets ≥44×44px and `.tabular-nums`.
- Fix light-mode contrast on success/alert badges (`text-emerald-600 dark:text-emerald-400`, `text-amber-600 dark:text-amber-400`).
- Wire up delivery flow: `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.

### 6. Polish `/history/page.tsx`
- Fix touch targets: Upgrade individual history delete button from `p-1` to `min-h-[44px] min-w-[44px] flex items-center justify-center`.
- Add interactive replay/reopen action links on history records to navigate directly to the corresponding tool.
- Ensure all metric figures and bytes use `.tabular-nums`.

### 7. ZIP Archiving Utility (`src/lib/zip.ts`)
- Ensure `downloadAsZip` returns `Promise<Blob>`, so callers can pass the resulting ZIP blob to `setLatestDeliveredFile` and `pushDownload`.

### 8. Add Dedicated Test Suite
Create `filefixer/tests/m5-batch-workflows.test.ts` testing:
- `rename.ts` (prefix, suffix, find/replace, number sequence with zero-padding, case transforms, regex)
- `batchProcessor.ts` (concurrency, queue processing, error resilience)
- `privacy-cleaner` (image EXIF scrubbing and PDF document metadata scrubbing)
- `workflows` recipe execution and output generation
- `history` IndexedDB operations
- UI touch target and `.tabular-nums` assertions

### 9. Verification Requirements
- Run `npm test` inside `filefixer`: Verify 100% of tests pass with 0 failures (baseline 280 + new tests).
- Run `npm run build` inside `filefixer`: Verify 33/33 static pages build with exit code 0.
- Verify QR code asset hash: Must equal `8592bd8a18457f3ac496d6735c472d7c4f3239e87b93771ed238d348b87d4744`.

### 10. Deliverable
Write a comprehensive `handoff.md` in `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m5\handoff.md` following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
When complete, call `send_message` to parent orchestrator (`a47114d0-2016-43ca-996b-63562bdb4881`) with a summary of changes and test/build outcomes.
