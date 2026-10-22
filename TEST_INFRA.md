# FileFixer E2E Test Infrastructure Specification

**Document Version**: 1.0.0  
**Date**: 2026-10-22  
**Track**: E2E Testing Track (Requirement-Driven, Opaque-Box)  
**Author**: Test Writer Agent (`test_writer_e2e`)  
**Target Environment**: Node.js 22+, TypeScript, Next.js 16 (App Router), `tsx`

---

## 1. Executive Summary & Testing Philosophy

FileFixer is a 100% client-side file transformation suite built on Next.js 16, React 19, and Tailwind CSS. The fundamental invariant of FileFixer is **absolute privacy through zero server uploads**: files never leave the user's browser, and all transformations occur on-device via Web Workers, HTML5 Canvas, `pdf-lib`, `exifr`, and `jszip`.

The E2E Test Suite implements an **opaque-box, requirement-driven verification harness**. Rather than mocking internal implementation details, the test suite verifies:
1. **Systematic 4-Tier Coverage** spanning all functional requirements (R1–R5) from `ORIGINAL_REQUEST.md`.
2. **Strict Invariant Verification**: Zero server API routes, zero outbound tracking/upload egress calls, mandatory touch target compliance (≥44px), and voluntary UPI QR code asset integrity.
3. **Core Transformation Engines**: Direct operational validation of PDF merging, range token parsing, batch sequencing, and optimization scoring algorithms.
4. **All 33 Static Application Routes**: Structural integrity, SEO metadata (`robots.txt`, `sitemap.xml`), and PWA service worker configurations.

---

## 2. Test Architecture & Runner Setup

The test suite runs natively on **Node.js 22 Test Runner** (`node:test`, `node:assert/strict`) via `tsx`:
- **Execution Command**: `npm test` (or `npx tsx --test tests/*.test.ts`)
- **Execution Speed**: < 5 seconds for complete suite execution.
- **Independence**: Every test is completely self-contained, idempotent, and requires zero remote services.

### Test Directory Layout
```
filefixer/tests/
├── tier1-feature-coverage.test.ts      # Tier 1: >=5 test cases per feature (R1-R5)
├── tier2-boundary-corner.test.ts       # Tier 2: >=5 boundary/corner cases per feature (R1-R5)
├── tier3-cross-feature.test.ts         # Tier 3: Pairwise cross-feature interaction flows
├── tier4-application-scenarios.test.ts # Tier 4: >=5 realistic end-to-end user workflows
├── privacy-invariant.test.ts           # Zero-Server Upload & Egress Invariant Audit
└── routes-and-design.test.ts           # 33-Route Parity, CSS Tokens & Touch Target Audit
```

---

## 3. Systematic 4-Tier Test Matrix

### Tier 1: Feature Coverage (>=5 Tests Per Feature)
Covering all primary behaviors and happy paths from `ORIGINAL_REQUEST.md`:

| Requirement | Description | Test Cases Included |
|---|---|---|
| **R1: Design System & Global Application Shell** | Unified high-contrast design system, semantic tokens, navigation shell | 1. Dark & Light theme CSS variable definitions in `globals.css`<br>2. Universal `.tabular-nums` CSS class definition for metrics<br>3. Header shell structure and accessible navigation elements<br>4. CommandCenter search palette initialization and keyboard shortcuts (Ctrl/Cmd+K)<br>5. MobileBottomNav 5-item ≤5 structure with active states and ≥48px touch targets |
| **R2: Homepage & Central Tools Directory** | Hero copy, smart drop zone, 20 tools catalog, category filtering | 1. Hero headline "Fix your files. Keep them private." consistency<br>2. Central catalog exact 20-tool definition and categorization<br>3. Category filters (`all`, `images`, `pdf`, `batch`, `utilities`) coverage<br>4. Format tag badge attribution across tools (JPG, PNG, WebP, PDF)<br>5. Empty state messaging and structure for zero-match filtering |
| **R3: Tool Pages & Workstation Experience** | Image tools, PDF tools, batch pipelines, informational pages | 1. Image format MIME conversion and extension utilities<br>2. PDF split page range parser handling standard comma & dash syntax (`1-3, 5`)<br>3. PDF multi-file merge validation and page counting logic<br>4. Batch sequence rename pattern engine with `#` sequence padding<br>5. Optimization score calculation across size, format, privacy, and dimensions |
| **R4: Processing, Deliveries & Voluntary Support** | Status indicators, Download Dock, File Delivered modal, Support QR modal | 1. Floating Download Dock queue addition and status tracking<br>2. Voluntary support prompt session-throttled display (1200ms delay, `sessionStorage`)<br>3. Official voluntary support QR code asset existence (`filefixer_support_qr.png`)<br>4. Non-blocking dismiss behavior of support dialog with focus restoration<br>5. File delivered modal payload structure with savings percentage |
| **R5: Responsive Design, Accessibility & Technical Preservation** | Responsive layout, touch targets ≥44px, zero server upload, 33 routes | 1. Touch target minimum height enforcement on interactive components (≥44px)<br>2. Zero-server upload invariant: `src/app/api` directory is empty<br>3. Route parity: All 26 user page routes verified in filesystem<br>4. SEO & metadata parity: `sitemap.ts`, `robots.ts`, and icons verified<br>5. PWA service worker caching and manifest existence |

### Tier 2: Boundary & Corner Cases (>=5 Tests Per Feature)
Covering extreme, invalid, empty, and edge conditions:

| Requirement | Boundary Conditions Tested |
|---|---|
| **R1 Boundaries** | 1. Fallback handling when unrecognized theme classes are encountered<br>2. `prefers-reduced-motion` zero-duration animation overrides<br>3. High contrast ratios on primary and success foregrounds<br>4. Surface elevation variable definitions in dark and light modes<br>5. Whitespace and empty query input handling in command center |
| **R2 Boundaries** | 1. Search queries with special regex meta-characters (`.*+?^${}()|[]\`)<br>2. Empty search queries correctly returning the entire 20-tool catalog<br>3. Non-existent category filter keys gracefully returning empty results<br>4. Unmatched multi-term queries triggering the accessible `EmptyState` component<br>5. Extremely long search strings (>100 characters) without breaking |
| **R3 Boundaries** | 1. PDF split range parser handling negative numbers and out-of-range bounds<br>2. PDF split range parser handling inverted ranges (e.g., `5-2`)<br>3. PDF split range parser handling malformed string tokens (`--`, `,,`, `abc`)<br>4. PDF merge rejecting single-file input with descriptive error<br>5. Batch rename pattern handling 0 hash symbols and extreme start index offsets |
| **R4 Boundaries** | 1. Multiple rapid support prompt triggers strictly throttled by `sessionStorage`<br>2. Download Dock maintaining maximum queue cap (20 items) without unbounded growth<br>3. Support modal image fallback UI for broken image state<br>4. Download item status transitions (`idle` → `downloading` → `downloaded` / `error`)<br>5. Download queue handling 0-byte delivered file entries |
| **R5 Boundaries** | 1. Outbound network request prevention (zero HTTP fetch calls to external APIs)<br>2. Touch targets on ultra-compact mobile viewports (320px screen width)<br>3. Malformed MIME types falling back safely to default format<br>4. Extension stripper handling filenames without extensions or leading dots<br>5. 404 route handling via `_not-found` page presence |

### Tier 3: Cross-Feature Combinations (Pairwise Interaction Tests)
Verifying integration points between independent components:
1. **Theme Mode Switch + Navigation**: Switching themes while navigating between tools maintains token consistency without flash.
2. **CommandCenter Search + Route Transition**: Searching in command center triggers direct routing to target workstation with modal dismissal.
3. **Batch Pipeline Rename + Conversion + Download Dock**: Chaining sequential rename with WebP conversion pushes properly formatted items to the Download Dock.
4. **PDF Split Multi-Output + Floating Dock**: Splitting a document into multiple files populates the download dock and updates badge counts.
5. **Processing Completion + File Delivered Modal + Support Prompt**: File processing completion opens the delivered modal without suppressing subsequent voluntary support triggers.
6. **Tool Catalog + Category Filtering + Smart Drop Routing**: Category filtering on `/tools` accurately reflects the tool definitions used by the homepage smart drop zone.
7. **Mobile Bottom Nav + Command Center Search Integration**: Activating search from the mobile bottom nav triggers the global command center without viewport distortion.

### Tier 4: Real-World Application Scenarios (>=5 Workflows)
1. **Scenario 1: High-Resolution Photographer Privacy & Optimization Pipeline**
   - User imports a camera JPEG with GPS tags and EXIF data.
   - Inspects metadata, strips coordinates via privacy cleaner, converts to modern WebP format, and computes optimization score (achieving "Optimal" or "Excellent" rating).
2. **Scenario 2: Corporate Multi-Report PDF Merge & Restructure**
   - User aggregates 3 separate quarterly PDF reports.
   - Merges them into a consolidated document, verifies combined page count, and validates download item generation.
3. **Scenario 3: Academic Thesis Chapter Extraction & Reassembly**
   - User selects chapters from a 50-page document using complex range syntax `"1-3, 5, 8-10"`.
   - Range parser isolates exact 0-indexed page offsets and stages extracted document for download.
4. **Scenario 4: Enterprise Bulk Batch Asset Standardization**
   - User processes 10 raw image files using template `"Project_Alpha_###"` starting at 100.
   - Renamer formats outputs as `"Project_Alpha_100.jpg"` through `"Project_Alpha_109.jpg"`, verifying ZIP archive readiness.
5. **Scenario 5: Sensitive Mobile Document Filing with Zero-Egress Guarantee**
   - Mobile citizen accesses FileFixer, navigates via mobile bottom nav to Smart Compress.
   - Verifies 0 external network requests occur during file loading and compression, downloads output, and views voluntary support dialog.

---

## 4. Invariant Verification Standards

### Invariant 1: Zero-Server Upload Privacy Invariant
- **Rule**: No file bytes or user data may be transmitted off the device.
- **Verification**:
  - `filefixer/src/app/api` directory MUST remain completely empty (0 API routes).
  - Client-side code MUST NOT initiate outbound POST/PUT multipart file uploads.
  - Telemetry MUST be isolated to in-browser IndexedDB (`filefixer_db`) and `sessionStorage`.

### Invariant 2: Touch Target Accessibility (WCAG 2.5.5 / 2.5.8)
- **Rule**: All interactive controls (buttons, links, nav items) MUST meet minimum touch target sizes (≥44px height/width on mobile).
- **Verification**:
  - `MobileBottomNav.tsx`: Interactive links and search button have `min-h-[48px]`.
  - Button primitive styles enforce touch-friendly dimensions.

### Invariant 3: Voluntary Support QR Code Integrity
- **Rule**: The voluntary support QR code MUST exist as an on-device asset and display without blocking downloads or navigation.
- **Verification**:
  - `filefixer/public/images/filefixer_support_qr.png` exists and is a valid PNG image (>500 KB).
  - Modal provides accessible focus trapping, escape dismissal, and background click dismiss.

### Invariant 4: Complete 33-Route Static Generation
- **Rule**: Next.js static build MUST compile all 33 routes with exit code 0.
- **Verification**:
  - 26 Page routes: `/`, `/tools`, `/workspace`, `/workflows`, `/image-studio`, `/pdf-studio`, `/privacy-cleaner`, `/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/image-metadata`, `/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`, `/batch`, `/batch-rename`, `/smart-compress`, `/inspect`, `/history`, `/about`, `/privacy`, `/terms`, `/branding`.
  - 7 Metadata & Static routes: `robots.txt`, `sitemap.xml`, `favicon.ico`, `icon.svg`, `apple-icon.png`, `manifest.json`, `sw.js`.

---

## 5. Running the Tests

```bash
# From filefixer directory:
cd filefixer
npm test

# Alternatively, directly via tsx:
npx tsx --test tests/*.test.ts
```

All test results report directly to the terminal in TAP / Node Test Runner format.
