# Handoff Report: Hover & Interactive Contrast Remediation Design

**Agent**: `explorer_m1_r3_2` (Hover Contrast Auditor & Explorer)  
**Parent Orchestrator**: `4ddcdb96-4381-4a09-bb31-9ad0367fbfc1`  
**Milestone**: M1 (Design System & Global Shell) — Iteration 3  
**Status**: HARD HANDOFF (Task Complete)  

---

## 1. Observation

1. **Adversarial Test Failure (Test 2.2)**:
   - Tool Command: `npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts`
   - Output:
     ```
     # [Task 2.2] Contrast of white on dark primary in WorkspaceDrawer: 3.629:1
     not ok 2 - 2.2 Application shell WorkspaceDrawer must not use hover:text-white on dark primary button
       ---
       duration_ms: 3.8455
       type: 'test'
       location: 'C:\Users\nives\OneDrive\Documents\FileFixer\filefixer\tests\adversarial-contrast-layout-challenger-m1r2.test.ts:152:5'
       failureType: 'testCodeFailure'
       error: |-
         WorkspaceDrawer line 384 regresses contrast to 3.63:1 on hover in dark mode (fails WCAG AA 4.5:1)
         
         true !== false
     ```
2. **Exact Source Line in WorkspaceDrawer**:
   - In `filefixer/src/components/workspace/WorkspaceDrawer.tsx` line 384:
     ```tsx
     className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
     ```
3. **Comprehensive Grep for `hover:text-white`**:
   - `grep_search` across `filefixer/src` revealed exactly two occurrences:
     - `src/components/workspace/WorkspaceDrawer.tsx:384`
     - `src/components/workspace/WorkspaceView.tsx:629`:
       ```tsx
       className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--primary))] hover:text-white transition-colors"
       ```
4. **Comprehensive Grep for Static `text-white` on `bg-[hsl(var(--primary))]`**:
   - `src/components/workspace/WorkspaceView.tsx:404`:
     `className="text-xs font-semibold px-2 py-1 rounded bg-[hsl(var(--primary))] text-white"`
   - `src/components/workspace/WorkspaceView.tsx:475`:
     `isSelected ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"`
   - `src/components/workspace/WorkspaceView.tsx:812`:
     `targetSizeMB === mb ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white" : ...`
   - `src/app/page.tsx:469`:
     `act.primary ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"`
   - `src/app/image-studio/page.tsx:360`:
     `targetFormat === f.format ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white" : ...`
5. **Button Composited Hover Degradation (Challenge 3)**:
   - In `src/components/ui/button.tsx` line 19:
     ```tsx
     default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-92 active:scale-[0.98] shadow-xs transition-all",
     ```
     At 92% opacity over dark background (`#0B1020`), relative luminance of the button background drops from `0.2244` to `0.2017`, causing contrast against `#0F172A` text to drop to **4.36:1** ($< 4.5:1$).

---

## 2. Logic Chain

1. **From Observation 1 & 2**:
   - Dark mode primary background `--primary` is `217 91% 60%` (`#3B82F6`, relative luminance `0.2244`).
   - Hardcoded `text-white` (`#FFFFFF`, relative luminance `1.0000`) on `#3B82F6` produces a contrast ratio of:
     $$\frac{1.0000 + 0.05}{0.2244 + 0.05} = \frac{1.05}{0.2744} = \mathbf{3.63:1}$$
   - This fails the WCAG 2.1 AA requirement of $\ge 4.5:1$, causing Challenger Test 2.2 to fail.
2. **From Observation 3**:
   - Prior remediation fixed `DownloadDock.tsx` line 130 and `DownloadCenterModal.tsx` line 217 using `hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]`.
   - Applying `hover:text-[hsl(var(--primary-foreground))]` to `WorkspaceDrawer.tsx` line 384 and `WorkspaceView.tsx` line 629 introduces `#0F172A` (`222 47% 11%`, relative luminance `0.0078`) in dark mode and `#FFFFFF` in light mode.
   - The dark mode contrast ratio becomes:
     $$\frac{0.2244 + 0.05}{0.0078 + 0.05} = \frac{0.2744}{0.0578} = \mathbf{4.93:1} \quad (\ge 4.5:1 \text{ WCAG AA PASS})$$
   - In light mode, `--primary` is `#2563EB` and `--primary-foreground` is `#FFFFFF`, yielding $5.38:1 \ge 4.5:1$.
3. **From Observation 4**:
   - Any static occurrence of `text-white` on `bg-[hsl(var(--primary))]` similarly regresses to 3.63:1 in dark mode.
   - Replacing each with `text-[hsl(var(--primary-foreground))]` guarantees universal $\ge 4.93:1$ contrast across all states.
4. **From Observation 5**:
   - In `button.tsx`, replacing container `hover:opacity-92` with `hover:brightness-105 active:scale-[0.98]` preserves 100% foreground text opacity while slightly increasing background luminance in dark mode (`#3B82F6` $\to$ `#4B8FF7`, luminance $0.26$), increasing dark contrast to **5.36:1** and maintaining light mode contrast at **5.00:1** (both $\ge 4.5:1$).

---

## 3. Caveats

1. **Tool Page Success Buttons**: Some tool pages use `bg-[hsl(var(--success))] hover:bg-emerald-600 text-white`. In dark mode, `--success` is light green (`#22C55E`). While outside the M1 shell remit (belonging to M3/M4/M5 tool suites), those should eventually use `text-[hsl(var(--success-foreground))]`.
2. **Mobile Clearance (Task 4.1)**: Mobile layout collision between `SupportPrompt` and `DownloadDock` was also flagged in the challenger report (-19px collision). A companion explorer/worker is addressing Task 4.1; the contrast fixes here are completely orthogonal and zero-risk to layout geometry.

---

## 4. Conclusion

The exact, verified solution for hover contrast regressions comprises:
1. **`WorkspaceDrawer.tsx` line 384**: Replace `hover:bg-[hsl(var(--primary))] hover:text-white` with `hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]`.
2. **`WorkspaceView.tsx` line 629**: Replace `hover:bg-[hsl(var(--primary))] hover:text-white` with `hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]`.
3. **`WorkspaceView.tsx` lines 404, 475, 812**: Replace `text-white` with `text-[hsl(var(--primary-foreground))]`.
4. **`button.tsx` line 19**: Replace `hover:opacity-92` with `hover:brightness-105`.
5. **`page.tsx` line 469 & `image-studio/page.tsx` line 360**: Replace `text-white` with `text-[hsl(var(--primary-foreground))]`.

Full diffs and specifications are documented in:
`c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m1_r3_2\hover_contrast_plan.md`.

---

## 5. Verification Method

1. **Challenger Automated Test Suite**:
   ```powershell
   npx tsx --test tests/adversarial-contrast-layout-challenger-m1r2.test.ts
   ```
   - Test 2.2 will pass with `expected: false, actual: false` (0 occurrences of `hover:bg-[hsl(var(--primary))] hover:text-white` in `WorkspaceDrawer.tsx`).
   - Task 2.1 will pass with `4.932:1 >= 4.5:1`.
2. **Full Regression Test Suite**:
   ```powershell
   npm test --prefix filefixer
   ```
3. **Grep Invalidation Condition**:
   ```powershell
   grep -rn "hover:bg-\[hsl(var(--primary))\] hover:text-white" filefixer/src
   ```
   Must return 0 results.
