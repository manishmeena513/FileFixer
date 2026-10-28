# BRIEFING — 2026-10-27T19:42:00Z

## Mission
Transform FileFixer's Homepage and Central Tools Directory into a Cinematic Glass Utility Studio with 100% test pass and static build verification.

## 🔒 My Identity
- Archetype: worker_g3
- Roles: implementer, qa, specialist
- Working directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3
- Original parent: e777432b-b796-458a-8158-89882f6bd161
- Milestone: G3 (Homepage & Central Tools Directory)

## 🔒 Key Constraints
- Exclusive write ownership limited to:
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
- In HeroSection.tsx and page.tsx, STRICTLY PRESERVE verbatim strings: "Fix your files." and "Keep them private." (checked by tests).
- In HeroSection.tsx, FeaturedToolsGrid.tsx, and QuickActionGrid.tsx, STRICTLY PRESERVE dynamic reference to "TOOLS.length" (checked by tests).
- In ToolsDirectory.tsx, STRICTLY PRESERVE: role="status" and aria-live="polite" on empty state container, "Clear all filters" button, and setSelectedCategory("all") + setSearchQuery("") in the clear handler.
- All numeric metrics, counters, and file sizes use .tabular-nums font-mono.
- All interactive touch targets >= 44x44px with touch-manipulation.
- All tests must pass: cd filefixer && npx tsx --test tests/*.test.ts (100%).
- Static build must pass: cd filefixer && npm run build (33/33 static routes, exit code 0).
- QR code asset invariant: NEVER modify filefixer/public/images/filefixer_support_qr.png.

## Current Parent
- Conversation ID: e777432b-b796-458a-8158-89882f6bd161
- Updated: not yet

## Task Summary
- **What to build**: Cinematic Glass UI elevation for Homepage components (HeroSection, PopularWorkflows, QuickActionGrid, FeaturedToolsGrid, SmartDropZone, StagedFilesSummary, SupportedFormats, PrivacyArchitecture, SupportBanner, HomeFAQ, DropZone) and Tools Directory (ToolsDirectory, ToolCard, /tools/page.tsx).
- **Success criteria**: 100% test pass, exit code 0 on npm run build, full adherence to glass tokens and invariants.
- **Interface contracts**: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- **Code layout**: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md § Code Layout

## Key Decisions Made
- Initialized briefing and verified scope constraints and test assertions.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Clean
- **Tests added/modified**: None (preserving test suite)

## Loaded Skills
- None yet

## Artifact Index
- c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3\DISPATCH.md — Assignment and constraints
- c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3\BRIEFING.md — Working memory
- c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g3\progress.md — Heartbeat and status
