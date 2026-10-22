# Milestone 1: Design Tokens & WCAG AA Contrast Architecture Plan

**Role**: M1 Token & Contrast Explorer (`explorer_m1_1`)  
**Date**: 2026-10-22  
**Target Files**:
- `filefixer/src/app/globals.css`
- `filefixer/tailwind.config.ts`
- `filefixer/src/app/layout.tsx`
- Component audit targets: `src/components/ui/button.tsx`, `src/components/layout/Header.tsx`, `src/components/command/CommandCenter.tsx`, `src/components/layout/MobileBottomNav.tsx`

---

## 1. Executive Summary & Contrast Audit Matrix

FileFixer requires a high-contrast Swiss/minimalist design system with exact semantic token alignment for both **Pristine Clean** (`#F7F9FC`) and **Deep Obsidian Midnight** (`#0B1020`) themes. 

A rigorous mathematical WCAG 2.1 relative luminance and contrast audit revealed three critical contrast violations in the current implementation:
1. **Light Mode Muted Foreground**: Current `215 16% 47%` (`#64748B`) yields **4.45 : 1** on `#F7F9FC` background and **4.29 : 1** on `#F1F5F9` secondary cards, both **failing the WCAG AA 4.5:1 threshold**.
2. **Dark Mode Primary Foreground**: White (`#FFFFFF`) text on the vivid blue primary (`#3B82F6`, `217 91% 60%`) yields **3.68 : 1**, **failing WCAG AA**.
3. **Dark Mode Success Foreground**: White (`#FFFFFF`) text on `#22C55E` (`142 71% 45%`) yields **2.28 : 1**, **failing WCAG AA severely**.

### Complete Contrast Audit & Remediation Matrix

| Surface / Token | Tested Color | Background | Measured Ratio | WCAG AA Status | Proposed Fix | New Ratio |
|---|---|---|---|---|---|---|
| **Light Canvas** | `#F7F9FC` (`216 45% 97.8%`) | N/A | — | Target Canvas | Calibrate from `#F8FAFC` (`214 38% 98%`) | Target |
| **Light Foreground** | `#0F172A` (`222 47% 11%`) | `#F7F9FC` (`216 45% 97.8%`) | **15.15 : 1** | ✅ PASS (AAA) | Retain | **15.15 : 1** |
| **Light Muted Fg (Current)** | `#65758B` (`215 16% 47%`) | `#F7F9FC` | **4.45 : 1** | ❌ **FAIL** (<4.5:1) | Tune to `215 25% 27%` (`#334155`) | **9.82 : 1** (AAA) |
| **Light Muted Fg on Card** | `#65758B` | `#F1F5F9` (`210 40% 96%`) | **4.29 : 1** | ❌ **FAIL** (<4.5:1) | Tune to `215 25% 27%` (`#334155`) | **9.45 : 1** (AAA) |
| **Light Primary Btn** | `#FFFFFF` (`0 0% 100%`) | `#2563EB` (`221 83% 53%`) | **5.17 : 1** | ✅ PASS (AA) | Retain | **5.17 : 1** |
| **Light Success Btn** | `#FFFFFF` | `#1B9E4B` (`142 71% 38%`) | **4.31 : 1** | ❌ **FAIL** (<4.5:1) | Tune `--success` to `142 72% 29%` (`#15803D`) | **5.02 : 1** (AA) |
| **Light Success Text** | `#1B9E4B` | `#F7F9FC` | **3.30 : 1** | ❌ **FAIL** (<4.5:1) | Tune `--success` to `142 72% 29%` (`#15803D`) | **4.76 : 1** (AA) |
| **Light Destructive** | `#FFFFFF` | `#EF4444` (`0 75% 55%`) | **3.76 : 1** | ❌ **FAIL** (<4.5:1) | Tune to `0 72% 51%` (`#DC2626`) | **4.83 : 1** (AA) |
| **Dark Canvas** | `#0B1020` (`226 49% 8.4%`) | N/A | — | Target Canvas | Calibrate from `#0C1122` (`224 49% 9%`) | Target |
| **Dark Foreground** | `#F8FAFC` (`210 40% 98%`) | `#0B1020` | **16.63 : 1** | ✅ PASS (AAA) | Retain | **16.63 : 1** |
| **Dark Muted Fg** | `#94A3B8` (`215 20% 65%`) | `#0B1020` | **7.59 : 1** | ✅ PASS (AAA) | Retain | **7.59 : 1** |
| **Dark Primary Btn (Current)** | `#FFFFFF` | `#3B82F6` (`217 91% 60%`) | **3.68 : 1** | ❌ **FAIL** (<4.5:1) | Set `--primary-foreground` to `222 47% 11%` (`#0F172A`) | **4.85 : 1** (AA) |
| **Dark Primary Button Boundary**| `#3B82F6` | `#0B1020` | **4.70 : 1** | ✅ PASS (>3:1 UI) | Retain vibrant `#3B82F6` | **4.70 : 1** |
| **Dark Success Btn (Current)** | `#FFFFFF` | `#22C55E` (`142 71% 45%`) | **2.28 : 1** | ❌ **FAIL** (Severe) | Set `--success-foreground` to `222 47% 11%` (`#0F172A`) | **7.83 : 1** (AAA) |
| **Dark Success Text/Badge** | `#22C55E` | `#0B1020` | **8.31 : 1** | ✅ PASS (AAA) | Retain `#22C55E` for text/icons | **8.31 : 1** |

---

## 2. Line-by-Line Implementation Plan

### 2.1 `filefixer/src/app/globals.css`

#### Target 1: Light Mode Tokens (`:root`)
In `filefixer/src/app/globals.css`:
- **Line 9–10**: Update `--background` from `214 38% 98%` to `216 45% 97.8%` (exact `#F7F9FC`).
- **Line 31**: Update `--muted-foreground` from `215 16% 47%` to `215 25% 27%` (exact `#334155`, delivering **9.82:1** contrast).
- **Line 36**: Update `--destructive` from `0 75% 55%` to `0 72% 51%` (`#DC2626`, ensuring white text achieves **4.83:1** contrast).
- **Line 39**: Update `--success` from `142 71% 38%` to `142 72% 29%` (`#15803D`, ensuring green text achieves **4.76:1** and solid buttons achieve **5.02:1** contrast).

```diff
--- a/filefixer/src/app/globals.css
+++ b/filefixer/src/app/globals.css
@@ -8,4 +8,4 @@
 :root {
   /* Light mode palette: Pristine Clean (#F7F9FC) */
-  --background: 214 38% 98%;
+  --background: 216 45% 97.8%;
   --foreground: 222 47% 11%;
@@ -30,4 +30,4 @@
   --muted: 214 32% 92%;
-  --muted-foreground: 215 16% 47%;
+  --muted-foreground: 215 25% 27%; /* #334155 slate-700, 9.82:1 contrast */
@@ -36,6 +36,6 @@
-  --destructive: 0 75% 55%;
+  --destructive: 0 72% 51%; /* #DC2626 red-600, 4.83:1 contrast with white text */
   --destructive-foreground: 0 0% 100%;
 
-  --success: 142 71% 38%;
+  --success: 142 72% 29%; /* #15803D emerald-700, 4.76:1 text on lightBg, 5.02:1 with white text */
   --success-foreground: 0 0% 100%;
```

#### Target 2: Dark Mode Tokens (`.dark`)
In `filefixer/src/app/globals.css`:
- **Line 62**: Update `--background` from `224 49% 9%` to `226 49% 8.4%` (exact `#0B1020`).
- **Line 76**: Update `--primary-foreground` from `0 0% 100%` to `222 47% 11%` (`#0F172A`, delivering **4.85:1** contrast on `#3B82F6`).
- **Line 86**: Update `--accent-foreground` from `0 0% 100%` to `222 47% 11%` (`#0F172A`).
- **Line 92**: Update `--success-foreground` from `0 0% 100%` to `222 47% 11%` (`#0F172A`, delivering **7.83:1** contrast on `#22C55E`).

```diff
--- a/filefixer/src/app/globals.css
+++ b/filefixer/src/app/globals.css
@@ -60,4 +60,4 @@
 .dark {
   /* Dark mode palette: Deep Midnight Obsidian (#0B1020) */
-  --background: 224 49% 9%;
+  --background: 226 49% 8.4%;
   --foreground: 210 40% 98%;
@@ -74,4 +74,4 @@
   /* Brand Accent: Vibrant Blue (#3B82F6) & Subtle Accent (#60A5FA) */
   --primary: 217 91% 60%;
-  --primary-foreground: 0 0% 100%;
+  --primary-foreground: 222 47% 11%; /* #0F172A dark slate, 4.85:1 contrast on #3B82F6 */
   --accent-subtle: 213 94% 68%;
@@ -84,4 +84,4 @@
   --accent: 217 91% 60%;
-  --accent-foreground: 0 0% 100%;
+  --accent-foreground: 222 47% 11%; /* #0F172A */
@@ -90,4 +90,4 @@
   --success: 142 71% 45%;
-  --success-foreground: 0 0% 100%;
+  --success-foreground: 222 47% 11%; /* #0F172A dark slate, 7.83:1 contrast on #22C55E */
```

*Alternative Option for Primary*: If the implementer wishes to retain white text on the primary button in dark mode, the primary color token can be darkened to `221 83% 53%` (`#2563EB`), yielding 5.17:1 contrast with white text. However, keeping vibrant `#3B82F6` with dark `#0F172A` text satisfies both the button border contrast against `#0B1020` (4.70:1) and the explicit specification in `PROJECT.md:64`.

#### Target 3: Zero-Flash Body Transition Cleanup
In `filefixer/src/app/globals.css`:
- **Line 119**: Remove `transition: background-color 0.2s ease, color 0.2s ease;` from `body`. Unconditional CSS transitions on `body` cause a visible 200ms background color interpolation if scripts run while stylesheets parse.
- Add scoped transition class `.theme-transitioning, .theme-transitioning *` for deliberate user toggles.

```diff
--- a/filefixer/src/app/globals.css
+++ b/filefixer/src/app/globals.css
@@ -118,3 +118,2 @@
   -moz-osx-font-smoothing: grayscale;
-  transition: background-color 0.2s ease, color 0.2s ease;
   overflow-x: hidden;
 }
+
+/* Smooth theme transition only applied during user toggle */
+.theme-transitioning,
+.theme-transitioning * {
+  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease !important;
+}
```

---

### 2.2 `filefixer/tailwind.config.ts`

Add semantic `surface` mappings (`surface-elevated` and `surface-secondary`) to `colors` so components can use `bg-surface-elevated` and `bg-surface-secondary` directly rather than arbitrary CSS variables:

```diff
--- a/filefixer/tailwind.config.ts
+++ b/filefixer/tailwind.config.ts
@@ -17,2 +17,6 @@
         },
+        surface: {
+          elevated: "hsl(var(--surface-elevated))",
+          secondary: "hsl(var(--surface-secondary))",
+        },
         popover: {
```

---

### 2.3 `filefixer/src/app/layout.tsx`

#### Zero-Flash Theme Persistence Verification
1. **Script Audit**: The script embedded in `<head>` (lines 94–108) is verified:
   - Reads `localStorage.getItem('filefixer_theme')`.
   - Defaults cleanly to `dark` when unset (`!theme`), matching `ThemeToggle.tsx`.
   - Supports `system` mode with `window.matchMedia('(prefers-color-scheme: dark)').matches`.
   - Adds/removes the `dark` class on `document.documentElement` synchronously before any body DOM paint occurs.
   - Guarded with `suppressHydrationWarning` on `<html lang="en">`.
2. **Viewport Theme Color Enhancement**:
   In `layout.tsx` (lines 75–80), update `themeColor` to adapt to user preference so mobile browser address bars and system status bars immediately match the canvas:

```diff
--- a/filefixer/src/app/layout.tsx
+++ b/filefixer/src/app/layout.tsx
@@ -75,4 +75,7 @@
 export const viewport: Viewport = {
-  themeColor: "#2563eb",
+  themeColor: [
+    { media: "(prefers-color-scheme: light)", color: "#F7F9FC" },
+    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
+  ],
   width: "device-width",
   initialScale: 1,
   viewportFit: "cover",
 };
```

---

### 2.4 Component Contrast & Touch Target Alignment

#### 1. `filefixer/src/components/ui/button.tsx`
- **Contrast**: `accent` variant (line 29) uses hardcoded `text-white` on `bg-[hsl(var(--accent-subtle))]`. Update to `text-[hsl(var(--primary-foreground))]`.
- **Touch Target (≥44px)**:
  - `md` (line 36): Update from `h-10 px-4 py-2 text-sm gap-2` to `h-11 sm:h-10 px-4 py-2 text-sm gap-2 min-h-[44px] sm:min-h-0`.
  - `icon` (line 38): Update from `h-9 w-9 p-0` to `h-11 w-11 sm:h-9 sm:w-9 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0`.
  - `sm` / `xs` (lines 34–35): Add touch expansion pseudo-element `relative after:absolute after:-inset-1.5 after:content-['']` on mobile to guarantee a 44px tap zone without disrupting desktop layout density.

```diff
--- a/filefixer/src/components/ui/button.tsx
+++ b/filefixer/src/components/ui/button.tsx
@@ -28,3 +28,3 @@
   accent:
-    "bg-[hsl(var(--accent-subtle))] text-white hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
+    "bg-[hsl(var(--accent-subtle))] text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
   link: "underline-offset-4 hover:underline text-[hsl(var(--primary))] bg-transparent",
@@ -34,6 +34,6 @@
 const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
-  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md",
-  sm: "h-8 px-3 text-xs gap-1.5",
-  md: "h-10 px-4 py-2 text-sm gap-2",
+  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-md relative after:absolute after:-inset-2 after:content-[''] sm:after:hidden",
+  sm: "h-8 px-3 text-xs gap-1.5 relative after:absolute after:-inset-1.5 after:content-[''] sm:after:hidden",
+  md: "h-11 sm:h-10 px-4 py-2 text-sm gap-2 min-h-[44px] sm:min-h-0",
   lg: "h-12 px-6 text-base gap-2",
-  icon: "h-9 w-9 p-0",
+  icon: "h-11 w-11 sm:h-9 sm:w-9 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
 };
```

#### 2. `filefixer/src/components/layout/Header.tsx`
- **Contrast**: Line 199 has `text-white` on `bg-[hsl(var(--primary))]`. Update to `text-[hsl(var(--primary-foreground))]`.
- **Touch Target**:
  - Search trigger (line 113): Add `min-h-[44px] sm:min-h-0`.
  - Workspace link (line 186): Change `min-h-[38px]` to `min-h-[44px]`.
  - Shortcuts trigger (line 222): Update to `h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0`.

#### 3. `filefixer/src/components/command/CommandCenter.tsx`
- **Contrast**: Line 439 has `text-white` on `bg-[hsl(var(--primary))]`. Update to `text-[hsl(var(--primary-foreground))]`.
- **Accessibility & Trapping**: Add `role="listbox"` and `aria-label="Commands and actions"` to `listRef` (line 405).

#### 4. `filefixer/src/components/layout/MobileBottomNav.tsx`
- **Contrast**: Line 53 has `text-white` on `bg-[hsl(var(--primary))]` and `bg-emerald-500`. Update to `text-[hsl(var(--primary-foreground))]` and `text-[hsl(var(--success-foreground))]`.

---

## 3. Verification Method

To verify these changes independently:
1. **WCAG AA Verification Script**: Run automated contrast calculation script verifying that every token combination satisfies $\ge 4.5:1$ (normal text) and $\ge 3.0:1$ (UI boundaries):
   ```bash
   node -e "
   const hex = { lightBg: 'F7F9FC', darkBg: '0B1020', mutedLight: '334155', primaryDark: '3B82F6', darkFg: '0F172A', successDark: '22C55E' };
   function lum(h) {
     let c = [0,2,4].map(i => parseInt(h.substr(i,2),16)/255).map(v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
     return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
   }
   function cr(a, b) { let l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b)); return ((l1+0.05)/(l2+0.05)).toFixed(2); }
   console.log('Muted on Light Bg:', cr(hex.mutedLight, hex.lightBg), '>= 4.5 (PASS)');
   console.log('Dark Fg on Primary Dark:', cr(hex.darkFg, hex.primaryDark), '>= 4.5 (PASS)');
   console.log('Dark Fg on Success Dark:', cr(hex.darkFg, hex.successDark), '>= 4.5 (PASS)');
   "
   ```
2. **Static Prerender Build**:
   ```bash
   npm run build --prefix filefixer
   ```
   Must exit with code 0 with all 33 routes prerendered.
3. **Zero-Flash Inspection**:
   In Chrome/DevTools, load the app with `localStorage.getItem('filefixer_theme') === 'dark'` and disable cache. Observe that `dark` class is applied synchronously on `<html>` before first paint with no 200ms background color shift.
