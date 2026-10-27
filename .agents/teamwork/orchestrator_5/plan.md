# Execution Plan — Orchestrator 5 (Cinematic Glass Transformation)

## Objective
Transform FileFixer across all 33 static routes into a Cinematic Glass Utility Studio adhering to all styling, performance, accessibility, testing, and privacy invariants.

## Phase Structure

### Step 0: Survey & Current Codebase Assessment (Current)
- Dispatch 3 Explorers / Spec Miners:
  1. `explorer_glass_survey_1`: Survey design system foundation, `globals.css`, `tailwind.config`, current token values, glass utility classes, and contrast compliance.
  2. `explorer_glass_survey_2`: Survey application shell components (`Header.tsx`, `MobileBottomNav.tsx`, `Footer.tsx`, `CommandCenter.tsx`, `DownloadDock.tsx`, `SupportModal.tsx`, `WorkspaceDrawer.tsx`), modal triggers, and QR code integration.
  3. `explorer_glass_survey_3`: Survey all 33 static routes, test suites (verifying 376 test baseline), build commands, and layout wrapper files.
- Aggregate survey reports into updated `PROJECT.md` Feature Inventory.

### Phase 1: Cinematic Glass Design System & Tokens
- Worker updates `globals.css` and Tailwind theme configurations:
  - Calibrate Dark Palette (Canvas #070A12, Secondary #0B1020, Glass surfaces, Electric Blue #3B82F6, Violet #8B5CF6, luminous borders).
  - Calibrate Light Palette (Canvas #F4F7FC, Primary Surface #FFFFFF, Secondary #EDF2F9, Blue #2563EB, Violet #6D4AFF).
  - Implement balanced glassmorphism (~55% opacity, 12-20px backdrop blur, subtle borders with luminous highlights, diffuse atmospheric lighting).
- Reviewers, Challengers, and Forensic Auditor verify contrast, build, tests, and tokens.
- Gate check & commit.

### Phase 2: Global Application Shell & Modals
- Worker updates shell components (`Header.tsx`, `MobileBottomNav.tsx`, `Footer.tsx`, `CommandCenter.tsx`, `DownloadDock.tsx`, `SupportModal.tsx`, `WorkspaceDrawer.tsx`).
- Touch targets ≥ 48px on mobile nav, ≥ 44px on interactive controls.
- QR integrity strictly preserved.
- Gate check & commit.

### Phase 3: Homepage & Central Tools Directory
- Worker updates `/` (Homepage hero, frosted drop zone with drag pulse, curated workflows, trust badges) and `/tools` (frosted search, active glowing filter chips, dynamic tabular counters, responsive glass cards).
- Gate check & commit.

### Phase 4: Image Workstations
- Worker updates Image tool pages (`/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/smart-compress`, `/image-metadata`, `/image-studio`).
- Frosted `ToolSection` panels, comparison sliders, tabular stats.
- Gate check & commit.

### Phase 5: PDF Workstations
- Worker updates PDF tool pages (`/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, `/pdf-studio`).
- Glass page thumbnail grids, range selectors, delivery flow.
- Gate check & commit.

### Phase 6: Batch & Utility Workstations
- Worker updates Batch & Utilities (`/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner`, `/inspect`, `/history`, `/about`, `/privacy`, `/terms`, `/branding`).
- High-density glass panels, clear input/output distinction, clean typography.
- Gate check & commit.

### Phase 7: Final Quality Gates & Victory Claim
- Comprehensive opaque-box and adversarial tests.
- Verify 33/33 static routes prerender with exit code 0 (`npm run build`).
- Verify 376/376 tests pass (`npm test`).
- Verify SHA-256 hash of `public/images/filefixer_support_qr.png`.
- Verify 0 server routes in `src/app/api`.
- Commit and push to `origin main`.
- Issue Victory Claim message to Sentinel (`cfbc612d-370f-4b13-a758-88dab18fe6f1`).
