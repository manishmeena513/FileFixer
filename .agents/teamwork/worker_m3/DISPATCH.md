## 2026-10-23T15:06:43Z
You are Worker M3 (worker_m3) for Milestone 3: Purpose-Built Image Workstations.

## Working Directory & Identity
- Subagent Role: Full-Stack Worker
- Your Working Directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\worker_m3
- Parent Orchestrator ID: eb7c7517-1271-47fc-acd9-e4891655cf74

## Mandatory References (Read Before Starting)
- ORIGINAL_REQUEST.md: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md
- Explorer Plan 1 (Compression): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m3_1\compression_plan.md
- Explorer Plan 2 (Transformation): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m3_2\transformation_plan.md
- Explorer Plan 3 (Studio & Metadata): c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m3_3\studio_metadata_plan.md

## Exclusive File Ownership
You have exclusive write ownership of:
- `filefixer/src/app/compress-image/page.tsx`
- `filefixer/src/app/smart-compress/page.tsx`
- `filefixer/src/lib/image/smartCompress.ts`
- `filefixer/src/components/results/BeforeAfter.tsx`
- `filefixer/src/app/resize-image/page.tsx`
- `filefixer/src/app/convert-image/page.tsx`
- `filefixer/src/app/crop-image/page.tsx`
- `filefixer/src/app/image-metadata/page.tsx`
- `filefixer/src/lib/image/metadata.ts`
- `filefixer/src/app/image-studio/page.tsx`

DO NOT modify `public/images/filefixer_support_qr.png` under any circumstances.
Zero server uploads: all image operations must remain 100% browser-native client-side (Canvas, Web Workers, exifr).

## Implementation Tasks (Execute per Plans)
1. **`/compress-image` & `BeforeAfter.tsx`**:
   - Preset chips with >= 44px touch targets; multi-file visual compare selector.
   - Update `BeforeAfter.tsx` to use CSS `clip-path: inset(0 ${(100 - safePosition).toFixed(2)}% 0 0)` for zero-distortion alignment and add Home/End key support.
   - Wire `pushDownload`, `setLatestDeliveredFile`, and `triggerSupportPrompt()`.
   - Replace any hardcoded `text-white` on `bg-[hsl(var(--success))]` with `text-[hsl(var(--success-foreground))]`.
2. **`/smart-compress` & `smartCompress.ts`**:
   - Wrap in `ToolPageShell`.
   - Extend progressive passes to 7 stages with canvas fallback.
   - Fix light mode contrast (replace `text-emerald-300/400` with `text-emerald-700 dark:text-emerald-400`).
   - Touch targets >= 44px; wire `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.
3. **`/resize-image`**:
   - Aspect ratio preset chips (`Free`, `16:9`, `4:3`, `1:1`, `9:16`) with `min-h-[44px]`.
   - Aspect lock toggle with `min-h-[44px] min-w-[44px]`.
   - Live dimension inspector card (Original, Target, Aspect Ratio, Megapixels, Resolution Delta) with universal `.tabular-nums`.
   - Percentage scale chips (`25%, 50%, 75%, 100%, 150%, 200%`); touch targets >= 44px.
   - Wire `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.
4. **`/convert-image`**:
   - Alpha transparency detection and informational banner.
   - Format selector buttons (`WebP`, `PNG`, `JPG`) with `min-h-[48px]`.
   - Preset background color swatches for JPG with >= 44px touch targets.
   - Wire `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.
5. **`/crop-image`**:
   - Canvas-based transformation pipeline: apply rotation/flips directly onto working bitmap so `<ReactCrop>` coordinates are 100% synchronized with zero coordinate drift.
   - Aspect presets (`Free`, `1:1`, `4:3`, `16:9`) with `centerCrop` and `makeAspectCrop`.
   - Live crop dimension inspector (Crop size, Source size, Aspect ratio, Area coverage) with `.tabular-nums`.
   - Preserve original format and transparency upon export.
   - Wire `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.
6. **`/image-metadata` & `metadata.ts`**:
   - Rich camera and sensor table (Make, Model, Software, Exposure, ISO, Focal Length, 35mm equivalent, Megapixels, Dimensions).
   - Fix exposure time bug in `src/lib/image/metadata.ts` for exposures >= 1s.
   - GPS location card with latitude/longitude (decimal and DMS), copy coordinates button, and external OpenStreetMap link (0 egress, 0 remote API calls).
   - Single-click EXIF sanitization with `pushDownload` integration and `.tabular-nums`.
7. **`/image-studio`**:
   - Unified canvas workstation: integrate `react-image-crop`, real-time canvas filters (Brightness, Contrast, Saturation, filter presets), 90° rotation, H/V flips.
   - 4 ergonomic tabs: [Crop & Transform], [Resize], [Adjust & Filter], [Export & Quality].
   - `BeforeAfter` comparison slider and stats with `.tabular-nums`.
   - Wire `pushDownload`, `setLatestDeliveredFile`, `triggerSupportPrompt()`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Verification Requirements
You MUST run the following commands and verify clean passes:
1. `npm test --prefix filefixer` — all automated tests must pass.
2. `npm run build --prefix filefixer` — all 33 static routes must build with exit code 0.
Document commands, outputs, and verified layout in your `handoff.md`.
Notify the orchestrator via send_message when complete.
