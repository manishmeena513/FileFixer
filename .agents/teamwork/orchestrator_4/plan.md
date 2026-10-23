# Plan — Orchestrator 4

## Scope
- Milestone 5: Batch Processing, Pipelines & Utility Tools + Informational Pages
  - Target routes & components:
    - `/batch` (batch processing pipeline)
    - `/batch-rename` (advanced rule-based renaming engine)
    - `/workflows` (multi-step pipeline builder)
    - `/privacy-cleaner` (metadata scrubbing + create missing `layout.tsx`)
    - `/history` (IndexedDB telemetry & history replay)
    - `/about`, `/privacy`, `/terms` (editorial typography, privacy guarantee declaration)
    - `DownloadDock`, `FileDeliveredModal`, `SupportModal` (delivery flow and UPI QR code preservation)
  - Standards:
    - 100% client-side privacy (0 network calls, 0 server uploads)
    - Minimum touch targets >=44x44px (`min-h-[44px] min-w-[44px]`)
    - Tabular numerals (`.tabular-nums`) across all counts, sizes, and percentages
    - Standardized page wrapping with `<ToolPageShell>`
    - Hash preservation of `public/images/filefixer_support_qr.png`
- Milestone 6: Final Verification & Victory Claim
  - 100% E2E test pass across Tiers 1-4
  - Phase 2: Tier 5 adversarial coverage hardening
  - Static build validation: 33/33 static pages
  - Forensic integrity verification (CLEAN)
  - Victory Claim report to Sentinel

## Execution Phases
1. **Phase 1: Milestone 5 Exploration & Specification Mining**
   - Dispatch `explorer_m5_1`: Codebase & engine investigation (`/batch`, `/batch-rename`, `/workflows`, `/privacy-cleaner`, `batchProcessor.ts`).
   - Dispatch `explorer_m5_2`: UI ergonomics & informational pages (`/history`, `/about`, `/privacy`, `/terms`, `DownloadDock`, `SupportModal`, `history.ts`).
   - Dispatch `spec_miner_m5`: Mine requirements & invariants across Features 19-23 from `PROJECT.md` and `ORIGINAL_REQUEST.md`.
   - Synthesize findings into concrete Worker instructions.
2. **Phase 2: Milestone 5 Implementation**
   - Dispatch `worker_m5_1` with exact file boundaries and integrity warning.
   - Run tests and static build.
3. **Phase 3: Milestone 5 Verification Gate**
   - Dispatch Reviewer 1 & Reviewer 2.
   - Dispatch Challenger 1 & Challenger 2.
   - Dispatch Forensic Auditor.
   - Check all gate conditions (unanimous PASS).
4. **Phase 4: Milestone 6 Final Verification & Hardening**
   - Run complete E2E test suite (Tiers 1-4).
   - Adversarial coverage hardening (Tier 5).
   - Verify static build 33/33.
   - Final forensic integrity audit.
   - Transmit Victory Claim to Sentinel.
