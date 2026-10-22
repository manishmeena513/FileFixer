# Project: FileFixer Premium Transformation

## Architecture
- **Framework & Runtime**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Turbopack.
- **Client Architecture**: 100% on-device processing with zero server uploads (0 API endpoints, 0 outbound egress calls).
- **Processing Engines**:
  - Image: Canvas rasterization, Web Workers (`browser-image-compression`), `exifr` metadata inspection & stripping.
  - PDF: `pdf-lib` & `pdfjs-dist` in-memory document manipulation.
  - Archives: `jszip` for client-side multi-file ZIP generation.
  - Storage: In-browser IndexedDB (`filefixer_db`) for telemetry/history (no file blobs stored).
- **Design System & Shell**:
  - Swiss/minimalist high-contrast aesthetic with data-dense clarity.
  - Themes: Dark (`#0B1020`, `226 49% 8.4%`) and Light (`#F7F9FC`, `216 45% 97.8%`) with zero-flash local storage persistence.
  - Typography: Geist Sans, Geist Mono, with universal `.tabular-nums` across all numeric metrics to eliminate CLS.
  - Shell: Responsive `Header`, accessible `CommandCenter` search palette, touch-friendly `MobileBottomNav` (≥44px), and `Footer`.
  - Delivery: Floating `DownloadDock`, celebratory `FileDeliveredModal`, and session-throttled voluntary UPI QR `SupportModal`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Theme Tokens & Calibration | Calibrate CSS variables to `#0B1020` (dark) and `#F7F9FC` (light); fix WCAG AA contrast for dark primary and success | M1 | Survey 1, R1 |
| 2 | Component Touch Target Sizing | Update Button, Slider, Switch, Checkbox, and icon buttons to ensure ≥44px touch targets on mobile | M1 | Survey 1, R5 |
| 3 | Application Shell & Header | Redesign Header with navigation dropdowns, ARIA disclosure tags, and accessible search trigger | M1 | Survey 1, R1 |
| 4 | CommandCenter Search Palette | Add listbox ARIA role and keyboard Tab focus trapping to command search | M1 | Survey 1, R1 |
| 5 | Mobile Bottom Navigation | Preserve <=5 items with ≥48px touch targets, active route indicator, and bottom padding coordination | M1 | Survey 1, R1 |
| 6 | Global Typography & Tabular Numerals | Enforce `.tabular-nums` universally on formatBytes, countdowns, and progress counters | M1 | Survey 1, R1 |
| 7 | Homepage Smart Drop Zone | Hero redesign with "Fix your files. Keep them private.", interactive drag-and-drop zone, file auto-routing | M2 | Survey 2, R2 |
| 8 | Popular Workflows & Stats | Quick-access popular workflows, dynamic 20-tools count (remedying legacy 13 tools copy) | M2 | Survey 2, R2 |
| 9 | Central Tools Directory (/tools) | Category-filtered workspace catalog (Images, PDF, Batch, Utilities), search filter, responsive format cards | M2 | Survey 2, R2 |
| 10 | Tools Catalog Empty States & Badges | High-clarity format tags, accessible empty filter states, keyboard navigable cards | M2 | Survey 2, R2 |
| 11 | Image Studio (/image-studio) | Unified canvas workspace, editing tools, add missing layout.tsx metadata wrapper | M3 | Survey 2, R3 |
| 12 | Image Compress & Smart Compress | Dual mode compression, quality dials, before/after compare slider with tabular-nums | M3 | Survey 3, R3 |
| 13 | Image Resize & Convert | Dimensional inspector, aspect ratio lock, format picker (WebP, PNG, JPEG, AVIF) | M3 | Survey 3, R3 |
| 14 | Image Crop & Metadata Tool | Visual crop overlays, EXIF/GPS viewer and single-click metadata scrubbing | M3 | Survey 3, R3 |
| 15 | PDF Studio (/pdf-studio) | Comprehensive visual PDF workbench, add missing layout.tsx metadata wrapper | M4 | Survey 2, R3 |
| 16 | PDF Merge & Split | Multi-file page aggregation, range token parsing (e.g. 1-3, 5), individual/combined downloads | M4 | Survey 3, R3 |
| 17 | PDF Compress & Workspace | Metadata object stream cleanup, visual page reordering, rotation, page extraction | M4 | Survey 3, R3 |
| 18 | Images to PDF | Multiple image upload, page size presets (A4, Letter), auto-orientation, drag-and-drop sorting | M4 | Survey 3, R3 |
| 19 | Batch Queue & Workflows | Sequential processing pipeline, progress telemetry, partial retry, drag-and-drop workflow recipes | M5 | Survey 3, R3 |
| 20 | Batch Rename & Privacy Cleaner | Live regex pattern preview, EXIF/GPS header inspector, add missing layout.tsx for privacy cleaner | M5 | Survey 2, Survey 3, R3 |
| 21 | Delivery System (Dock & Modal) | Floating DownloadDock, celebratory FileDeliveredModal with before/after savings, ZIP download center | M5 | Survey 3, R4 |
| 22 | Voluntary Support Modal | Session-throttled prompt (1200ms delay), verified filefixer_support_qr.png display, non-blocking dismiss | M5 | Survey 3, R4 |
| 23 | Informational Pages & Telemetry | Clean editorial typography for /about, /privacy, /terms, and IndexedDB telemetry KPIs on /history | M5 | Survey 2, Survey 3, R3 |
| 24 | E2E Opaque-Box Test Suite | Comprehensive Playwright/runner tests covering Tiers 1-4 across all 26 user pages and core workflows | E2E | R5, AC |
| 25 | Final Route & Build Parity Gate | Verify all 33 static routes build with exit code 0, 0 TS errors, 0 ESLint blocking errors, 100% tests pass | M6 | Survey 1, Survey 2, Survey 3, AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent requirement-driven test suite (Tiers 1-4) | none | DONE |
| M1 | Design System & Global Shell | Token calibration, WCAG AA contrast, Button/Input sizes (≥44px), Header, CommandCenter, MobileBottomNav, globals.css | none | DONE |
| M2 | Homepage & Tools Catalog | Homepage hero, smart drop zone, 20 tools copy, /tools catalog search, category filters, cards | M1 | IN_PROGRESS |
| M3 | Image Tools Suite | /image-studio, /compress-image, /resize-image, /convert-image, /crop-image, /smart-compress, /image-metadata + layout.tsx | M1 | PLANNED |
| M4 | PDF Tools Suite | /pdf-studio, /pdf-merge, /pdf-split, /pdf-compress, /pdf-workspace, /images-to-pdf + layout.tsx | M1 | PLANNED |
| M5 | Batch Pipelines & Delivery | /batch, /batch-rename, /workflows, /privacy-cleaner (+ layout.tsx), /history, /about, /privacy, /terms, DownloadDock, SupportModal | M1 | PLANNED |
| M6 | Final Verification & Quality Gates | 100% E2E test suite pass, Tier 5 adversarial hardening, static build 33/33 pass, Forensic Integrity Clean | E2E, M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### Design Tokens (`globals.css`) ↔ Components
- CSS Variables:
  - `--background`: Light `216 45% 97.8%` (`#F7F9FC`), Dark `226 49% 8.4%` (`#0B1020`)
  - `--foreground`: Light `222 47% 11%` (`#0F172A`), Dark `210 40% 98%` (`#F8FAFC`)
  - `--primary`: Light `221 83% 53%` (`#2563EB`), Dark `217 91% 60%` (`#3B82F6`)
  - `--primary-foreground`: Dark `#0F172A` (ensuring ≥4.5:1 WCAG AA contrast against primary)
  - `--success-foreground`: Dark `#0F172A` (ensuring ≥4.5:1 WCAG AA contrast)
  - `--muted-foreground`: Light `215 25% 35%` (`#334155`, ensuring ≥4.5:1 against light background)
- Typography:
  - Class `.tabular-nums` MUST be applied to all file byte sizes, percentages, resolutions, and progress numbers.

### Shared State & Stores (`src/stores/fileStore.ts`) ↔ Tool Pages & Download Dock
- Function `pushDownload(item: DownloadItem)`:
  - Adds delivered file to global dock.
  - Updates badge count.
  - Automatically records telemetry event in IndexedDB history.
- Function `triggerSupportPrompt()`:
  - Checks `sessionStorage.getItem("filefixer_support_prompt_shown")`.
  - If unset, sets flag and displays `SupportPrompt` after 1200ms delay.
  - Never blocks file download or page interaction.

### Tool Catalog Data (`src/lib/tools.ts`) ↔ UI Consumers
- `TOOLS: Tool[]` array of 20 tools.
- Categories: `image` (6), `pdf` (6), `batch` (3), `utility` (5).
- Each tool defines: `id`, `name`, `description`, `icon`, `href`, `category`, `badge`, `formats`.
- Consumers (`/tools`, `/`, `CommandCenter`) filter by category, format, or keyword search.

## Code Layout
- `filefixer/src/app/`: Next.js App Router static pages and layout files.
  - `globals.css`: Design system tokens, utilities, and `.tabular-nums`.
  - `layout.tsx`: Root shell, header, footer, mobile bottom nav, providers, theme script.
  - `page.tsx`: Homepage.
  - `tools/page.tsx`: Central tools directory.
  - `image-studio/`, `pdf-studio/`, `privacy-cleaner/`: Add missing `layout.tsx` metadata wrappers.
- `filefixer/src/components/`:
  - `layout/`: `Header.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`, `WorkspaceDrawer.tsx`.
  - `command/`: `CommandCenter.tsx`.
  - `ui/`: Primitives (`button.tsx`, `slider.tsx`, `switch.tsx`, `checkbox.tsx`, `card.tsx`, etc.).
  - `download/`: `DownloadDock.tsx`, `FileDeliveredModal.tsx`, `DownloadCenterModal.tsx`.
  - `support/`: `SupportPrompt.tsx`, `SupportModal.tsx`.
  - `results/`: `BeforeAfter.tsx`.
- `filefixer/src/lib/`:
  - `image/`: Canvas, compression, conversion, resize, transform, metadata engines.
  - `pdf/`: `pdf-lib` merge, split, compress, workspace, imagesToPdf engines.
  - `batch/`: `batchProcessor.ts`.
  - `storage/`: `history.ts` (IndexedDB).
  - `tools.ts`: Master catalog of 20 tools.
- `filefixer/public/`: Static assets (`manifest.json`, `sw.js`, `images/filefixer_support_qr.png`).
- `tests/` or `filefixer/tests/`: Opaque-box E2E test suite.
