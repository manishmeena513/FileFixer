# Milestone 3 Implementation Plan: Image Compression Workstations

**Author:** Explorer 1 (`explorer_m3_1`)  
**Target Focus:** `/compress-image` and `/smart-compress` Workstations  
**Milestone:** M3 (Purpose-Built Image Workstations)  
**Parent Orchestrator:** `eb7c7517-1271-47fc-acd9-e4891655cf74`  
**Date:** 2026-10-23  

---

## 1. Executive Summary & Scope

This plan specifies the architecture, UI/UX polish, engine enhancements, and delivery integration for FileFixer's two premier compression workstations:
1. **`/compress-image`** (`filefixer/src/app/compress-image/page.tsx`): Dual-mode general and batch image compressor with Auto (Balanced), Target Size presets, and Quality slider modes.
2. **`/smart-compress`** (`filefixer/src/app/smart-compress/page.tsx`): Precision progressive optimization engine targeting exact upload limits ("Under X MB", e.g. <100KB, <250KB, <500KB, <1MB, <2MB, <5MB, and custom MB caps).

Both workstations adhere to FileFixer's uncompromising guarantees:
- **100% On-Device Processing**: 0 API routes, 0 network uploads, Web Worker / Canvas processing only.
- **Delivery Dock & Modal Integration**: Output staged via `pushDownload`, delivered with `triggerDownload`, celebrated via `setLatestDeliveredFile` (`FileDeliveredModal`), and voluntary support prompted via `triggerSupportPrompt`.
- **Universal Tabular Numerals**: Strict `.tabular-nums` formatting on all byte sizes, savings percentages, dimensions, and counters.
- **Ergonomics & Accessibility**: Touch targets $\ge 44\text{px}$, WCAG AA contrast ($\ge 4.5:1$) in both light (`#F7F9FC`) and dark (`#0B1020`) themes.

---

## 2. Detailed Technical Audit of Existing Implementation

### 2.1 `/compress-image` (`filefixer/src/app/compress-image/page.tsx`)

| Area | Current State | Defect / Limitation | Proposed Solution |
| :--- | :--- | :--- | :--- |
| **Delivery Integration** | Calls `triggerDownload(blob, name)` only on line 121. | Never invokes `pushDownload`, `setLatestDeliveredFile`, or `triggerSupportPrompt`. Floating `DownloadDock` is not notified and `FileDeliveredModal` never opens. | On file compression done, queue with `pushDownload({ status: "ready" })`. On download, update `pushDownload({ status: "downloaded" })`, set `setLatestDeliveredFile(...)`, and call `triggerSupportPrompt()`. |
| **Target Size Presets** | 4 hardcoded buttons (0.25, 0.5, 1.0, 2.0 MB) on lines 258-275. | Buttons lack `min-h-[44px]` touch targets. No custom target input available in this tab. | Wrap preset chips with `min-h-[44px]`, add Under 100 KB and Under 5 MB presets, and provide an optional custom size input for granular control. |
| **Tabular Numerals** | `font-mono` applied to quality % (line 284), but missing `.tabular-nums` on file count badge (line 166) and batch results badge (line 360). | Minor layout shifts during dynamic counter increments. | Add explicit `.tabular-nums` to all dynamic count badges and percentages. |
| **Batch Visual Comparison** | Line 200: `const singleFile = files.length === 1 ? files[0] : null;` comparison slider only renders if `files.length === 1`. | Users uploading multiple files cannot visually compare before/after for any selected file. | Add `activeFileId` selection in batch mode so users can inspect any compressed image with the before/after slider. |
| **Store Loading** | Lines 29-30 loads all `files` from `useFileStore()`. | Non-image files in store from prior sessions could trigger image compression failures. | Filter store files to `files.filter(f => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(f.name))`. |

---

### 2.2 `/smart-compress` (`filefixer/src/app/smart-compress/page.tsx`)

| Area | Current State | Defect / Limitation | Proposed Solution |
| :--- | :--- | :--- | :--- |
| **Shell & Layout** | Uses custom `<div>` container (line 157) instead of `ToolPageShell`. | Inconsistent breadcrumb navigation, missing format chips, divergent typography from other workstations. | Refactor page to wrap in `<ToolPageShell icon={Sparkles} title="Exact Size Compression (\"Under X MB\")" formats={["JPG", "PNG", "WEBP", "PDF"]}>`. |
| **Delivery Integration** | Line 144 calls `triggerDownload(finalResult.bestBlob, filename)`. | Zero integration with `pushDownload`, `setLatestDeliveredFile`, or `triggerSupportPrompt`. | Integrate `pushDownload` for ready stage and `setLatestDeliveredFile` + `triggerSupportPrompt` upon download. |
| **WCAG AA Light Mode Contrast** | Lines 278, 410, 438 use `text-emerald-300`, `text-emerald-400`, `text-amber-400`. | **Critical Accessibility Bug**: In light theme (`#F7F9FC`), `text-emerald-300/400` has only ~1.5:1 – 2.2:1 contrast against light background, failing WCAG AA (requires $\ge 4.5:1$). | Replace with high-contrast dual-theme classes: `text-emerald-700 dark:text-emerald-400` and `text-amber-700 dark:text-amber-400`. |
| **Touch Targets** | "Change File" button on line 219 has `min-h-[40px]`. | Fails $\ge 44\text{px}$ touch target on mobile viewports. | Upgrade to `min-h-[44px]`. |
| **Progressive Compression Passes** | `smartCompress.ts` has 5 fixed passes (82% / 2560px down to 28% / 1024px). | Fails on very large files or aggressive targets (<100KB, <50KB) because it stops at 1024px / 28% without further safe downscaling. | Extend to 7 progressive passes: add Pass 6 (Quality 22%, Max 800px) and Pass 7 (Quality 16%, Max 640px), with canvas fallback. |

---

### 2.3 `BeforeAfter.tsx` (`filefixer/src/components/results/BeforeAfter.tsx`)

| Area | Current State | Defect / Limitation | Proposed Solution |
| :--- | :--- | :--- | :--- |
| **CompareSlider Alignment** | Lines 206-217 use reciprocal width calculation: `width: ${100 / (safePosition / 100)}%`. | Images with letterboxing / different aspect ratios can experience sub-pixel misalignment when the slider moves. | Use CSS `clip-path: inset(0 ${(100 - safePosition).toFixed(2)}% 0 0)` on the top overlay container. Both images then share identical `absolute inset-0 h-full w-full object-contain` geometry with zero offset distortion. |
| **Keyboard Accessibility** | Handle supports ArrowLeft and ArrowRight in steps of 5%. | Fully accessible, but add `Home` (0%) and `End` (100%) keys for standard slider ergonomics. | Add `Home` and `End` handlers to `handleKeyDown`. |

---

## 3. Workstation Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interaction Layer                          │
│                                                                        │
│   /compress-image (Dual Mode)            /smart-compress (Exact Cap)   │
│   ├── Auto (Balanced)                    ├── Preset Under X MB Chips   │
│   ├── Target Size Presets (KB/MB)        ├── Custom Limit Input (MB)   │
│   └── Quality Slider (10%-100%)          └── Progressive Pass Telemetry│
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        In-Browser Engine Layer                         │
│                                                                        │
│   compressImage (compress.ts)            smartCompress (smartCompress) │
│   ├── browser-image-compression          ├── Pass 1..7 Quality Decay   │
│   │   (Web Worker Thread)                ├── Dimension Step-down       │
│   └── fallbackCanvasCompress             ├── PDF Stream Optimization   │
│       (Offscreen Canvas 2D)              └── Offscreen Canvas Fallback │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Delivery & Shell Integration                       │
│                                                                        │
│   1. pushDownload({ status: "ready", blob, fileName, outputSize })    │
│      └── Updates Floating DownloadDock & Telemetry                     │
│   2. triggerDownload(blob, fileName)                                  │
│      └── Direct on-device file retrieval (zero egress)                 │
│   3. setLatestDeliveredFile(...)                                       │
│      └── Displays celebratory FileDeliveredModal (stats & reuse)       │
│   4. triggerSupportPrompt()                                            │
│      └── Session-throttled voluntary UPI QR modal (1200ms non-blocking)│
│   5. addHistoryRecord(...)                                             │
│      └── Local IndexedDB telemetry logging                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Concrete Proposed Changes

### 4.1 `/compress-image/page.tsx` Updates

#### 1. Import additions
```typescript
import { useFileStore } from "@/stores/fileStore";
// Add pushDownload, setLatestDeliveredFile, triggerSupportPrompt from useFileStore
```

#### 2. Enhanced Delivery in `handleProcessAll` and `handleDownloadSingle`
```typescript
// Inside handleProcessAll:
const res = await compressImage(f.file, options);
setOutput(f.id, res.blob, res.outputName, res.outputSize);
completedCount++;

// Push to global download dock as "ready"
pushDownload({
  fileName: res.outputName,
  originalSize: f.size,
  outputSize: res.outputSize,
  savingsPct: f.size > res.outputSize ? ((f.size - res.outputSize) / f.size) * 100 : 0,
  status: "ready",
  blob: res.blob,
});

// Inside handleDownloadSingle:
const handleDownloadSingle = (fileId: string) => {
  const f = files.find((item) => item.id === fileId);
  if (!f || !f.outputBlob) return;
  const fileName = f.outputName || f.name;
  triggerDownload(f.outputBlob, fileName);

  const dlItem = {
    fileName,
    originalSize: f.size,
    outputSize: f.outputSize || f.outputBlob.size,
    savingsPct: f.size > (f.outputSize || f.size) ? ((f.size - (f.outputSize || f.size)) / f.size) * 100 : 0,
    status: "downloaded" as const,
    blob: f.outputBlob,
  };
  pushDownload(dlItem);
  setLatestDeliveredFile({
    id: `deliv-${Date.now()}`,
    ...dlItem,
    timestamp: Date.now(),
  });
  triggerSupportPrompt();
};
```

#### 3. Preset chips touch target & custom target input
Ensure preset buttons in `targetSize` tab have `min-h-[44px]`:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
  {[
    { label: "Under 100 KB", value: 0.1 },
    { label: "Under 250 KB", value: 0.25 },
    { label: "Under 500 KB", value: 0.5 },
    { label: "Under 1 MB", value: 1.0 },
    { label: "Under 2 MB", value: 2.0 },
    { label: "Under 5 MB", value: 5.0 },
  ].map((preset) => (
    <button
      key={preset.label}
      type="button"
      onClick={() => setTargetSizeMB(preset.value)}
      className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-medium transition-colors touch-manipulation tabular-nums ${
        targetSizeMB === preset.value
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)]"
      }`}
    >
      {preset.label}
    </button>
  ))}
</div>
```

#### 4. Multi-file visual compare selector
When multiple files are present, allow selecting which file is previewed in the compare slider:
```tsx
const activeFile = files.find((f) => f.id === activeFileId) || (files.length > 0 ? files[0] : null);
```

---

### 4.2 `/smart-compress/page.tsx` Updates

#### 1. Adopt `ToolPageShell`
Replace the outer `div` and custom header with:
```tsx
<ToolPageShell
  icon={Sparkles}
  title="Exact Size Compression (\"Under X MB\")"
  description="Progressively tests client-side compression passes until your exact KB or MB upload limit is met."
  formats={["JPG", "PNG", "WEBP", "PDF"]}
>
  {/* Existing workstation grid */}
</ToolPageShell>
```

#### 2. Fix Light Mode WCAG AA Contrast Failures
Update lines 278, 410, 438:
```tsx
// Line 278 (Attempt pass card):
className={`animate-slide-up flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
  attempt.success
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
}`}

// Line 410 (Download card title):
<div
  className={`flex items-center gap-2 font-bold text-sm ${
    finalResult.achieved
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-amber-700 dark:text-amber-400"
  }`}
>

// Line 438 (Final result metrics):
<p className="text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
  Final Result: <strong>{formatBytes(finalResult.bestSize)}</strong>
</p>
```

#### 3. Delivery integration
```tsx
const handleDownload = () => {
  if (!finalResult || !selectedFile) return;
  const base = selectedFile.name.replace(/\.[^/.]+$/, "");
  const ext = selectedFile.name.split(".").pop() || "jpg";
  const targetLabel = targetMB >= 1 ? `${targetMB}MB` : `${Math.round(targetMB * 1024)}KB`;
  const outFileName = `${base}_under_${targetLabel}.${ext}`;

  triggerDownload(finalResult.bestBlob, outFileName);

  const dlItem = {
    fileName: outFileName,
    originalSize: finalResult.originalSize,
    outputSize: finalResult.bestSize,
    savingsPct: finalResult.originalSize > finalResult.bestSize
      ? ((finalResult.originalSize - finalResult.bestSize) / finalResult.originalSize) * 100
      : 0,
    status: "downloaded" as const,
    blob: finalResult.bestBlob,
  };
  pushDownload(dlItem);
  setLatestDeliveredFile({
    id: `deliv-${Date.now()}`,
    ...dlItem,
    timestamp: Date.now(),
  });
  triggerSupportPrompt();
};
```

---

### 4.3 `smartCompress.ts` Progressive Optimization Loop

Extend passes to 7 progressive stages:
```typescript
const passes = [
  { label: "High Quality Pass (Quality 82%, Max 2560px)", quality: 0.82, maxDim: 2560 },
  { label: "Balanced Pass (Quality 68%, Max 2048px)", quality: 0.68, maxDim: 2048 },
  { label: "Strong Compression (Quality 52%, Max 1600px)", quality: 0.52, maxDim: 1600 },
  { label: "Target Optimization (Quality 40%, Max 1280px)", quality: 0.40, maxDim: 1280 },
  { label: "Compact Optimization (Quality 28%, Max 1024px)", quality: 0.28, maxDim: 1024 },
  { label: "Ultra-Compact Pass (Quality 22%, Max 800px)", quality: 0.22, maxDim: 800 },
  { label: "Maximum Reduction (Quality 16%, Max 640px)", quality: 0.16, maxDim: 640 },
];
```
Add canvas compression fallback if `imageCompression` throws during any pass:
```typescript
catch (err) {
  // Attempt canvas fallback for this pass
  try {
    const fallbackBlob = await canvasResizeAndCompress(file, pass.quality, pass.maxDim);
    // evaluate size and record attempt...
  } catch (canvasErr) {
    console.warn(`Pass ${i + 1} canvas fallback failed:`, canvasErr);
  }
}
```

---

### 4.4 `BeforeAfter.tsx` CompareSlider CSS Clip-Path Enhancement

Replace manual width reciprocals with CSS `clip-path`:
```tsx
{/* Output (bottom layer, full width) */}
<img
  src={srcOutput}
  alt={afterLabel}
  className="h-full w-full object-contain pointer-events-none select-none"
/>

{/* Original (clipped to left portion using precise clip-path) */}
<div
  className="absolute inset-0 overflow-hidden pointer-events-none select-none"
  style={{ clipPath: `inset(0 ${(100 - safePosition).toFixed(2)}% 0 0)` }}
>
  <img
    src={srcOriginal}
    alt={beforeLabel}
    className="h-full w-full object-contain pointer-events-none select-none"
  />
</div>
```

---

## 5. Verification Matrix & Test Strategy

| Test Suite | Scenario / Assertion | Expected Outcome |
| :--- | :--- | :--- |
| `npm test` | All 11 suites, 157+ test cases | Exit code 0, 100% pass |
| `npm run build` | Next.js App Router static export | Exit code 0, 33/33 routes generated, 0 TS errors |
| Contrast Verification | Light mode (`#F7F9FC`) and Dark mode (`#0B1020`) text color audit | Every status badge and alert has contrast ratio $\ge 4.5:1$ |
| Touch Target Audit | Mobile viewports (320px – 480px) | All buttons, preset chips, and slider thumbs have bounding box $\ge 44 \times 44\text{px}$ |
| Tabular Figures | Inspector test for `.tabular-nums` | Applied to all file sizes, percentages, dimensions, and attempt numbers |
| Privacy Invariant | Network inspection during execution | 0 network requests, 0 API calls, 100% local Canvas/Worker processing |
| Delivery Dock Flow | Execution of compression & download | Item appears in Download Dock, badge updates, FileDeliveredModal triggers |

---
