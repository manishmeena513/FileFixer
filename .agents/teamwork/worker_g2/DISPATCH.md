## 2026-10-27T18:54:31Z
You are worker_g2, a teamwork_preview_worker agent.
Your working directory is: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g2
Your parent is orchestrator_5 (conversation ID: e777432b-b796-458a-8158-89882f6bd161).

CRITICAL REQUIREMENT:
You MUST read the following authoritative requirements files before doing anything else:
1. c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-27T17:36:51Z)
2. c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
3. c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_glass_survey_2\survey_report_shell.md

RECOMMENDED DOMAIN SKILLS:
Read and follow:
c:\Users\nives\OneDrive\Documents\FileFixer\.agents\skills\ui-styling\SKILL.md
c:\Users\nives\OneDrive\Documents\FileFixer\.agents\skills\ui-ux-pro-max\SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own exclusively:
- `filefixer/src/components/layout/Header.tsx`
- `filefixer/src/components/layout/Footer.tsx`
- `filefixer/src/components/layout/MobileBottomNav.tsx`
- `filefixer/src/components/workspace/WorkspaceDrawer.tsx`
- `filefixer/src/components/command/CommandCenter.tsx`
- `filefixer/src/components/download/DownloadDock.tsx`
- `filefixer/src/components/download/DownloadCenterModal.tsx`
- `filefixer/src/components/download/FileDeliveredModal.tsx`
- `filefixer/src/components/support/SupportModal.tsx`
- `filefixer/src/components/support/SupportPrompt.tsx`
- `filefixer/src/components/support/FooterSupportButton.tsx`
- `filefixer/src/components/ui/ThemeToggle.tsx`
Do NOT modify files outside your ownership scope.

GIT POLICY:
Before or after your changes, commit completed work to git (`git commit -m "feat(shell): cinematic glass shell and modals transformation"`) and push to `origin main`.

MILESTONE G2 OBJECTIVES:
1. `filefixer/src/components/layout/Header.tsx`:
   - Frosted glass sticky header: `border-b border-[var(--glass-border)] bg-[var(--header-glass-bg)] backdrop-blur-xl`.
   - Standardize search trigger to `min-h-[44px] h-11 px-3.5` across all viewports (remove `sm:min-h-0 sm:h-9`).
   - Standardize shortcuts trigger to `h-11 w-11` (44×44px).
   - Standardize workspace link to `min-h-[44px] h-11 px-3.5`.
   - Ensure desktop nav dropdowns use `rounded-2xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-2xl`, with dropdown items having `min-h-[44px] flex items-center`.
2. `filefixer/src/components/ui/ThemeToggle.tsx`:
   - Enforce `h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation` across all viewports.
3. `filefixer/src/components/layout/MobileBottomNav.tsx`:
   - Transform into a **Floating Glass Dock Pill**:
     `fixed bottom-3 left-3 right-3 mx-auto max-w-md z-40 rounded-2xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(59,130,246,0.15)] pb-safe lg:hidden`.
   - Active route indicator: luminous blue capsule `absolute top-1.5 h-1 w-6 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_10px_rgba(96,165,250,0.8)]`.
   - Maintain all 5 nav items with `min-h-[48px]` and `touch-manipulation`.
4. `filefixer/src/components/layout/Footer.tsx` & `FooterSupportButton.tsx`:
   - Translucent frosted glass surface: `border-t border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-xl shadow-xs`.
   - Elevate `<FooterSupportButton />` into a frosted glass chip: `inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all touch-manipulation`.
5. `filefixer/src/components/workspace/WorkspaceDrawer.tsx`:
   - Backdrop: `bg-black/65 backdrop-blur-md`.
   - Panel: `border-l border-[var(--glass-border)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl`.
   - Touch targets: Tool switchers `min-h-[44px]`, Reuse button `min-h-[44px] px-3`, Download and Delete buttons `h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] touch-manipulation`.
   - Apply `.tabular-nums font-mono` to all file counts and byte sizes.
6. `filefixer/src/components/command/CommandCenter.tsx`:
   - Backdrop: `bg-black/70 backdrop-blur-md`.
   - Container: `border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_50px_rgba(59,130,246,0.18)]`.
   - Touch targets: Clear button `min-h-[44px] min-w-[44px]`, result list items `min-h-[48px] touch-manipulation`.
7. `filefixer/src/components/download/DownloadDock.tsx` & `FileDeliveredModal.tsx`:
   - Elevate with luminous blue highlights and `backdrop-blur-2xl`.
   - Close button in FileDeliveredModal: `h-11 w-11` (44×44px).
8. `filefixer/src/components/download/DownloadCenterModal.tsx`:
   - MIGRATE FROM SOLID CARD TO GLASS SYSTEM:
     - Container: `border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(59,130,246,0.15)]`.
     - Header / summary stats: `border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/80`.
     - File items: `border border-[var(--glass-border)] bg-[var(--glass-surface)]/60 hover:border-[var(--glass-border-luminous)]`.
     - Close button: `h-11 w-11` (44×44px).
     - Action buttons: `min-h-[44px] min-w-[44px] touch-manipulation`.
9. `filefixer/src/components/support/SupportModal.tsx` & `SupportPrompt.tsx`:
   - MANDATORY INVARIANT: `public/images/filefixer_support_qr.png` must NEVER be modified or replaced (SHA-256: 8592BD8A18457F3AC496D6735C472D7C4F3239E87B93771ED238D348B87D4744).
   - Keep voluntary, session-throttled, non-blocking flow (1200ms delay).
   - Solid white backing for QR container (`bg-white p-3 sm:p-4 rounded-2xl`).
   - Close buttons: `h-11 w-11` (44×44px) in SupportModal, `min-h-[44px] min-w-[44px]` in SupportPrompt.
10. VERIFICATION:
    - Run `npm test` in `filefixer` — all 376+ tests must pass!
    - Run `npm run build` in `filefixer` — all 33 static routes must prerender statically (`○`) with exit code 0!
    - Verify SHA-256 of `public/images/filefixer_support_qr.png`.

OUTPUT:
Write your changes, test results, build results, and completion evidence to:
`c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_g2\handoff.md`
Update `progress.md` in your directory.
Send completion message to parent (e777432b-b796-458a-8158-89882f6bd161).
