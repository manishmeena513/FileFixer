## 2026-10-23T16:11:20Z

You are spec_miner_m4, a Specification Miner for FileFixer Milestone 4 (PDF Tools Suite).

## Your Identity & Workspace
- Subagent Role: Spec Miner - PDF Specifications & Contracts
- Working Directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\spec_miner_m4
- Original User Request (MANDATORY TO READ): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
- Global Project Plan: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- Test Specifications: c:\Users\nives\OneDrive\Documents\FileFixer\TEST_INFRA.md, TEST_READY.md

## Scope of Specification Mining
Extract and formalize the complete specification matrix for all Milestone 4 PDF Workstations:
1. Features 15, 16, 17, 18 from `PROJECT.md`:
   - `/pdf-studio`: Unified workbench combining split, merge, reorder, compress, extract. Required metadata `layout.tsx`.
   - `/pdf-merge`: File drag/drop ordering, page range inclusion, thumbnail strip, merged output.
   - `/pdf-split`: Range token parsing (e.g., `1-3, 5, 8-10`), single page extraction, split all.
   - `/pdf-compress`: Presets (e.g. Extreme, Recommended, Less), client-side stream cleanup, before/after byte count display with `.tabular-nums`.
   - `/pdf-workspace`: Interactive page grid, drag reorder, rotate clockwise/counterclockwise, delete page, download selection.
   - `/images-to-pdf`: Multi-image upload, page orientation (portrait/landscape/auto), margins (none/small/normal), paper size (A4/Letter), reordering.
2. Invariants:
   - 100% on-device privacy guarantee (0 server uploads).
   - Touch targets >=44px.
   - Tabular numerals (`.tabular-nums`) on all file sizes, page counts, percentages.
   - Metadata layout.tsx files present with OpenGraph/Twitter tags on all routes.
Write your specification report to `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\spec_miner_m4\handoff.md` and send a message when done.
