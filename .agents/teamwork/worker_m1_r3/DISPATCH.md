# Dispatch for worker_m1_r3

Task: Implement Milestone 1 Iteration 3 Remediations per Explorer plans:
- support_prompt_plan.md
- hover_contrast_plan.md
- test_sync_plan.md

## 2026-10-22T19:02:22Z
[Message] timestamp=2026-10-22T19:02:22Z sender=4ddcdb96-4381-4a09-bb31-9ad0367fbfc1 priority=MESSAGE_PRIORITY_HIGH content=Your identity: M1 Iteration 3 Remediation Worker (worker_m1_r3)
Your working directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m1_r3
Original request path: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
Project specification: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md

Explorer input plans to implement (read all 3 before modifying code):
- SupportPrompt Positioning: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m1_r3_1\support_prompt_plan.md
- Hover Contrast & Button Primitives: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m1_r3_2\hover_contrast_plan.md
- Test Suite Synchronization: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m1_r3_3\test_sync_plan.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership for this task:
- filefixer/src/components/support/SupportPrompt.tsx
- filefixer/src/components/workspace/WorkspaceDrawer.tsx
- filefixer/src/components/workspace/WorkspaceView.tsx
- filefixer/src/components/ui/button.tsx
- filefixer/src/app/page.tsx
- filefixer/src/app/image-studio/page.tsx
- filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts
- filefixer/tests/m1-adversarial.test.ts
- filefixer/tests/adversarial-modal-accessibility.test.ts

Implementation Tasks:
1. SupportPrompt Mobile Clearance (support_prompt_plan.md):
   - Update filefixer/src/components/support/SupportPrompt.tsx line 41 so that when hasDownloads is true, it uses `bottom-80 sm:bottom-72 md:bottom-6`. This provides +13px clearance (320px vs 307px) above DownloadDock on mobile while maintaining sm:bottom-72 tablet alignment and md:bottom-6 desktop anchoring.
2. Hover Contrast Remediation (hover_contrast_plan.md):
   - filefixer/src/components/workspace/WorkspaceDrawer.tsx line 384: replace `hover:bg-[hsl(var(--primary))] hover:text-white` with `hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]` (guarantees 4.93:1 contrast in dark mode vs 3.63:1 with white).
   - filefixer/src/components/workspace/WorkspaceView.tsx: update lines 404, 475, 629, 812 to use `text-[hsl(var(--primary-foreground))]` and `hover:text-[hsl(var(--primary-foreground))]` instead of text-white / hover:text-white on primary backgrounds.
   - filefixer/src/components/ui/button.tsx line 19: replace `hover:opacity-92` with `hover:brightness-105` to prevent alpha compositing contrast degradation against dark background (#0B1020).
   - filefixer/src/app/page.tsx line 469 and filefixer/src/app/image-studio/page.tsx line 360: ensure primary button/badge text uses `text-[hsl(var(--primary-foreground))]` instead of text-white.
3. Test Suite Synchronization (test_sync_plan.md):
   - Synchronize `filefixer/tests/adversarial-contrast-layout-challenger-m1r2.test.ts` (Tasks 2.2 and 4.1).
   - Synchronize `filefixer/tests/m1-adversarial.test.ts` (add tests 1.11 and 3.3).
   - Synchronize `filefixer/tests/adversarial-modal-accessibility.test.ts` (ADV-SP-1 assertion accepting bottom-80 / bottom-[320px] / bottom-72).
4. Run Verification Commands:
   - Run `npm test --prefix filefixer` and verify all tests pass with 0 failures across all 10 suites (133+ tests).
   - Run `npm run build --prefix filefixer` and verify all 33 static routes build with exit code 0.
5. Write your handoff report to c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m1_r3\handoff.md and send a completion message to the parent orchestrator via send_message.
