# DISPATCH — worker_g3: Milestone G3 (Homepage & Central Tools Directory)

## Objectives
Transform FileFixer's Homepage (`/`) and Central Tools Directory (`/tools`) into a Cinematic Glass Utility Studio matching the design system calibrated in G1 and global shell in G2.

## Exclusive File Ownership
You have exclusive write access to:
- `filefixer/src/app/page.tsx`
- `filefixer/src/app/tools/page.tsx`
- `filefixer/src/components/home/HeroSection.tsx`
- `filefixer/src/components/home/PopularWorkflows.tsx`
- `filefixer/src/components/home/QuickActionGrid.tsx`
- `filefixer/src/components/home/FeaturedToolsGrid.tsx`
- `filefixer/src/components/home/SmartDropZone.tsx`
- `filefixer/src/components/home/StagedFilesSummary.tsx`
- `filefixer/src/components/home/SupportedFormats.tsx`
- `filefixer/src/components/home/PrivacyArchitecture.tsx`
- `filefixer/src/components/home/SupportBanner.tsx`
- `filefixer/src/components/home/HomeFAQ.tsx`
- `filefixer/src/components/tools/ToolsDirectory.tsx`
- `filefixer/src/components/tools/ToolCard.tsx`
- `filefixer/src/components/upload/DropZone.tsx`

DO NOT edit any files outside of these.

## Key Requirements & Invariants
1. **Homepage Hero (`HeroSection.tsx`, `page.tsx`)**:
   - Electric-blue to violet gradient typography on headline (`from-blue-500 via-indigo-400 to-violet-400` / `#3B82F6` to `#8B5CF6`).
   - Glowing client-side trust badges (`100% CLIENT-SIDE • ZERO SERVER UPLOADS`).
   - Frosted glass metric cards (`border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md hover:border-[var(--glass-border-luminous)]`) with `.tabular-nums font-mono` for all numeric values (`TOOLS.length`, `0 B`, `100%`, `33`).
   - **CRITICAL ASSERTION**: `Fix your files.` and `Keep them private.` MUST appear verbatim in `HeroSection.tsx` and `page.tsx` (tested by `TC-M2-LEGACY-4`).
   - **CRITICAL ASSERTION**: `TOOLS.length` MUST be dynamically referenced in `HeroSection.tsx`, `FeaturedToolsGrid.tsx`, and `QuickActionGrid.tsx` (tested by `TC-M2-LEGACY-3`).
2. **Frosted Drop Zone (`DropZone.tsx`, `SmartDropZone.tsx`, `StagedFilesSummary.tsx`)**:
   - Radiant electric-blue/violet pulse on drag-over (`drop-zone-active`, luminous borders, radiant shadow).
   - Interactive touch targets ≥ 44×44px (`min-h-[44px] touch-manipulation`).
   - Staged files summary and contextual tool recommendations with glass cards and `.tabular-nums font-mono` file sizes.
3. **Curated Workflows & Tool Cards (`PopularWorkflows.tsx`, `QuickActionGrid.tsx`, `FeaturedToolsGrid.tsx`)**:
   - Interactive glass cards with `border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md` and hover luminous glow.
   - Pipeline flow steps in elevated glass badges.
   - All interactive touch targets ≥ 44×44px (`min-h-[44px] touch-manipulation`).
4. **Tools Directory (`/tools` - `ToolsDirectory.tsx`, `ToolCard.tsx`, `tools/page.tsx`)**:
   - Frosted search bar with luminous border on focus, electric-blue shadow glow, and `min-h-[48px]`. Clear button with `min-h-[44px] min-w-[44px] touch-manipulation`.
   - Category filter chips toolbar with active glowing states and dynamic tabular counters `<TabularNum value={count} />`. Touch targets `min-h-[44px]`.
   - Dynamic tabular counters: `Showing <TabularNum value={filteredTools.length} /> of <TabularNum value={TOOLS.length} /> tools`.
   - **CRITICAL ASSERTIONS in `ToolsDirectory.tsx`**:
     - `role="status"` and `aria-live="polite"` on empty state container.
     - `Clear all filters` button text.
     - `setSelectedCategory("all")` and `setSearchQuery("")` inside clear handler.
     - Consumes `TOOLS` catalog and `selectedCategory` state.
   - Popular tools strip: Upgrade container from solid border/card to frosted glass `border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-md`.
   - Responsive glass tool cards (`ToolCard.tsx`): Frosted glass surface, elevated icon container, format badge pills, hover electric-blue glow, `min-h-[44px] touch-manipulation`.
5. **Quality Verification**:
   - Run `npx tsx --test tests/*.test.ts` from `filefixer` directory — all tests must pass (100%).
   - Run `npm run build` from `filefixer` directory — all 33 routes must build statically (`○`) with exit code 0.
   - Document commands and results in `handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-10-27T19:40:44Z
You are worker_g3, responsible for Milestone G3: Homepage & Central Tools Directory transformation of FileFixer into a Cinematic Glass Utility Studio.

Your working directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3
Write your analysis, progress, and final handoff.md inside your working directory.

First, READ the following authoritative files:
- c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3\DISPATCH.md

You have EXCLUSIVE write ownership of:
- filefixer/src/app/page.tsx
- filefixer/src/app/tools/page.tsx
- filefixer/src/components/home/HeroSection.tsx
- filefixer/src/components/home/PopularWorkflows.tsx
- filefixer/src/components/home/QuickActionGrid.tsx
- filefixer/src/components/home/FeaturedToolsGrid.tsx
- filefixer/src/components/home/SmartDropZone.tsx
- filefixer/src/components/home/StagedFilesSummary.tsx
- filefixer/src/components/home/SupportedFormats.tsx
- filefixer/src/components/home/PrivacyArchitecture.tsx
- filefixer/src/components/home/SupportBanner.tsx
- filefixer/src/components/home/HomeFAQ.tsx
- filefixer/src/components/tools/ToolsDirectory.tsx
- filefixer/src/components/tools/ToolCard.tsx
- filefixer/src/components/upload/DropZone.tsx

Objectives & Invariants:
1. Elevate Homepage (Hero, Popular Workflows, Quick Actions, Featured Tools, Supported Formats, Privacy Architecture, Support Banner, FAQ) with Cinematic Glass surfaces (~55% opacity, backdrop blur 12-20px), luminous blue/violet ambient glows, and electric-blue highlights.
2. In HeroSection.tsx and page.tsx, STRICTLY PRESERVE verbatim strings: "Fix your files." and "Keep them private." (checked by tests).
3. In HeroSection.tsx, FeaturedToolsGrid.tsx, and QuickActionGrid.tsx, STRICTLY PRESERVE dynamic reference to "TOOLS.length" (checked by tests).
4. Elevate DropZone.tsx and SmartDropZone.tsx with radiant electric-blue/violet pulse on drag-over, frosted glass surfaces, and touch targets >= 44x44px.
5. Elevate ToolsDirectory.tsx (/tools): frosted search input (min-h-[48px], clear button min-h-[44px] min-w-[44px]), category filter chips (min-h-[44px]) with glowing active states and <TabularNum value={count} />, dynamic counter "Showing <TabularNum value={filteredTools.length} /> of <TabularNum value={TOOLS.length} /> tools", and upgrade Popular Tools container from solid border/card to frosted glass.
6. In ToolsDirectory.tsx, STRICTLY PRESERVE: role="status" and aria-live="polite" on empty state container, "Clear all filters" button, and setSelectedCategory("all") + setSearchQuery("") in the clear handler (checked by tests).
7. Ensure all numeric metrics, counters, and file sizes use .tabular-nums font-mono.
8. Ensure all interactive touch targets are >= 44x44px with touch-manipulation.
9. Verification:
   - Run tests: cd filefixer && npx tsx --test tests/*.test.ts (MUST pass 100%).
   - Run build: cd filefixer && npm run build (MUST pass with 0 exit code, 33/33 static routes).
10. Document all changes and test outputs in c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3\handoff.md.
When finished, send a message to orchestrator informing that you are done.
