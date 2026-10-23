# Plan — Project Orchestrator 2

## Objective
Execute remaining milestones (M2 through M6) for FileFixer with zero server uploads, 100% client-side privacy, 33/33 prerendered static routes, and strict quality gates (Reviewers, Challengers, Forensic Auditor).

---

## Milestone 2: Homepage & Central Tools Directory Overhaul

### 1. Exploration (Parallel 3 Explorers)
- **Explorer 1 (Homepage Hero & Smart Drop Zone)**:
  - Inspect `filefixer/src/app/page.tsx` and related components.
  - Plan overhaul around "Fix your files. Keep them private."
  - Design interactive smart drop zone with format auto-routing (drag image -> image tools, drag PDF -> PDF tools).
  - Design popular workflows grid and high-contrast privacy badges.
  - Plan tabular statistics (eliminating legacy "13 tools" copy in favor of dynamic 20 tools).
- **Explorer 2 (Central Tools Directory /tools)**:
  - Inspect `filefixer/src/app/tools/page.tsx`.
  - Plan responsive, category-filtered workspace catalog (All, Images, PDF, Batch, Utilities).
  - Live search input, format tags (JPG, PNG, WebP, PDF, etc.), accessible empty state, tabular tool counters.
  - Ensure touch targets ≥44px, keyboard navigation, and WCAG AA contrast.
- **Explorer 3 (Master Tools Catalog & Synchronization)**:
  - Inspect `filefixer/src/lib/tools.ts` and consumers (`page.tsx`, `tools/page.tsx`, `CommandCenter.tsx`).
  - Validate and synchronize the 20 tools catalog: IDs, names, descriptions, icons, routes, categories, and formats.
  - Verify zero broken routes or mismatched metadata.

### 2. Implementation (Worker)
- Spawn fresh `teamwork_preview_worker` (`worker_m2`) with merged explorer plans and strict integrity warning.
- Implement homepage, smart drop zone, workflows, `/tools` directory, and catalog sync.
- Worker runs build and tests (`npm run build --prefix filefixer`, `npm test --prefix filefixer`).

### 3. Quality Gates
- Spawn 2 Reviewers (`teamwork_preview_reviewer`).
- Spawn 2 Challengers (`teamwork_preview_challenger`).
- Spawn 1 Forensic Auditor (`teamwork_preview_auditor`).
- Collect reports, evaluate in `GATE_STATUS.md`.
- Pass criteria: Build passes (33/33 static routes), tests pass (100%), both Reviewers APPROVE, both Challengers APPROVE, Auditor CLEAN.

---

## Milestone 3: Purpose-Built Image Workstations
- `/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/smart-compress`, `/image-metadata`, `/image-studio` (including missing `layout.tsx`).

## Milestone 4: Comprehensive PDF Workstations
- `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, `/pdf-studio` (including missing `layout.tsx`).

## Milestone 5: Batch Processing, Pipelines & Utility Tools + Informational Pages
- `/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner` (including missing `layout.tsx`), `/inspect`, `/about`, `/privacy`, `/terms`, `/history`, `/branding`.

## Milestone 6: Final Verification, 100% E2E, Victory Claim
- Full E2E suite verification (all tiers), static build 33/33, final forensic audit, victory report to Sentinel.
