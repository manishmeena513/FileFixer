# Project: FileFixer — Cinematic Glass Utility Studio Transformation

## Architecture
- **Framework & Runtime**: Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS v4, Turbopack.
- **Client Architecture**: 100% on-device processing with zero server uploads (0 API endpoints, 0 outbound egress calls).
- **Processing Engines**:
  - Image: Canvas rasterization, Web Workers (`browser-image-compression`), `exifr` metadata inspection & stripping.
  - PDF: `pdf-lib` & `pdfjs-dist` in-memory document manipulation.
  - Archives: `jszip` for client-side multi-file ZIP generation.
  - Storage: In-browser IndexedDB (`filefixer_db`) for telemetry/history (no file blobs stored).
- **Cinematic Glass Design System**:
  - Deep obsidian/navy canvas background with atmospheric electric-blue (`#3B82F6`) and violet (`#8B5CF6`) ambient glows.
  - Frosted glass surfaces (~55% opacity, `rgba(20, 29, 47, 0.68)`, elevated `rgba(29, 42, 65, 0.76)`, selective backdrop blur 12-20px).
  - Fine low-opacity borders (`rgba(148, 163, 184, 0.18)`) with luminous edge highlights (`rgba(96, 165, 250, 0.35)`).
  - High-contrast dedicated light theme (Canvas `#F4F7FC`, primary surface `#FFFFFF`, secondary `#EDF2F9`, primary blue `#2563EB`, violet `#6D4AFF`).
  - Typography: Geist Sans, Geist Mono, universal `.tabular-nums font-mono` for all numeric metrics to eliminate CLS.
  - Shell: Sticky frosted glass Header, floating glass dock MobileBottomNav (≥48px), CommandCenter search palette, DownloadDock, and voluntary SupportModal.
  - Mandatory Invariants: 33 static routes prerendered (`○`), 376/376 tests passing, QR SHA-256 intact, zero server endpoints.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Cinematic Glass Tokens & Calibration | Declare Dark Canvas `#070A12`, Secondary `#0B1020`, Glass surfaces, Electric Blue, Bright Blue, Violet accents; Light theme `#F4F7FC` / `#EDF2F9`; maintain strict test assertions | G1 | Survey 1, R1 |
| 2 | Component Elevation & Touch Targets | Update `ToolSection`, `card.tsx`, `TabularNum.tsx` (`font-mono`), `slider.tsx`, and fix `FileCard.tsx` remove button touch target (≥44px) | G1 | Survey 1, R1, R5 |
| 3 | Global Header & Dropdowns | Sticky frosted glass header, standardize search/shortcuts/theme triggers to `h-11 min-h-[44px]` across all viewports | G2 | Survey 2, R2 |
| 4 | Floating Glass Mobile Bottom Nav | Transform into floating glass dock pill (`bottom-3 left-3 right-3 rounded-2xl`) maintaining all 5 items with `min-h-[48px]` | G2 | Survey 2, R2 |
| 5 | Command Center & Shortcuts Dialog | Backdrop blur upgrade, electric-blue outer glow halo, `min-h-[44px]` clear trigger and `min-h-[48px]` option items | G2 | Survey 2, R2 |
| 6 | Delivery System & Download Modals | Elevate `DownloadDock`, `FileDeliveredModal`, and migrate `DownloadCenterModal` from solid card to glass tokens | G2 | Survey 2, R2 |
| 7 | Support Modal & Invariant QR | Strictly preserve `public/images/filefixer_support_qr.png` (SHA-256: 8592BD8A...); session-throttled, voluntary, non-blocking | G2 | Survey 2, R2 |
| 8 | Homepage Cinematic Hero & Drop Zone | Gradient typography (electric-blue to violet), glowing client-side trust badges, frosted drop zone with radiant drag pulse | G3 | Survey 3, R3 |
| 9 | Curated Workflows & Tool Cards | Interactive glass cards for workflows, quick action tiles, dynamic 20-tools count | G3 | Survey 3, R3 |
| 10 | Central Tools Directory (/tools) | Frosted search bar, category filter chips with active glowing states, dynamic tabular counters, responsive glass cards | G3 | Survey 3, R3 |
| 11 | Image Studio (/image-studio) | Unified canvas workspace, frosted tool controls, dimensional inspectors | G4 | Survey 3, R4 |
| 12 | Image Compress & Smart Compress | Frosted settings panels, dual mode compression, quality dials, before/after compare slider with `.tabular-nums font-mono` | G4 | Survey 3, R4 |
| 13 | Image Resize & Convert | Dimension inputs with aspect ratio lock, format picker (WebP, PNG, JPEG, AVIF), glass batch queue | G4 | Survey 3, R4 |
| 14 | Image Crop & Metadata Tool | Visual crop overlays, EXIF/GPS viewer, and 1-click metadata scrubbing in frosted glass panels | G4 | Survey 3, R4 |
| 15 | PDF Studio (/pdf-studio) | Comprehensive visual PDF workbench with glass tool panels and thumbnail strip | G5 | Survey 3, R4 |
| 16 | PDF Merge & Split | Multi-file page aggregation, range token parsing, visual thumbnail picker, individual/combined downloads | G5 | Survey 3, R4 |
| 17 | PDF Compress & Workspace | Metadata object stream cleanup, visual page reordering, 90° rotation, page extraction | G5 | Survey 3, R4 |
| 18 | Images to PDF | Multi-image queue, page size presets (A4, Letter), auto-orientation, drag-and-drop sorting | G5 | Survey 3, R4 |
| 19 | Batch Queue & Workflows | Sequential processing pipeline, progress telemetry, partial retry, drag-and-drop workflow recipes | G6 | Survey 3, R4 |
| 20 | Batch Rename & Privacy Cleaner | Live regex pattern preview, EXIF/GPS header inspector, document sanitization checklist | G6 | Survey 3, R4 |
| 21 | Utilities (/inspect, /history, /workspace) | Deep technical file inspector, IndexedDB telemetry KPIs, session workspace | G6 | Survey 3, R4 |
| 22 | Informational Pages (/about, /privacy, /terms, /branding)| Clean editorial typography on glass backdrop, zero-upload architecture diagrams, brand asset downloads | G6 | Survey 3, R4 |
| 23 | Final Verification & Quality Gates | 376/376 tests pass, 33/33 static routes prerender with exit code 0, 0 API endpoints, QR hash verified, commit & push | G7 | Survey 1, 2, 3, AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| G1 | Design System & Token Foundation | `globals.css`, `tailwind.config.ts`, `ToolSection.tsx`, `TabularNum.tsx`, `FileCard.tsx` touch target | none | DONE |
| G2 | Global Application Shell & Modals | `Header`, `MobileBottomNav` (floating dock), `Footer`, `CommandCenter`, `DownloadDock`, `DownloadCenterModal`, `SupportModal` | G1 | DONE |
| G3 | Homepage & Central Tools Directory | `/` (Hero, DropZone, Workflows), `/tools` (Search, Filters, dynamic counters, glass cards) | G1, G2 | IN_PROGRESS |
| G4 | Image Workstations Suite | `/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/smart-compress`, `/image-metadata`, `/image-studio` | G1 | PLANNED |
| G5 | PDF Workstations Suite | `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, `/pdf-studio` | G1 | PLANNED |
| G6 | Batch, Utilities & Informational Pages | `/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner`, `/inspect`, `/history`, `/about`, `/privacy`, `/terms`, `/branding` | G1 | PLANNED |
| G7 | Final Quality Gates & Victory Claim | 376/376 tests pass, 33/33 static routes prerender, Forensic Integrity CLEAN, Git commit & push, Victory Claim | G1-G6 | PLANNED |

## Interface Contracts
### Design Tokens (`globals.css`) ↔ Components
- CSS Variables (Dark):
  - Canvas: `--canvas-bg: #070A12;`
  - Body Background: `--background: 226 49% 8.4%;` (`#0B1020`, strictly asserted by tests)
  - Card / Solid Fallback: `--card: 220 39% 11%;` (`#111827`)
  - Primary / Electric Blue: `--primary: 217 91% 60%;` (`#3B82F6`)
  - Glass Surface: `--glass-surface: rgba(20, 29, 47, 0.68);`
  - Elevated Glass Surface: `--glass-surface-elevated: rgba(29, 42, 65, 0.76);`
  - Subtle Border: `--glass-border: rgba(148, 163, 184, 0.18);`
  - Luminous Border: `--glass-border-luminous: rgba(96, 165, 250, 0.35);`
  - Ambient Glows: `--ambient-glow-1: rgba(59, 130, 246, 0.22);` (Electric Blue), `--ambient-glow-2: rgba(139, 92, 246, 0.18);` (Violet)
- CSS Variables (Light):
  - Canvas: `--canvas-bg: #F4F7FC;`
  - Body Background: `--background: 216 45% 97.8%;` (`#F7F9FC`)
  - Card / Primary Surface: `--card: 0 0% 100%;` (`#FFFFFF`)
  - Secondary Surface: `--surface-secondary: 215 50% 95.3%;` (`#EDF2F9`)
  - Primary Blue: `--primary: 221 83% 53%;` (`#2563EB`)
  - Ambient Glow 2: `--ambient-glow-2: rgba(109, 74, 255, 0.05);` (`#6D4AFF`)
- Typography:
  - Class `.tabular-nums font-mono` MUST be applied to all file sizes, percentages, resolutions, counters, and metrics.

### Shared State (`src/stores/fileStore.ts`) ↔ Tool Pages & Download Dock
- `pushDownload(item: DownloadItem)`: Adds delivered file to global dock, updates badge count, writes telemetry to IndexedDB.
- `triggerSupportPrompt()`: Checks `sessionStorage.getItem("filefixer_support_prompt_shown")`. Displays non-blocking voluntary prompt after 1200ms delay.
- QR Asset Invariant: `public/images/filefixer_support_qr.png` SHA-256 `8592BD8A18457F3AC496D6735C472D7C4F3239E87B93771ED238D348B87D4744`.

### Code Layout
- `filefixer/src/app/`: Next.js App Router static pages and layout files.
  - `globals.css`: Design system tokens, glassmorphism utilities, and `.tabular-nums`.
  - `layout.tsx`: Root shell, atmospheric background glows, header, footer, mobile bottom nav, providers.
  - `page.tsx`: Homepage.
  - `tools/page.tsx`: Central tools directory.
- `filefixer/src/components/`:
  - `layout/`: `Header.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`, `WorkspaceDrawer.tsx`.
  - `command/`: `CommandCenter.tsx`.
  - `ui/`: Primitives (`button.tsx`, `slider.tsx`, `switch.tsx`, `checkbox.tsx`, `card.tsx`, `ToolSection.tsx`, `TabularNum.tsx`).
  - `download/`: `DownloadDock.tsx`, `FileDeliveredModal.tsx`, `DownloadCenterModal.tsx`.
  - `support/`: `SupportPrompt.tsx`, `SupportModal.tsx`, `FooterSupportButton.tsx`.
  - `results/`: `BeforeAfter.tsx`.
- `filefixer/src/lib/`:
  - `image/`: Canvas, compression, conversion, resize, transform, metadata engines.
  - `pdf/`: `pdf-lib` merge, split, compress, workspace, imagesToPdf engines.
  - `batch/`: `batchProcessor.ts`.
  - `storage/`: `history.ts` (IndexedDB).
  - `tools.ts`: Master catalog of 20 tools.
- `filefixer/public/`: Static assets (`manifest.json`, `sw.js`, `images/filefixer_support_qr.png`).
- `filefixer/tests/`: Test suite run via `npx tsx --test tests/*.test.ts`.
