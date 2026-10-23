# Original User Request

## 2026-10-22T17:10:34Z

Completely transform the FileFixer application into a premium, cohesive, modern, professional file utility platform across all screens, navigation, tool pages, components, and interactions while preserving every working feature and on-device privacy guarantee.

Working directory: c:\Users\nives\OneDrive\Documents\FileFixer
Integrity mode: development

## Requirements

### R1. Design System & Global Application Shell
Establish a unified, high-contrast, professional design system guided by the installed `ui-ux-pro-max` intelligence (minimalist/Swiss style, data-dense clarity, tabular numerals, semantic CSS variables for dark `#0B1020` and light `#F7F9FC` themes). Redesign the global navigation shell (header, collapsible command center search, desktop toolbars, mobile bottom navigation, and footer) with clear hierarchy and zero-flash theme persistence.

### R2. Homepage & Central Tools Directory Overhaul
Transform the homepage around "Fix your files. Keep them private." with an interactive smart drop zone, quick-access popular workflows, and a refined tools catalog. Overhaul the central `/tools` directory into a searchable, category-filtered workspace catalogue with clear format tags, responsive cards, and accessible empty states.

### R3. Comprehensive Tool Pages & Workstation Experience
Redesign every tool category with purpose-built layouts:
- **Image Tools** (`/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/smart-compress`, `/image-metadata`, `/image-studio`): High-clarity previews, before/after compare sliders, dimensional inspectors, and quality dials.
- **PDF Tools** (`/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, `/pdf-studio`): Visual thumbnail grids, drag-and-drop page reordering, page selection, and rotation.
- **Batch & Pipelines** (`/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner`, `/inspect`): Task-oriented tabular interfaces, per-file status badges, indeterminate progress indicators, and ZIP archiving.
- **Informational Pages** (`/about`, `/privacy`, `/terms`, `/history`): Clean editorial typography, IndexedDB telemetry KPIs, and local storage management.

### R4. Processing, Deliveries & Voluntary Support Integration
Elevate the processing lifecycle with honest status indicators, non-blocking floating Download Dock, and unified "File Delivered" modal cards. Preserve the voluntary Support FileFixer trigger and exact UPI QR modal (`public/images/filefixer_support_qr.png`) without modifying payment semantics or interfering with user downloads.

### R5. Responsive Design, Accessibility & Technical Preservation
Ensure full responsive fluidity from 320px mobile to 2560px ultra-wide screens, touch targets ≥44px, keyboard navigation, and `prefers-reduced-motion` compliance. Maintain zero server uploads (100% in-browser Canvas/Worker/Wasm processing), preserve all 33 existing routes, SEO metadata (`sitemap.ts`, `robots.ts`, `favicon.ico`), and PWA service worker caching.

## Acceptance Criteria

### Visual & Architectural Consistency
- [ ] CSS variable tokens in `globals.css` match the refined palette with high contrast (WCAG AA ≥4.5:1) in both dark and light modes.
- [ ] Tabular numerals (`.tabular-nums`) applied to all file sizes, percentages, and metrics to prevent layout shifts.
- [ ] Header, mobile navigation, and modal dialogs render consistently across all viewports without clipping or horizontal overflow.

### Functional Preservation & Tool Parity
- [ ] All 33 routes in `filefixer/src/app` remain functional with zero missing route errors.
- [ ] File processing (image compression, conversion, EXIF stripping, PDF merging/splitting, batch queue, IndexedDB history) functions locally without external network requests.
- [ ] Voluntary support modal displays the official `filefixer_support_qr.png` with non-blocking dismiss and accessible focus trapping.

### Verification & Quality Gates
- [ ] `npm run build --prefix filefixer` completes with exit code 0, generating all 33 static routes with zero TypeScript errors.
- [ ] Codebase passes linting checks with no blocking syntax errors or unhandled `any` types.
- [ ] Touch targets on mobile measure at least 44×44px, with visible focus rings on interactive elements.


## 2026-10-23T14:06:00Z

Completely transform the FileFixer application across all remaining tool pages, homepage, central directory, pipelines, and informational views into a premium, cohesive, modern file utility platform while preserving 100% on-device privacy, all 33 routes, and existing test suites.

Working directory: c:\Users\nives\OneDrive\Documents\FileFixer
Integrity mode: development

## Baseline State (Preserve & Build Upon)
- Commit `bd23a7b` is verified: 33/33 static routes prerendered, 133/133 tests passing.
- Global application shell (Header, CommandCenter, MobileBottomNav, ThemeToggle, Footer, TabularNum, WAI-ARIA modals) is complete.
- Palette tokens in `globals.css` calibrated to dark (#0B1020) and light (#F7F9FC) with WCAG AA compliance.
- QR asset `public/images/filefixer_support_qr.png` must NEVER be modified or regenerated.
- Zero server uploads: 100% browser-native client-side processing (Canvas, Web Workers, pdf-lib, jszip, exifr).

## Requirements

### R1. Homepage & Central Tools Directory Overhaul
Transform the homepage around "Fix your files. Keep them private." with an interactive smart drop zone routing files directly to compatible tools, popular workflows grid, and high-contrast privacy badges. Overhaul the central `/tools` directory into a responsive, searchable catalog with category filtering (Images, PDF, Batch, Utilities), live empty states, and tabular tool statistics.

### R2. Purpose-Built Image Workstations
Elevate all image tools with dedicated, task-specific workstations:
- `/compress-image`: Quality slider, target size presets, before/after compare slider, and tabular file metrics.
- `/resize-image`: Dimension inputs with aspect-ratio lock, percentage scaling, and preset aspect modes.
- `/convert-image`: Single and batch format conversion (JPG, PNG, WebP) with quality controls.
- `/crop-image`: Interactive canvas crop box, 90° rotation, horizontal/vertical flips, and aspect presets.
- `/smart-compress`: Progressive optimization passes targeting exact upload caps ("Under X MB").
- `/image-metadata`: Detailed sensor/camera metadata table, GPS location indicator, and EXIF sanitization.
- `/image-studio`: Multi-tool workspace integration.

### R3. Comprehensive PDF Workstations
Redesign all PDF utilities with professional document workflows:
- `/pdf-merge`: Multi-file upload list with reordering, removal, and consolidated output download.
- `/pdf-split`: Range parsing, interactive page selection, and ZIP extraction of single pages.
- `/pdf-compress`: Balanced vs. maximum savings profiles with embedded author metadata stripping.
- `/pdf-workspace`: Interactive thumbnail grid for page reordering, 90° rotation, deletion, and extraction.
- `/images-to-pdf`: Multi-image queue, page reordering, margin controls, and standard page sizing.
- `/pdf-studio`: Unified PDF manipulation hub.

### R4. Batch Processing, Pipelines & Utility Tools
- `/batch`: Tabular multi-file pipeline (Resize → Convert → Compress → Rename) with per-item status badges and ZIP bundling.
- `/batch-rename`: Numbering pattern templates, case conversion, date prefixing, and live preview list.
- `/workflows`: Multi-stage pipeline builder and runner.
- `/privacy-cleaner`: Local privacy sanitization checklist for images and documents.
- `/inspect`: Deep technical file inspector displaying MIME, EXIF tags, dimensions, and PDF dictionaries.

### R5. Informational Pages & Privacy Center
Refine `/about`, `/privacy`, `/terms`, `/history`, and `/branding` with clean editorial typography, zero-upload architecture diagrams, tabular IndexedDB session management, and downloadable brand assets.

## Acceptance Criteria

### Visual & Architectural Consistency
- [ ] Tabular numerals (`.tabular-nums`) applied to all file sizes, dimensions, percentages, and metrics to prevent layout shifts.
- [ ] Touch targets measure at least 44×44px on all interactive controls and mobile navigation elements.
- [ ] High contrast (WCAG AA ≥4.5:1) verified across all tool pages in both dark and light modes.

### Functional Preservation & Tool Parity
- [ ] All 33 routes in `filefixer/src/app` remain functional and prerender as static content with zero missing route errors.
- [ ] 100% on-device processing preserved with zero external network requests or server uploads.
- [ ] Voluntary support modal references `public/images/filefixer_support_qr.png` without blocking downloads or navigation.

### Verification & Quality Gates
- [ ] `npm run build --prefix filefixer` succeeds with exit code 0, generating all 33 static routes with zero TypeScript errors.
- [ ] `npm test` passes 100% of test suites with zero failures.
- [ ] All interactive buttons perform their advertised actions with honest indeterminate processing states.
