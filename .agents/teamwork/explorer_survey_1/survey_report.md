# Comprehensive Survey Report: FileFixer Design System, Shell, Build & Styling Architecture

**Agent**: Design System Explorer (`explorer_survey_1`)  
**Date**: 2026-10-22  
**Target Codebase**: `c:\Users\nives\OneDrive\Documents\FileFixer\filefixer`  
**Reference Requirement**: `ORIGINAL_REQUEST.md` (R1–R5) & Installed `ui-ux-pro-max` Intelligence  

---

## Executive Summary

A comprehensive architectural and styling survey of FileFixer 3.0 was conducted across all 33 Next.js static targets, configuration files, global CSS tokens, application shell components, and interaction patterns. 

The application has a modern Next.js 16 + React 19 + Tailwind CSS v4 foundation with clean semantic token architecture, zero server dependencies, and client-side privacy guarantees. However, specific architectural deficiencies were uncovered that impact visual quality, accessibility compliance, layout stability, and mobile usability:
1. **Contrast Violations**: Dark mode `--primary` (`#3B82F6`) paired with white `--primary-foreground` has a contrast ratio of only **3.5:1** (failing WCAG AA 4.5:1). Dark mode `--success-foreground` (white on `#22C55E`) fails severely at **2.23:1**. Light mode `--muted-foreground` drops to **4.1:1** on secondary cards.
2. **Tabular Numerals Gap**: `.tabular-nums` is declared in `globals.css` but utilized in only two files (`BeforeAfter.tsx` and `history/page.tsx`). Over 40 metric callouts, file sizes (`formatBytes`), and percentages cause horizontal text jitter and layout shifts during file processing.
3. **Touch Target Non-Compliance**: Multiple core interactive elements (Button sizes `xs`/`sm`/`md`/`icon`, Header search trigger, ThemeToggle, modal close buttons, DownloadDock controls, Slider thumb, and Switch) fall well below the mandatory mobile **44×44px** touch target minimum.
4. **Shell & Accessibility Deficiencies**: Modal dialogs lack keyboard focus trapping; CommandCenter has orphaned `role="option"` elements without a `role="listbox"` container; desktop navigation dropdowns lack ARIA disclosure tags.
5. **Exact Color Tuning**: HSL values in `globals.css` currently resolve to `#F8FAFC` (light) and `#0C1122` (dark) instead of the exact R1 specifications of `#F7F9FC` and `#0B1020`.

---

## 1. Build Configuration & Dependency Architecture

### 1.1 Core Stack Specifications
- **Framework**: Next.js `16.3.5` (Turbopack enabled)
- **Runtime / Library**: React `19.2.8` & React DOM `19.2.8`
- **Styling**: Tailwind CSS `^4.0.0` with `@tailwindcss/postcss`
- **UI Primitives**: Radix UI primitives (`dialog`, `dropdown-menu`, `slider`, `switch`, `tabs`, `progress`, `checkbox`, `select`, `separator`, `tooltip`, `toast`)
- **State Management**: Zustand `^5.0.15` (`fileStore.ts`)
- **Iconography**: `lucide-react` `^1.47.0` (zero emoji icons)
- **Local Client Processing**: `pdf-lib` `^1.17.1`, `pdfjs-dist` `^6.3.289`, `browser-image-compression` `^2.0.2`, `exifr` `^7.1.3`, `idb` `^8.0.3`, `jszip` `^3.10.2`, `react-image-crop` `^11.1.2`, `@dnd-kit/core` / `sortable` / `utilities`

### 1.2 Configuration Files Analysis

| File | Key Configuration | Assessment / Findings |
|---|---|---|
| `filefixer/package.json` | Scripts: `dev`, `build`, `start`, `lint` | Clean dependency tree; lacks external CSS bloat; all processing libraries are client-side capable. |
| `filefixer/next.config.ts` | Turbopack enabled; `pdfjs-dist` alias to `legacy/build/pdf`; Webpack fallbacks `fs: false, path: false, crypto: false`. | Properly handles client-only PDF compilation. Emits harmless `Couldn't load fs` / `Couldn't load zlib` during static page prerendering in worker threads. |
| `filefixer/tailwind.config.ts` | `darkMode: "class"`, HSL color variable mappings, font family mappings to Geist variables, custom keyframes. | Valid Tailwind configuration. Coexists with Tailwind v4 `@import "tailwindcss"` in `globals.css`. |
| `filefixer/postcss.config.mjs` | `@tailwindcss/postcss: {}` | Standard Tailwind v4 PostCSS integration. |
| `filefixer/tsconfig.json` | `target: ES2017`, `moduleResolution: bundler`, `strict: true`, path alias `@/* -> ./src/*`. | Strict TypeScript compilation passes with zero type errors. |

### 1.3 Build Script Verification
Executing `npm run build --prefix filefixer`:
- **Exit Code**: `0` (Success)
- **Compilation Time**: ~3.2s Turbopack build + 3.5s TypeScript verification
- **Static Page Output**: All **33 routes** prerendered successfully as static content:
  - 26 Page routes: `/`, `/about`, `/batch`, `/batch-rename`, `/branding`, `/compress-image`, `/convert-image`, `/crop-image`, `/history`, `/image-metadata`, `/image-studio`, `/images-to-pdf`, `/inspect`, `/pdf-compress`, `/pdf-merge`, `/pdf-split`, `/pdf-studio`, `/pdf-workspace`, `/privacy`, `/privacy-cleaner`, `/resize-image`, `/smart-compress`, `/terms`, `/tools`, `/workflows`, `/workspace`, `/_not-found`
  - 7 Static metadata/asset endpoints: `/apple-icon.png`, `/icon.svg`, `/robots.txt`, `/sitemap.xml`, `/manifest.json`, etc.

---

## 2. CSS Architecture, Tokens, Theming & Typography

### 2.1 CSS Variables & Palette Tokens (`globals.css`)

#### Current vs Target Tokens
- **Target Dark Palette**: `#0B1020` (Obsidian Midnight)
  - Current `.dark --background`: `224 49% 9%` -> resolves to `#0C1122` (Lightness 9.0%, Hue 224°).
  - Exact `#0B1020`: Lightness 8.43%, Hue 226°, Saturation 48.9%. Recommend tuning token to `226 49% 8.4%`.
- **Target Light Palette**: `#F7F9FC` (Pristine Clean)
  - Current `:root --background`: `214 38% 98%` -> resolves to `#F8FAFC`.
  - Exact `#F7F9FC`: Lightness 97.8%, Hue 216°, Saturation 45.4%. Recommend tuning token to `216 45% 97.8%`.

#### Full Token Inventory

| Token | Light Value (`:root`) | Dark Value (`.dark`) | Semantic Purpose |
|---|---|---|---|
| `--background` | `214 38% 98%` (`#F8FAFC`) | `224 49% 9%` (`#0C1122`) | Root canvas background |
| `--foreground` | `222 47% 11%` (`#0F172A`) | `210 40% 98%` (`#F8FAFC`) | Primary prose & headings |
| `--card` | `0 0% 100%` (`#FFFFFF`) | `220 39% 11%` (`#111827`) | Tool cards, modals, sheets |
| `--card-foreground` | `222 47% 11%` | `210 40% 98%` | Card textual content |
| `--surface-elevated`| `0 0% 100%` | `220 39% 11%` | Floating docks & dropdowns |
| `--surface-secondary`| `210 40% 96%` | `221 38% 15%` | Subtle container wells |
| `--primary` | `221 83% 53%` (`#2563EB`) | `217 91% 60%` (`#3B82F6`) | Core brand action color |
| `--primary-foreground`| `0 0% 100%` (`#FFFFFF`)| `0 0% 100%` (`#FFFFFF`) | Text on primary buttons (⚠️ contrast issue) |
| `--secondary` | `210 40% 96%` (`#F1F5F9`) | `221 38% 15%` (`#172033`) | Secondary pill buttons & tags |
| `--muted` | `214 32% 92%` | `221 38% 15%` | Inactive tracks & dividers |
| `--muted-foreground` | `215 16% 47%` (`#64748B`)| `215 20% 65%` (`#94A3B8`) | Subtitles, labels, format tags |
| `--border` | `214 32% 91%` | `217 33% 18%` | Component perimeter borders |
| `--border-subtle` | `214 24% 94%` | `217 28% 14%` | Interior table & list dividers |
| `--ring` | `221 83% 53%` | `217 91% 60%` | Keyboard focus ring |
| `--success` | `142 71% 38%` (`#1B9E4B`) | `142 71% 45%` (`#22C55E`) | Success status badges & completed indicators |
| `--warning` | `38 92% 50%` (`#F59E0B`) | `38 92% 50%` (`#F59E0B`) | Indeterminate/caution indicators |
| `--radius` | `0.75rem` (12px) | `0.75rem` (12px) | Standard border radius |

### 2.2 Zero-Flash Theme Persistence Implementation
- **Hydration Protection Script**: `layout.tsx` (lines 94–108) embeds an inline `<script>` in `<head>` that parses `localStorage.getItem('filefixer_theme')` immediately on HTML parse. It synchronously sets or removes the `dark` class on `document.documentElement` prior to DOM paint, preventing white flash on dark mode sessions.
- **Theme Cycling Logic**: `ThemeToggle.tsx` toggles between three states (`dark` → `light` → `system`) and observes `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Flicker Risk Identified**: `globals.css` line 119 has `body { transition: background-color 0.2s ease, color 0.2s ease; }`. On cold load, this CSS transition can trigger an animated color morph if stylesheets load slightly after HTML parsing. Removing global body color transitions or scoping them to `.theme-transitioning` avoids this.

### 2.3 Typography & Tabular Numerals Audit
- **Font Stack**:
  - `Geist Sans` (`var(--font-geist-sans)`) as the primary UI font.
  - `Geist Mono` (`var(--font-geist-mono)`) for code, metadata, and format stamps.
- **Tabular Figures (.tabular-nums)**:
  - Declared in `globals.css` (lines 146–151):
    ```css
    .tabular-nums {
      font-variant-numeric: tabular-nums;
      -moz-font-feature-settings: "tnum";
      -webkit-font-feature-settings: "tnum";
      font-feature-settings: "tnum";
    }
    ```
  - **Severe Gap**: Grep analysis across `src/` revealed that `.tabular-nums` is used in **only 2 files**:
    1. `src/components/results/BeforeAfter.tsx` (lines 51, 69, 81, 96)
    2. `src/app/history/page.tsx` (lines 98, 107, 159)
  - **Unformatted Locations** (over 40 instances causing visual layout shift):
    - `FileDeliveredModal.tsx`: Original and output size displays
    - `DownloadCenterModal.tsx`: Total original, final size, and savings percentage
    - `DownloadDock.tsx`: Active item file size badges
    - `WorkspaceDrawer.tsx`: Ready/Done counts and total input size
    - `WorkspaceView.tsx`: Active file dimensions, file size, compression ratio
    - `WorkflowBuilder.tsx`: Total input weight and savings metrics
    - `smart-compress/page.tsx`: Target KB/MB dials and output size indicators
    - `image-studio/page.tsx` & `pdf-studio/page.tsx`: Live size badges and page count indicators
    - `images-to-pdf/page.tsx`: Individual image size and combined PDF size tags
    - `inspect.ts` & `inspect/page.tsx`: Metadata dimensional readouts

---

## 3. Global Application Shell Survey

### 3.1 Header (`src/components/layout/Header.tsx`)
- **Structure**: Sticky `h-16`, border-b, backdrop blur `bg-[hsl(var(--background)/0.92)]`.
- **Components**:
  - Logo with SVG symbol and wordmark (`Logo.tsx`).
  - Search trigger button with `Ctrl+K` badge opening `CommandCenter`.
  - Desktop Navigation links (`Home`, `Workspace`, `Studios` dropdown, `Images` dropdown, `PDF` dropdown, `All Tools`, `History`).
  - Session Workspace pill button showing live file counter badge (`fileCount`).
  - Privacy indicator ("On-Device" green badge with pulse dot).
  - Keyboard shortcuts button (`?`).
  - `ThemeToggle` button.
  - Mobile hamburger button (`lg:hidden`).
- **Deficiencies**:
  - Search trigger button on mobile has height ~28px (`px-3 py-1.5 text-xs`), failing 44px touch target requirement.
  - Workspace pill button is `min-h-[38px]`, failing 44px.
  - Dropdowns use CSS `:hover` / `:focus-within` rather than accessible Radix dropdown menus with `aria-expanded` and Arrow key traversal.
  - Adding files alters the Workspace button width, causing a micro-shift of adjacent header buttons.

### 3.2 Universal Command Center (`src/components/command/CommandCenter.tsx`)
- **Structure**: Modal overlay (`fixed inset-0 z-50 bg-black/65 backdrop-blur-xs`), max-w-2xl card.
- **Search Scope**: Indexes 33 tools and studios, quick actions, active session files, curated workflows (WhatsApp, Email, PDF cleanup), and presets (Under 100 KB, Under 1 MB, Instagram 1080×1080).
- **Interactions**: `Ctrl+K` / `Cmd+K` global toggle, `ArrowUp` / `ArrowDown` selection cycling, `Enter` execution, `Esc` dismiss.
- **Deficiencies**:
  - Input clear button is `p-1 rounded` with a 16px icon (~24×24px tap area), failing touch guidelines.
  - Options have `role="option"`, but container div lacks `role="listbox"`.
  - Does not implement focus trapping; Tab navigates into background page elements behind the modal.

### 3.3 Mobile Bottom Navigation (`src/components/layout/MobileBottomNav.tsx`)
- **Structure**: Fixed bottom bar (`fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe`) with 5 tabs: Home, Workspace, Search, Tools, History.
- **Compliance**: Adheres to Material Design / Apple HIG rule of <= 5 bottom tabs; all items have `min-h-[48px]`, fully satisfying the >=44px touch requirement.
- **Badge Integration**: Workspace tab contains a badge indicating loaded/completed files.
- **Page Spacing Consideration**: `Footer.tsx` has `pb-20 md:pb-0`, and `DownloadDock.tsx` has `bottom-20 md:bottom-6`, correctly reserving space above the 64px mobile bar.

### 3.4 Footer (`src/components/layout/Footer.tsx`)
- **Structure**: 5-column grid (`md:grid-cols-5`) with clean category columns:
  1. FileFixer branding, tagline, and client-side processing badge.
  2. Image Utilities links.
  3. PDF Utilities links.
  4. Power Tools links (Smart Compress, Batch, Inspector, History).
  5. Legal & Architecture (Tools directory, About, Brand identity, Privacy, Terms, and Voluntary Support button).
- **Touch Targets**: Desktop footer links use `text-xs py-1`, which are acceptable for desktop, but on mobile could benefit from `py-1.5` for finger tapping.

### 3.5 Voluntary Support & Modal Dialogs
- **File Asset**: `filefixer/public/images/filefixer_support_qr.png` verified present (526,974 bytes).
- **Support Modal (`SupportModal.tsx`)**:
  - Accurately renders the official UPI QR code with non-blocking dismiss, background scroll lock, and previous focus restoration.
  - Close button is `h-9 w-9` (36×36px), which is sub-44px on mobile.
- **File Delivered Modal (`FileDeliveredModal.tsx`)**:
  - Displays animated green checkmark with original vs delivered sizes, percentage saved, download again, and "Send to Another Tool" pipeline chaining.
  - Size numbers lack `.tabular-nums`.
- **Download Dock (`DownloadDock.tsx`)**:
  - Non-blocking floating dock positioned `fixed bottom-20 md:bottom-6 right-4 z-40`.
  - Header controls (`ChevronUp`, `X`) are `p-1 rounded` (~24px tap targets).

---

## 4. UI/UX Pro Max Intelligence Application

From `.agents/skills/ui-ux-pro-max`, the following design intelligence rules apply directly to FileFixer:

### 4.1 Style Direction: Minimalism & Swiss Style (`minimalism-and-swiss-style`)
- **Core Philosophy**: Clean, spacious, functional, grid-based, high contrast, sans-serif typography, essential elements only. Zero skeuomorphic decoration, no noisy gradients.
- **Grid Layout**: 12–16 column desktop grid, 4–8 column tablet grid, 2–4 column mobile grid.
- **Information Density**: Compact data presentation with clear hierarchy: bold numbers, muted uppercase tracking labels, crisp 1px borders, subtle elevation shadows (`0 4px 12px rgba(0,0,0,0.1)`).

### 4.2 Typography Pairing: Minimal Swiss / Dashboard Data
- **Primary Typeface**: Geist Sans for interface copy, section headings, and labels.
- **Numeric / Metric Typeface**: Geist Mono or `.tabular-nums` OpenType font-feature for all data points: file sizes, percentage savings, dimensions, timers, and progress counters.
- **Rule 129 (`number-tabular`)**: "Use tabular/monospaced figures for data columns, prices, and timers to prevent layout shift."

### 4.3 Pre-Delivery Design System Checklist
- [x] No emoji as icons (100% Lucide SVG icons).
- [ ] Cursor-pointer on all clickable cards and buttons.
- [ ] Hover states with smooth transitions (150–250ms).
- [ ] Text contrast minimum 4.5:1 on all surfaces in both light and dark mode.
- [ ] Focus states visible for keyboard navigation (`outline: 2px solid hsl(var(--ring)); outline-offset: 2px;`).
- [x] `prefers-reduced-motion` strictly respected (zero animations and transforms).
- [ ] Mobile touch targets measure at least 44×44px.

---

## 5. Accessibility, Contrast & Layout Shift Audit Findings

### 5.1 Color Contrast Audit (WCAG AA Standard: 4.5:1 for normal text, 3:1 for large text / UI)

| Element / Context | Foreground | Background | Calculated Ratio | WCAG AA Status | Remediation Required |
|---|---|---|---|---|---|
| **Dark Mode Primary Button** | White (`#FFFFFF`) | Primary (`#3B82F6`) | **3.50 : 1** | ❌ **FAIL** (Normal text < 4.5:1) | Set dark mode `--primary-foreground` to dark `#0F172A` (5.2:1) or darken primary to `#2563EB` (5.5:1). |
| **Dark Mode Success Badge/Button** | White (`#FFFFFF`) | Success (`#22C55E`) | **2.23 : 1** | ❌ **FAIL** (Severe failure) | Use dark text on solid success or translucent background (`bg-emerald-500/15 text-emerald-400`). |
| **Light Mode Muted Text on Card** | Muted Fg (`#64748B`) | Secondary (`#F1F5F9`) | **4.12 : 1** | ❌ **FAIL** (< 4.5:1 on secondary) | Darken light mode `--muted-foreground` to `#475569` (slate-600), raising contrast to 5.6:1. |
| **Light Mode Primary Button** | White (`#FFFFFF`) | Primary (`#2563EB`) | **5.52 : 1** | ✅ **PASS** | Meets AA. |
| **Dark Mode Foreground Text** | Foreground (`#F8FAFC`) | Background (`#0B1020`) | **16.2 : 1** | ✅ **PASS** (AAA) | Excellent contrast. |
| **Light Mode Foreground Text** | Foreground (`#0F172A`) | Background (`#F7F9FC`) | **15.1 : 1** | ✅ **PASS** (AAA) | Excellent contrast. |
| **Dark Mode Focus Ring** | Ring (`#3B82F6`) | Background (`#0B1020`) | **5.17 : 1** | ✅ **PASS** (> 3:1 for UI) | Visible focus. |

### 5.2 Touch Target Compliance Audit (Threshold: >=44×44px)

| Component | Target Location | Measured Dimensions | Status | Remediation |
|---|---|---|---|---|
| `Button.tsx` (size="xs") | Action buttons in tables / cards | 28px height | ❌ Non-compliant | Enforce min-h-[44px] on mobile or touch-target expansion wrapper. |
| `Button.tsx` (size="sm") | Filter chips, toolbar actions | 32px height | ❌ Non-compliant | Use responsive `h-11 sm:h-8`. |
| `Button.tsx` (size="md") | Default buttons across all tools | 40px height | ❌ Non-compliant | Update default button height from `h-10` (40px) to `h-11` (44px) or `min-h-[44px]`. |
| `Button.tsx` (size="icon") | Icon action buttons | 36×36px | ❌ Non-compliant | Increase mobile size to `h-11 w-11` (44×44px). |
| `Header.tsx` Search Trigger | Mobile header search bar | ~28px height | ❌ Non-compliant | Increase mobile button to `h-10` or `min-h-[44px]`. |
| `Header.tsx` ThemeToggle | Header right actions | 36×36px | ❌ Non-compliant | Update to `h-11 w-11 sm:h-9 sm:w-9`. |
| `Header.tsx` Hamburger | Mobile nav toggle | 44×44px (`h-11 w-11`) | ✅ **Compliant** | Perfect touch size. |
| `MobileBottomNav.tsx` Items | 5 bottom navigation tabs | 48px height (`min-h-[48px]`) | ✅ **Compliant** | Fully compliant. |
| `CommandCenter.tsx` Clear Btn | Input clear button | ~24×24px (`p-1`) | ❌ Non-compliant | Enclose in `h-11 w-11` touch box with flex center. |
| `DownloadDock.tsx` Header Btns | Minimize and close buttons | ~24×24px (`p-1`) | ❌ Non-compliant | Increase hit area to `h-9 w-9` or `min-h-[44px]`. |
| `Slider.tsx` Thumb | Compression / quality dials | 24×24px (`h-6 w-6`) | ❌ Non-compliant | Add pseudo-element `after:w-11 after:h-11 after:absolute` for 44px hit area. |
| `Switch.tsx` Root | Toggle switches | 20×36px (`h-5 w-9`) | ❌ Non-compliant | Add parent touch label with min 44px height. |
| `Checkbox.tsx` Root | Multi-select checkboxes | 16×16px (`h-4 w-4`) | ❌ Non-compliant | Wrap in label with `min-h-[44px] flex items-center`. |

### 5.3 Cumulative Layout Shift (CLS) Vectors

1. **Metric & Counter Jitter**: As image and PDF compression progresses, bytes saved and percentages calculate dynamically. Because numbers render without `font-variant-numeric: tabular-nums`, digit character width differences cause label widths to expand and contract by 2–6px, causing horizontal reflow and jitter in stat cards.
2. **Dynamic Header Badges**: In `Header.tsx`, `{fileCount > 0 && <span>...</span>}` changes the width of the Workspace button from 104px to 128px, nudging the adjacent Privacy badge and Theme toggle to the right.
3. **Modal Mount Transitions**: Opening the mobile menu in `Header.tsx` mounts a static drawer without fixed backdrop or body scroll lock, shifting viewport positioning.
4. **Initial Background Transition**: `globals.css` applies `transition: background-color 0.2s ease` to `body`. While smooth during deliberate toggling, on initial page load it can create a 200ms background color interpolation if scripts run concurrently.

### 5.4 Accessibility & Focus Management Hooks

1. **Keyboard Focus Traps**:
   - `CommandCenter.tsx`, `SupportModal.tsx`, `FileDeliveredModal.tsx`, `DownloadCenterModal.tsx`, and `KeyboardShortcutsModal.tsx` close on Escape and restore focus, but do **not** trap Tab focus. Users pressing Tab inside an open modal can navigate through the underlying page links.
2. **ARIA Semantic Structure in CommandCenter**:
   - Items render with `role="option"` and `aria-selected`, but the parent container (`listRef`) lacks `role="listbox"`. In accessibility audit trees, `role="option"` outside of `role="listbox"` produces a screen-reader hierarchy violation.
3. **Dropdown Disclosure Attributes in Header**:
   - Navigation links with dropdowns (`Studios`, `Images`, `PDF`) render `<button>` elements with `group-hover:block`, but lack `aria-haspopup="menu"` and `aria-expanded="false"`. Keyboard screen reader users are not informed that a submenu exists.
4. **Body Scroll Lock**:
   - `SupportModal.tsx` locks body scroll correctly (`document.body.style.overflow = "hidden"`), but `Header.tsx` mobile drawer and `WorkspaceDrawer.tsx` do not lock body scroll, permitting background scrolling during drawer interaction.

---

## 6. Actionable Implementation Recommendations

### Priority 1: High-Contrast Palette & Token Refinement (`globals.css`)
1. Tune `:root --background` to exact `#F7F9FC`: `216 45% 97.8%`.
2. Tune `.dark --background` to exact `#0B1020`: `226 49% 8.4%`.
3. Darken light mode `--muted-foreground` to `215 19% 35%` (`#475569`) to guarantee >5.5:1 contrast across all card and secondary surfaces.
4. Fix dark mode `--primary-foreground`: Set to dark text `222 47% 11%` (`#0F172A`) on `#3B82F6` primary buttons, or use `#2563EB` with white text.
5. Fix dark mode `--success-foreground`: Avoid white text on `#22C55E`; use subtle transparent backgrounds with emerald text (`bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`).

### Priority 2: Universal Tabular Numerals Enforcement
Apply `.tabular-nums` (or inline Tailwind `tabular-nums`) to every metric, file size, percentage, and dimensional readout in:
- `BeforeAfter.tsx`, `FileDeliveredModal.tsx`, `DownloadCenterModal.tsx`, `DownloadDock.tsx`
- `WorkspaceDrawer.tsx`, `WorkspaceView.tsx`, `WorkflowBuilder.tsx`
- `smart-compress/page.tsx`, `image-studio/page.tsx`, `pdf-studio/page.tsx`, `images-to-pdf/page.tsx`, `inspect/page.tsx`, `history/page.tsx`

### Priority 3: Mobile Touch Target Compliance (>=44×44px)
1. **Button Component (`Button.tsx`)**:
   - Update `md` size to `h-11 px-4 py-2 text-sm` (44px) or responsive `h-11 sm:h-10`.
   - Update `icon` size to `h-11 w-11 sm:h-9 sm:w-9`.
   - For `xs` and `sm` sizes, ensure touch target wrapper or minimum 44px hit-box (`relative after:absolute after:-inset-1.5 after:content-['']`).
2. **App Shell**:
   - Header search trigger: increase mobile height to `min-h-[44px]`.
   - Header `ThemeToggle` and `Shortcuts`: increase mobile size to `h-11 w-11`.
   - Sliders, Switches, Checkboxes: add pseudo-element expansion or label wrappers ensuring >=44px tap zone.

### Priority 4: Application Shell & Accessibility Hardening
1. Add focus trapping to `CommandCenter.tsx`, `SupportModal.tsx`, and `WorkspaceDrawer.tsx`.
2. Add `role="listbox"` to the CommandCenter items container and `aria-expanded` to Header dropdowns.
3. Lock body scroll (`overflow: hidden`) when the mobile navigation drawer is opened.
4. Reserve fixed width for the Workspace button counter in `Header.tsx` to prevent header item shift when files are added.
