# Comprehensive Survey Report: Design System Foundation, CSS Variables & Styling Tokens
**Project**: FileFixer — Cinematic Glass Utility Studio Transformation  
**Surveyed By**: `explorer_glass_survey_1` (Teamwork Explorer)  
**Date**: October 27, 2026  
**Status**: Complete & Verified (376/376 tests passing, 33/33 static routes building)

---

## Executive Summary

The FileFixer application operates on **Next.js 16.3.5 (Turbopack)**, **React 19.2.8**, and **Tailwind CSS v4** (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`). The project has a solid baseline: all 33 routes prerender statically with exit code 0 (`npm run build`), all 376 tests pass (`npm test`), and the mandatory support QR code (`filefixer_support_qr.png`) retains its cryptographic SHA-256 hash `8592BD8A18457F3AC496D6735C472D7C4F3239E87B93771ED238D348B87D4744`.

This survey audited the design system foundation, token architecture, glassmorphism implementation, typography/tabular numeral rules, and touch target accessibility across `filefixer/src/app/globals.css`, `filefixer/tailwind.config.ts`, all UI component primitives, application shell components, and all 26 user workstation routes.

### Primary Audit Verdict
1. **Glassmorphism Shell vs Opaque Workstations**: The global shell (`Header`, `MobileBottomNav`, `CommandCenter`, `SupportModal`, `FileDeliveredModal`, `DownloadDock`) has been successfully converted to frosted glass styling (`--glass-surface`, `--glass-border-luminous`, backdrop blur). However, **more than 100 panels across workstation pages still use opaque `bg-[hsl(var(--card))]`**, creating a noticeable split between the cinematic glass shell and opaque content cards.
2. **Tailwind v4 Token Integration Gap**: In `globals.css`, Tailwind v4's `@theme inline` only maps `--color-background` and `--color-foreground`. CSS glass variables are not registered in `@theme` or `@utility`. As a result, components write fragile inline arbitrary classes (e.g., `bg-[var(--glass-surface)] backdrop-blur-md border-[var(--glass-border)]`) rather than standard semantic utility classes.
3. **Palette Token Calibrations**: The primary glass surfaces, electric blue (`#3B82F6`), subtle border, and luminous border tokens are present in `globals.css`. However, **Dark Canvas (`#070A12`)** is bypassed by `layout.tsx` (which applies `--background: #0B1020` to `<body>`), **Soft Violet Highlight (`#A78BFA`)** is completely missing, and Light theme secondary surface is `#F1F5F9` instead of required `#EDF2F9`.
4. **Test Suite Invariants**: 20 test suites enforce strict string matching and WCAG 2.1 AA luminance mathematical checks on `globals.css` (e.g. `--background: 226 49% 8.4%`, `--primary: 217 91% 60%`, `--radius: 0.75rem`). Any styling updates must satisfy both the Cinematic Glass requirements and the test invariants without regressions.
5. **Numeral Rules (`.tabular-nums font-mono`)**: While universal tabular figures are enabled in `globals.css`, `TabularNum.tsx` (`TabularNum`, `FormatBytes`, `SavingsPct`) omits `font-mono` by default, and several modal metrics rely on proportional fonts with `tabular-nums` alone.
6. **Touch Targets**: Mobile bottom nav (`min-h-[48px]`), Header controls, Button, Slider, Switch, and Checkbox all adhere to ≥44px / ≥48px standards. A critical vulnerability was found in `FileCard.tsx`, where the remove file button is only `36×36px` (`h-9 w-9`) without touch padding or `touch-manipulation`.

---

## 1. Design System & CSS Variable Architecture

### 1.1 CSS Engine & Tailwind v4 Inspection
The application uses Tailwind CSS v4 configured via `postcss.config.mjs` and `src/app/globals.css`:
```css
/* src/app/globals.css:1-6 */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```
`tailwind.config.ts` exists in the repository root and extends HSL color bindings. However, under Tailwind CSS v4, arbitrary CSS properties are not auto-generated into utility classes unless mapped via `@theme` or `@utility` directives.

### 1.2 Existing Glass Utility Classes in `globals.css`
`globals.css` declares several glass studio utility classes (lines 206–260):
- `.glass-panel`: `background-color: var(--glass-surface); backdrop-filter: blur(16px); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow);`
- `.glass-panel-elevated`: `background-color: var(--glass-surface-elevated); backdrop-filter: blur(20px); border: 1px solid var(--glass-border-luminous); box-shadow: var(--glass-shadow-elevated);`
- `.glass-panel-interactive`: Hover transform (`translateY(-2px)`), luminous border activation, elevated shadow.
- `.glass-input`: `backdrop-filter: blur(12px); border: 1px solid var(--glass-border); focus:border-luminous`

**Observation**: Despite these utilities existing in `globals.css`, workstation pages (`compress-image`, `pdf-merge`, `batch`, `workflows`, etc.) rarely import or reference `.glass-panel` or `<ToolSection>`. Instead, they either use raw arbitrary tailwind strings or fallback to solid opaque cards (`bg-[hsl(var(--card))]`).

---

## 2. Dark Palette Analysis: Current vs Required Cinematic Glass Tokens

| Token Name | Required Value | Current Value in `globals.css` | Status / Gap Analysis |
|---|---|---|---|
| **Dark Canvas** | `#070A12` | `--canvas-bg: #070A12;` (Line 77) | **Partial**. Defined as variable, but `layout.tsx` line 113 applies `bg-[hsl(var(--background))]` (`#0B1020`) to `<body>`. Viewport themeColor is also `#0B1020`. Page canvas effectively renders as `#0B1020` rather than deep `#070A12`. |
| **Secondary Background** | `#0B1020` | `--background: 226 49% 8.4%;` (`#0B1020`) | **Aligned**. Acts as current background. `--surface-secondary` is `221 38% 15%` (`#172033`). |
| **Primary Glass Surface** | `rgba(20, 29, 47, 0.68)` | `--glass-surface: rgba(20, 29, 47, 0.68);` (Line 123) | **Exact Match**. 68% opacity frosted glass layer. |
| **Elevated Glass Surface** | `rgba(29, 42, 65, 0.76)` | `--glass-surface-elevated: rgba(29, 42, 65, 0.76);` (Line 124) | **Exact Match**. 76% opacity for modals, dropdowns, and active cards. |
| **Solid Fallback** | `#111827` | `--card: 220 39% 11%;` (`#111827`) (Line 84) | **Exact Match**. Card solid background equals `#111827`. |
| **Electric Blue** | `#3B82F6` | `--primary: 217 91% 60%;` (`#3B82F6`) (Line 94) | **Exact Match**. Also used in `--ambient-glow-1: rgba(59, 130, 246, 0.22)`. |
| **Bright Blue Highlight** | `#60A5FA` | `--accent-subtle: 213 94% 68%;` (`#60A5FA`) (Line 96) | **Aligned in HSL, Missing Token**. Present in HSL and luminous border `rgba(96, 165, 250, 0.35)`, but no named token `--blue-highlight` or Tailwind class `text-blue-highlight`. |
| **Violet Accent** | `#8B5CF6` | `--ambient-glow-2: rgba(139, 92, 246, 0.18);` (Line 130) | **Partial**. Used in background atmospheric glow, but NOT exposed as a reusable UI color token (`--accent-violet` or `--violet`). |
| **Soft Violet Highlight** | `#A78BFA` | *Not defined* | **Missing**. Not defined in `globals.css` or `tailwind.config.ts`. |
| **Subtle Border** | `rgba(148, 163, 184, 0.18)` | `--glass-border: rgba(148, 163, 184, 0.18);` (Line 125) | **Exact Match**. Slate-400 at 18% opacity. |
| **Luminous Border** | `rgba(96, 165, 250, 0.35)` | `--glass-border-luminous: rgba(96, 165, 250, 0.35);` (Line 126) | **Exact Match**. Blue-400 at 35% opacity. |

---

## 3. Light Palette Analysis: Current vs Required High-Contrast Light Theme

| Token Name | Required Value | Current Value in `globals.css` | Status / Gap Analysis |
|---|---|---|---|
| **Canvas** | `#F4F7FC` | `--canvas-bg: #F4F7FC;` (Line 10) | **Partial**. Defined as variable, but `--background` is `216 45% 97.8%` (`#F7F9FC`), which `body` binds to. Viewport themeColor is `#F7F9FC`. |
| **Primary Surface** | `#FFFFFF` | `--card: 0 0% 100%;` (`#FFFFFF`) (Line 17) | **Exact Match**. |
| **Secondary Surface** | `#EDF2F9` | `--surface-secondary: 210 40% 96%;` (`#F1F5F9`) (Line 21) | **Delta**. Current is slate-100 (`#F1F5F9`). Target is cool soft tinted `#EDF2F9` (`215 50% 95.3%`). |
| **Elevated Surface** | `#FFFFFF` | `--surface-elevated: 0 0% 100%;` (Line 20) | **Exact Match**. |
| **Primary Blue** | `#2563EB` | `--primary: 221 83% 53%;` (`#2563EB`) (Line 27) | **Exact Match**. Passes WCAG AA ≥4.5:1 on light surfaces. |
| **Violet Accent** | `#6D4AFF` | `--ambient-glow-2: rgba(109, 74, 255, 0.05);` (Line 65) | **Partial**. Glow uses `#6D4AFF` (`rgba(109, 74, 255, 0.05)`), but `--accent` is set to blue `221 83% 53%`. Needs `--accent-violet: #6D4AFF`. |
| **Subtle Borders** | Cool gray-blue | `--border: 214 32% 91%;` & `--glass-border: rgba(148, 163, 184, 0.28);` | **Aligned**. Slate-200/slate-300 cool gray-blue tone. |

---

## 4. Glassmorphism Implementation Audit

### 4.1 Glass Intensity & Translucency (~55% Target)
- **Current State**:
  - Dark glass surface: `rgba(20, 29, 47, 0.68)` (68% opacity)
  - Elevated glass surface: `rgba(29, 42, 65, 0.76)` (76% opacity)
  - Light glass surface: `rgba(255, 255, 255, 0.75)` (75% opacity)
  - Elevated light surface: `rgba(255, 255, 255, 0.92)` (92% opacity)
- **Assessment**: The core design system values in `globals.css` achieve balanced glass intensity with solid fallbacks for low-end browsers. However, on workstation pages (`/compress-image`, `/resize-image`, `/pdf-merge`, `/batch`, etc.), settings panels use solid opaque cards `bg-[hsl(var(--card))]` (100% opacity) with zero backdrop blur. This dilutes the cinematic feel across the core tools.

### 4.2 Selective Backdrop Blur (12–20px Target)
- **Current State in `globals.css`**:
  - Standard glass panel: `backdrop-filter: blur(16px)`
  - Elevated glass panel: `backdrop-filter: blur(20px)`
  - Glass inputs: `backdrop-filter: blur(12px)`
- **Discrepancies in Components**:
  - `Header.tsx`: `backdrop-blur-xl` (24px)
  - `MobileBottomNav.tsx`: `backdrop-blur-xl` (24px)
  - `CommandCenter.tsx`: `backdrop-blur-2xl` (40px)
  - `FileCard.tsx`: `backdrop-blur-sm` (4px)
  - `SupportedFormats.tsx`: mixes `backdrop-blur-xl` and `backdrop-blur-md`
- **Recommendation**: Standardize blur tokens to the 12–20px spec:
  - Inputs / compact controls: 12px (`backdrop-blur-md`)
  - Cards & sections: 16px
  - Modals & drawers: 20px (`backdrop-blur-lg` / `blur(20px)`)

### 4.3 Low-Opacity Borders & Luminous Edge Highlights
- **Subtle borders**: `rgba(148, 163, 184, 0.18)` provides crisp structure without visual heaviness.
- **Luminous borders**: `rgba(96, 165, 250, 0.35)` on hover/active surfaces produces an electric glow.
- **Top Edge Specular Highlight**: `globals.css` line 127 includes `inset 0 1px 0 rgba(255, 255, 255, 0.08)` and elevated line 128 includes `inset 0 1px 0 rgba(255, 255, 255, 0.14)`. This creates authentic physical refraction along top card borders.

### 4.4 Ambient Shadows & Atmospheric Lighting
- **Atmospheric Engine**: Implemented in `src/app/layout.tsx` (lines 114–119):
  - Fixed background container with `pointer-events-none -z-10`.
  - Top orb: `680×520px` radial gradient using `--ambient-glow-1` (electric blue, blur 90px).
  - Mid-right orb: `580×480px` radial gradient using `--ambient-glow-2` (violet accent, blur 90px).
  - Bottom orb: `620×440px` radial gradient using `--ambient-glow-1` (electric blue, blur 90px).
- **Hero Atmospheric Layer**: `src/app/page.tsx` line 18-20 includes a complementary hero glow gradient (`from-blue-600/30 via-indigo-500/20 to-violet-500/25 blur-3xl`).
- **Contrast Check**: Background orbs operate at low opacity (0.05–0.22) with 90px blur, preserving WCAG AA contrast (foreground body text contrast is >12:1 on dark canvas).

---

## 5. Typography & Numeral Rules (`.tabular-nums font-mono`)

### 5.1 Requirement Specification
- Numeric metrics, file sizes, dimensions, percentages, and counters must use `.tabular-nums font-mono` to prevent Cumulative Layout Shift (CLS) during real-time updates.

### 5.2 CSS Implementation in `globals.css`
```css
/* globals.css:180-192 */
.tabular-nums,
[data-tabular-nums="true"],
.font-feature-tnum,
.font-mono,
kbd,
.metric-value,
.stat-value {
  font-variant-numeric: tabular-nums;
  -moz-font-feature-settings: "tnum";
  -webkit-font-feature-settings: "tnum";
  font-feature-settings: "tnum";
}
```
Any element with `.font-mono` automatically inherits `font-variant-numeric: tabular-nums`.

### 5.3 Gaps & Deficiencies Found in Components
1. **`TabularNum.tsx` Components**:
   - `TabularNum`: uses `className={cn("tabular-nums inline-block font-feature-tnum", className)}` (Omit `font-mono`).
   - `FormatBytes`: uses `className={cn("tabular-nums font-feature-tnum inline-block", className)}` (Omit `font-mono`).
   - `SavingsPct`: uses `className={cn("tabular-nums font-feature-tnum inline-block", className)}` (Omit `font-mono`).
   Whenever `<FormatBytes bytes={file.size} />` is rendered without extra classes, it renders in proportional Geist Sans instead of Geist Mono.
2. **Modal Metric Cards**:
   - `FileDeliveredModal.tsx` (lines 164, 173, 182): `<p className="text-xs font-bold text-[hsl(var(--foreground))] tabular-nums">` lacks `font-mono`.
   - `DownloadCenterModal.tsx` (lines 155, 161, 169): `<p className="text-xs font-bold tabular-nums">` lacks `font-mono`.
3. **Comparison & Results**:
   - `BeforeAfter.tsx` (lines 51, 81): `<p className="mt-1 text-xl sm:text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">` lacks `font-mono`.
4. **Tool Workstation Badges**:
   - In `compress-image`, `resize-image`, `smart-compress`, image counter headers use `.tabular-nums` without `font-mono`.

---

## 6. Touch Targets Audit (≥ 44×44px interactive, ≥ 48px mobile nav)

### 6.1 Mobile Navigation Shell (`MobileBottomNav.tsx`)
- Enforces `min-h-[48px]` on all 5 navigation items (`Home`, `Workspace`, `Search`, `Tools`, `History`).
- Grid is 5 columns with `max-w-md` (448px) and `min-w-[320px]`. On a 320px viewport, each column width is `64px`, and row height is `64px` (`h-16`).
- Interactive target area: **64×48px (exceeds ≥ 48px standard)**.
- Includes `touch-manipulation` and `pb-safe`.

### 6.2 Header & Shell Controls
- Search trigger: `min-h-[44px]` on mobile (`sm:h-9 sm:min-h-0`).
- Workspace link: `min-h-[44px]` on mobile (`sm:min-h-[38px]`).
- Hamburger toggle button: `h-11 w-11` (44×44px).
- Theme toggle button: `h-11 w-11` (44×44px on mobile).
- Mobile drawer navigation links: `min-h-[44px]`.

### 6.3 UI Primitives
- **`Button` (`button.tsx`)**:
  - `size="md"`: `h-11 sm:h-10 min-h-[44px] sm:min-h-0 touch-manipulation`
  - `size="lg"`: `h-12 min-h-[48px] touch-manipulation`
  - `size="sm"` and `size="xs"`: Uses pseudo-element expander `after:min-w-[44px] after:min-h-[44px]` on touch screens (`sm:after:hidden`).
  - `size="icon"`: `h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px]` with `after:min-w-[44px] after:min-h-[44px]`.
- **`Slider` (`slider.tsx`)**:
  - Root container enforces `min-h-[44px] py-2.5 sm:min-h-0`.
  - Thumb enforces `after:w-11 after:h-11 after:min-w-[44px] after:min-h-[44px]`.
- **`Switch` (`switch.tsx`)**:
  - Root container enforces `after:min-w-[44px] after:min-h-[44px]`.
- **`Checkbox` (`checkbox.tsx`)**:
  - Root container enforces `after:min-w-[44px] after:min-h-[44px]`.

### 6.4 Touch Target Violations & Gaps Found
1. **`FileCard.tsx` Line 167 (Critical)**:
   ```tsx
   <button
     type="button"
     onClick={() => onRemove(file.id)}
     className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] ... "
   >
     <X className="h-4 w-4" />
   </button>
   ```
   **Violation**: The remove button is hardcoded to `h-9 w-9` (36×36px). It lacks `min-h-[44px] min-w-[44px]`, lacks `touch-manipulation`, and lacks the `after:` hit-box expander. On mobile touch screens, removing a staged file is error-prone.
2. **`convert-image/page.tsx` Line 441**:
   ```tsx
   <input
     type="color"
     value={bgColor}
     onChange={(e) => setBgColor(e.target.value)}
     className="h-7 w-7 rounded-lg border border-black/20 bg-transparent cursor-pointer p-0"
   />
   ```
   **Violation**: The native color picker input is only `28×28px` (`h-7 w-7`). While its parent container is `h-11`, the input element itself should span the height or include `touch-manipulation`.
3. **Workspace Thumbnail Actions**:
   In `pdf-workspace`, all action buttons correctly implement `min-h-[44px] min-w-[44px]`. However, in `image-studio` and `pdf-studio`, some toolbar icon buttons use `h-8 w-8` without mobile expansion.

---

## 7. Hard Invariants & Compatibility Constraints

Before applying any CSS variable changes, the following hard constraints in the existing test suites must be respected:

1. **Exact String Match Assertions in Tests**:
   - `tests/routes-and-design.test.ts` line 83: `content.includes("--background: 216 45% 97.8%") || content.includes("--background: 214 38% 98%")`
   - `tests/routes-and-design.test.ts` line 87: `content.includes("--primary: 221 83% 53%")`
   - `tests/routes-and-design.test.ts` line 92: `content.includes("--background: 226 49% 8.4%") || content.includes("--background: 224 49% 9%")`
   - `tests/routes-and-design.test.ts` line 96: `content.includes("--primary: 217 91% 60%")`
   - `tests/tier2-boundary-corner.test.ts` line 37: `content.includes("--border: 214 32% 91%")`
   - `tests/tier2-boundary-corner.test.ts` line 38: `content.includes("--border: 217 33% 18%")`
   - `tests/tier2-boundary-corner.test.ts` line 39: `content.includes("--input: 217 33% 18%")`
   - `tests/tier2-boundary-corner.test.ts` line 52: `content.includes("--radius: 0.75rem")`
   - `tests/tier1-feature-coverage.test.ts` line 79: `navContent.includes("min-h-[48px]")`
2. **WCAG AA Mathematical Luminance Test Suite**:
   `tests/adversarial-contrast-layout-challenger-m1r2.test.ts` parses HSL tokens from `:root` and `.dark` and computes `getContrast(rgb1, rgb2)`. Any change to `--destructive`, `--success`, `--accent-subtle`, `--foreground`, `--background`, `--card`, or `--surface-secondary` that causes contrast to fall below 4.5:1 will fail `npm test`.
3. **QR Asset Invariant**:
   `filefixer/public/images/filefixer_support_qr.png` must NEVER be modified or touched (SHA-256: `8592BD8A18457F3AC496D6735C472D7C4F3239E87B93771ED238D348B87D4744`).

---

## 8. Actionable Recommendations for Implementation Phase

### Priority 1: Design System & Token Foundation (`globals.css` & `tailwind.config.ts`)
1. **Expose Missing Cinematic Glass Semantic Tokens**:
   - In `:root`:
     - Add `--accent-violet: 254 100% 65%;` (`#6D4AFF`)
     - Add `--surface-secondary-light: #EDF2F9;`
   - In `.dark`:
     - Add `--accent-violet: 258 90% 66%;` (`#8B5CF6`)
     - Add `--accent-violet-highlight: 255 92% 76%;` (`#A78BFA`)
     - Add `--accent-blue-highlight: 213 94% 68%;` (`#60A5FA`)
2. **Register Tailwind v4 Theme Tokens**:
   Add `@theme` mappings in `globals.css` for glass surfaces and colors:
   ```css
   @theme inline {
     --color-glass-surface: var(--glass-surface);
     --color-glass-surface-elevated: var(--glass-surface-elevated);
     --color-glass-border: var(--glass-border);
     --color-glass-border-luminous: var(--glass-border-luminous);
     --color-violet-accent: var(--accent-violet);
     --color-violet-highlight: var(--accent-violet-highlight);
   }
   ```
3. **Canvas Application**:
   Update `src/app/layout.tsx` so the body background applies `--canvas-bg` (`#070A12` dark / `#F4F7FC` light) with subtle depth while `--background` retains `#0B1020` for test backward compatibility:
   ```tsx
   <body className="min-h-full flex flex-col bg-[var(--canvas-bg,#070A12)] text-[hsl(var(--foreground))] relative selection:bg-blue-500/20 selection:text-blue-200">
   ```
   Update `viewport.themeColor` in `layout.tsx` to `#070A12` (dark) and `#F4F7FC` (light).

### Priority 2: Workstation Card & Section Transformation
1. Replace legacy opaque `border border-[hsl(var(--border))] bg-[hsl(var(--card))]` across all 26 workstation routes with `.glass-panel` or `<ToolSection>`.
2. Ensure settings panels and interactive option containers utilize:
   - Primary glass surface: `rgba(20, 29, 47, 0.68)`
   - Blur: 16px
   - Border: `var(--glass-border)`
   - Hover state: `hover:border-[var(--glass-border-luminous)]`

### Priority 3: Typography & Numeral Hardening
1. In `src/components/ui/TabularNum.tsx`, add `font-mono` to default class names:
   ```tsx
   className={cn("tabular-nums font-mono font-feature-tnum inline-block", className)}
   ```
2. Update metric cards in `FileDeliveredModal.tsx`, `DownloadCenterModal.tsx`, and `BeforeAfter.tsx` to include `font-mono`.

### Priority 4: Touch Target Fixes
1. In `src/components/upload/FileCard.tsx` (line 167), update the remove button:
   ```tsx
   className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] touch-manipulation cursor-pointer"
   ```
2. In `src/app/convert-image/page.tsx` (line 441), expand the color input touch target:
   ```tsx
   className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg border border-black/20 bg-transparent cursor-pointer p-0 touch-manipulation"
   ```
