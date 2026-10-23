## 2026-10-23T14:20:41Z
You are Worker M2 (worker_m2) for Milestone 2: Homepage & Central Tools Directory Overhaul.

## Working Directory & Identity
- Subagent Role: Full-Stack Worker
- Your Working Directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m2
- Parent Orchestrator ID: eb7c7517-1271-47fc-acd9-e4891655cf74

## Mandatory References (Read Before Starting)
- ORIGINAL_REQUEST.md: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- Explorer Plan 1 (Homepage): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m2_g2_1\homepage_plan.md
- Explorer Plan 2 (Tools Directory): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m2_g2_2\tools_directory_plan.md
- Explorer Plan 3 (Tools Registry & Metadata): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m2_g2_3\tools_registry_plan.md

## Exclusive File Ownership
You have exclusive write ownership of:
- `filefixer/src/app/page.tsx`
- `filefixer/src/components/home/*` (modular components: HeroSection.tsx, SmartDropZone.tsx, StagedFilesSummary.tsx, PopularWorkflows.tsx, QuickActionGrid.tsx, FeaturedToolsGrid.tsx, PrivacyArchitecture.tsx, SupportedFormats.tsx, HomeFAQ.tsx, SupportBanner.tsx)
- `filefixer/src/app/tools/page.tsx`
- `filefixer/src/components/tools/ToolsDirectory.tsx`
- `filefixer/src/components/tools/ToolCard.tsx`
- `filefixer/src/lib/tools.ts`
- `filefixer/src/components/command/CommandCenter.tsx`
- `filefixer/src/app/image-studio/layout.tsx` (new)
- `filefixer/src/app/pdf-studio/layout.tsx` (new)
- `filefixer/src/app/privacy-cleaner/layout.tsx` (new)

DO NOT modify `public/images/filefixer_support_qr.png` under any circumstances.
Zero server uploads: all processing must remain 100% browser-native client-side.

## Implementation Tasks (Follow Plans Closely)
1. **Homepage Overhaul (`src/app/page.tsx` & `src/components/home/`)**:
   - Refactor `page.tsx` into modular components under `src/components/home/`.
   - Ensure the exact headline `"Fix your files. Keep them private."` is statically present in `src/app/page.tsx` and `HeroSection.tsx` to satisfy test assertion `TC-T1-R2-1`.
   - Update all legacy "13 tools" copy to dynamically reference `{TOOLS.length}` (20 tools).
   - Implement `HeroSection.tsx` with high-contrast zero-upload privacy badges and 4-metric strip with `.tabular-nums font-mono`.
   - Implement `SmartDropZone.tsx` and `StagedFilesSummary.tsx` with format auto-detection, drop-zone hover glow, and 1-click routing into workstations via `useFileStore`.
   - Implement `PopularWorkflows.tsx` showcasing 6 signature pipelines (Passport prep, E-commerce WebP optimization, Official doc merge & sign, Receipts to PDF, Privacy sanitizer, Bulk photo re-sequence) with visual step pills and launch buttons.
   - Implement `QuickActionGrid.tsx`, `FeaturedToolsGrid.tsx`, `PrivacyArchitecture.tsx`, `SupportedFormats.tsx`, `HomeFAQ.tsx`, `SupportBanner.tsx`.
   - Ensure touch targets >= 44px, universal `.tabular-nums` on all metrics, and WCAG AA contrast in both light (#F7F9FC) and dark (#0B1020).

2. **Central Tools Directory Overhaul (`src/app/tools/page.tsx`, `ToolsDirectory.tsx`, `ToolCard.tsx`)**:
   - Update `ToolCard.tsx` to render dedicated format pills/badges (`JPG`, `PNG`, `WebP`, `PDF`, etc.) with accessible WCAG AA colors, while preserving `tool.featureIndicator` in the footer.
   - Enforce `min-h-[44px]` touch targets on category buttons and search clear button.
   - Render fixed-width tabular metrics ("Showing X of 20 tools") with `<TabularNum>`.
   - Enhance `EmptyState` with `role="status"`, `aria-live="polite"`, context-aware text, and "Clear all filters" CTA.
   - Retain test invariants: `TOOLS`, `selectedCategory`, and `EmptyState` present in `ToolsDirectory.tsx`.

3. **Master Tools Registry & Synchronizations**:
   - Add aliases `href?: string; formats?: string[];` to `ToolItem` in `filefixer/src/lib/tools.ts`.
   - Create the 3 missing server `layout.tsx` metadata wrappers:
     - `filefixer/src/app/image-studio/layout.tsx`
     - `filefixer/src/app/pdf-studio/layout.tsx`
     - `filefixer/src/app/privacy-cleaner/layout.tsx`
   - Add the 5 missing catalog tools (`/image-metadata`, `/pdf-workspace`, `/batch-rename`, `/inspect`, `/history`) to `allItems` in `filefixer/src/components/command/CommandCenter.tsx`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Verification Requirements
You MUST run the following commands and verify clean passes:
1. `npm test --prefix filefixer` — all 133 tests must pass.
2. `npm run build --prefix filefixer` — all 33 static routes must build with exit code 0.
Document commands, outputs, and verified layout in your `handoff.md`.
Notify the orchestrator via send_message when complete.
