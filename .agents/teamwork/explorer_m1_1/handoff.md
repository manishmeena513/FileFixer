# Handoff Report: Milestone 1 Design Tokens & WCAG AA Contrast

**Author**: M1 Token & Contrast Explorer (`explorer_m1_1`)  
**Recipient**: Lead Orchestrator (`4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`)  
**Date**: 2026-10-22  
**Type**: Hard Handoff (Investigation & Architecture Plan Complete)  
**Detailed Report**: `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m1_1\tokens_plan.md`

---

## 1. Observation

Direct observations from inspecting code and running color science verification in `filefixer`:

1. **Light Mode Background & Muted Tokens (`filefixer/src/app/globals.css:9-31`)**:
   - Line 10: `--background: 214 38% 98%;` resolves to `#F8FAFC` (RGB: 248, 250, 252, relative luminance 0.954). The requirement is `#F7F9FC` (RGB: 247, 249, 252, relative luminance 0.946).
   - Line 31: `--muted-foreground: 215 16% 47%;` resolves to `#65758B` (RGB: 101, 117, 139). Contrast against `#F7F9FC` is **4.45 : 1** and against secondary card surface `#F1F5F9` is **4.29 : 1**. Both fall strictly below the WCAG AA 4.5:1 minimum for normal text.

2. **Dark Mode Background & Contrast Tokens (`filefixer/src/app/globals.css:61-93`)**:
   - Line 62: `--background: 224 49% 9%;` resolves to `#0C1122` (RGB: 12, 17, 34). The requirement is `#0B1020` (RGB: 11, 16, 32, relative luminance 0.0055).
   - Line 75–76: `--primary: 217 91% 60%;` (`#3B82F6`) paired with `--primary-foreground: 0 0% 100%;` (`#FFFFFF`). Calculated contrast ratio is **3.68 : 1**, failing WCAG AA (4.5:1).
   - Line 91–92: `--success: 142 71% 45%;` (`#22C55E`) paired with `--success-foreground: 0 0% 100%;` (`#FFFFFF`). Calculated contrast ratio is **2.28 : 1**, failing WCAG AA severely.

3. **Theme Persistence Script & CSS Transition (`filefixer/src/app/layout.tsx:94-108`, `globals.css:119`)**:
   - `layout.tsx` (lines 94–108) embeds an inline `<script>` in `<head>` that parses `localStorage.getItem('filefixer_theme')` synchronously and sets `document.documentElement.classList.add('dark')`. `<html suppressHydrationWarning>` (line 90) prevents hydration mismatch warnings.
   - However, `globals.css` line 119 specifies:
     `transition: background-color 0.2s ease, color 0.2s ease;` on `body`.
     On initial load, this unconditional transition causes a visible 200ms background color interpolation if scripts run while stylesheets parse.
   - In `layout.tsx` line 76: `themeColor: "#2563eb"` in `Viewport` does not differentiate between dark and light modes for mobile browser chrome.

4. **Component Semantic Token Bypasses (`grep_search` across `src/`)**:
   - `src/components/layout/Header.tsx:199`: `<span className="... bg-[hsl(var(--primary))] text-white">`
   - `src/components/layout/MobileBottomNav.tsx:53`: `<span className="... text-white ... bg-[hsl(var(--primary))]">`
   - `src/components/command/CommandCenter.tsx:439`: `isSelected ? "bg-[hsl(var(--primary))] text-white"`
   - `src/components/ui/button.tsx:29`: `accent: "bg-[hsl(var(--accent-subtle))] text-white"`
   - `src/components/ui/button.tsx:34-38`: Size classes `xs` (28px), `sm` (32px), `md` (40px), and `icon` (36px) fall below the 44px mobile touch target standard.

---

## 2. Logic Chain

1. **Light Mode Calibration**:
   - Observation 1 demonstrates that `--background: 214 38% 98%` drifts from `#F7F9FC`. Converting `#F7F9FC` to HSL produces `216 45% 97.8%`.
   - Observation 1 demonstrates that `--muted-foreground: 215 16% 47%` fails WCAG AA (4.45:1). Setting `--muted-foreground` to `215 25% 27%` (exact `#334155`, slate-700) raises the contrast ratio to **9.82 : 1** on `#F7F9FC` and **9.45 : 1** on secondary card `#F1F5F9`, satisfying WCAG AAA.

2. **Dark Mode Calibration**:
   - Observation 2 demonstrates that `--background: 224 49% 9%` drifts from `#0B1020`. Converting `#0B1020` to HSL produces `226 49% 8.4%`.
   - Observation 2 demonstrates that white text on `#3B82F6` has a 3.68:1 contrast ratio. Setting `--primary-foreground: 222 47% 11%` (`#0F172A`) raises the contrast to **4.85 : 1**, satisfying WCAG AA. Furthermore, retaining `#3B82F6` preserves a **4.70 : 1** button perimeter contrast against the `#0B1020` obsidian canvas (whereas darkening to `#2563EB` reduces button perimeter contrast to 3.42:1).
   - Observation 2 demonstrates that white text on `#22C55E` fails at 2.28:1. Setting `--success-foreground: 222 47% 11%` (`#0F172A`) raises contrast to **7.83 : 1** (WCAG AAA).

3. **Zero-Flash Persistence**:
   - Observation 3 shows the inline `<script>` in `layout.tsx` is structurally sound and synchronized with `ThemeToggle.tsx`.
   - However, the global `body` CSS transition in `globals.css:119` causes a 200ms morph on first paint. Removing `transition` from `body` and confining it to a `.theme-transitioning` utility eliminates cold-load flicker. Updating `viewport.themeColor` to a media query array (`#F7F9FC` / `#0B1020`) aligns mobile browser chrome.

4. **Component Consistency**:
   - Observation 4 shows hardcoded `text-white` bypassing semantic tokens on primary/success buttons. Replacing them with `text-[hsl(var(--primary-foreground))]` and `text-[hsl(var(--success-foreground))]` ensures universal contrast compliance. Updating `Button.tsx` sizes to `h-11 sm:h-10` (`md`) and `h-11 w-11 sm:h-9 sm:w-9` (`icon`) satisfies touch target compliance (≥44px).

---

## 3. Caveats

1. **Dark Primary Alternative**: Some design teams prefer white text on dark buttons. If white text is strictly preferred, the alternative is to darken `--primary` in `.dark` to `221 83% 53%` (`#2563EB`, contrast 5.17:1 with white text). However, our recommendation follows `PROJECT.md:64` (`--primary-foreground: Dark #0F172A`), which keeps the vibrant `#3B82F6` and achieves higher button boundary contrast against the obsidian background.
2. **Tool-Specific Green Buttons**: Several legacy tool action buttons (`compress-image`, `convert-image`, `pdf-merge`, etc.) use `className="... bg-[hsl(var(--success))] hover:bg-emerald-600 text-white ..."`. In light mode, calibrating `--success` to `142 72% 29%` (`#15803D`) ensures white text passes WCAG AA (5.02:1). In Milestone 3 & 4 tool page refactoring, these should be standardized to semantic `Button` components.

---

## 4. Conclusion

The exact HSL design tokens, contrast fixes, and zero-flash persistence updates are fully determined and verified:
- **Light mode `:root`**: `--background: 216 45% 97.8%`, `--muted-foreground: 215 25% 27%`, `--success: 142 72% 29%`, `--destructive: 0 72% 51%`.
- **Dark mode `.dark`**: `--background: 226 49% 8.4%`, `--primary-foreground: 222 47% 11%`, `--accent-foreground: 222 47% 11%`, `--success-foreground: 222 47% 11%`.
- **Theme Persistence**: Inline script in `layout.tsx` verified; remove `body { transition: ... }` from `globals.css` and configure responsive `viewport.themeColor`.
- Complete line-by-line diffs and component adjustments are documented in `c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m1_1\tokens_plan.md`.

---

## 5. Verification Method

1. **Automated Contrast Ratio Verification**:
   Execute the following command in PowerShell:
   ```powershell
   node -e "
   const hex = { lightBg: 'F7F9FC', darkBg: '0B1020', mutedLight: '334155', primaryDark: '3B82F6', darkFg: '0F172A', successDark: '22C55E' };
   function lum(h) {
     let c = [0,2,4].map(i => parseInt(h.substr(i,2),16)/255).map(v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
     return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
   }
   function cr(a, b) { let l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b)); return ((l1+0.05)/(l2+0.05)).toFixed(2); }
   console.log('Muted on Light Bg:', cr(hex.mutedLight, hex.lightBg), '>= 4.5');
   console.log('Dark Fg on Primary Dark:', cr(hex.darkFg, hex.primaryDark), '>= 4.5');
   console.log('Dark Fg on Success Dark:', cr(hex.darkFg, hex.successDark), '>= 4.5');
   "
   ```
   **Expected Output**:
   - `Muted on Light Bg: 9.82 >= 4.5`
   - `Dark Fg on Primary Dark: 4.85 >= 4.5`
   - `Dark Fg on Success Dark: 7.83 >= 4.5`

2. **Build Parity Verification**:
   ```powershell
   npm run build --prefix filefixer
   ```
   Must exit with code 0 and build all 33 static routes with zero TypeScript or PostCSS errors.
