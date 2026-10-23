# Milestone 3 Challenger Report: Adversarial Image Engine & Math Verification

**Agent**: Challenger 1 (`challenger_m3_1`)  
**Role**: Adversarial Image Engine & Math Challenger  
**Milestone**: M3 (Purpose-Built Image Workstations)  
**Parent Orchestrator ID**: `eb7c7517-1271-47fc-acd9-e4891655cf74`  
**Date**: 2026-10-23  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **Exposure Time Math in `src/lib/image/metadata.ts:41-48`**:
   - Implementation:
     ```typescript
     export function formatShutterSpeed(seconds: number | undefined): string | undefined {
       if (seconds === undefined || isNaN(seconds) || seconds <= 0) return undefined;
       if (seconds >= 1) {
         return `${seconds.toFixed(1).replace(/\.0$/, "")}s`;
       }
       const denominator = Math.round(1 / seconds);
       return `1/${denominator}s`;
     }
     ```
   - Automated tests confirmed correct outputs for long exposures:
     - `formatShutterSpeed(1)` $\to$ `"1s"`
     - `formatShutterSpeed(2)` $\to$ `"2s"`
     - `formatShutterSpeed(1.5)` $\to$ `"1.5s"`
     - `formatShutterSpeed(30)` $\to$ `"30s"`
   - Automated tests confirmed correct outputs for fractional shutter speeds:
     - `formatShutterSpeed(0.004)` $\to$ `"1/250s"`
     - `formatShutterSpeed(0.001)` $\to$ `"1/1000s"`
     - `formatShutterSpeed(0.5)` $\to$ `"1/2s"`
     - Non-positive / invalid inputs (`0`, `-1`, `NaN`, `undefined`) safely return `undefined`.

2. **GPS DMS Coordinate Direction Inversion in `src/lib/image/metadata.ts:50-58`**:
   - Implementation in `src/lib/image/metadata.ts:56`:
     ```typescript
     export function toDMS(deg: number, isLat: boolean): string {
       const absolute = Math.abs(deg);
       const degrees = Math.floor(absolute);
       const minutesNotTruncated = (absolute - degrees) * 60;
       const minutes = Math.floor(minutesNotTruncated);
       const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
       const direction = deg >= 0 ? (isLat ? "N" : "S") : (isLat ? "E" : "W");
       return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
     }
     ```
   - Execution of unit test in `filefixer/tests/adversarial-m3-challenger.test.ts`:
     - Test: `toDMS(-33.8688, true)` (Sydney, Australia latitude, -33.8688° S)
       - **Observed output**: `"33° 52' 7\" E"`
       - **Expected output**: `"33° 52' 7\" S"`
       - Error: `Expected Southern latitude to end with 'S', but got "33° 52' 7\" E"`
     - Test: `toDMS(77.2090, false)` (Delhi, India longitude, +77.2090° E)
       - **Observed output**: `"77° 12' 32\" S"`
       - **Expected output**: `"77° 12' 32\" E"`
       - Error: `Expected Eastern longitude to end with 'E', but got "77° 12' 32\" S"`
     - Test: `toDMS(151.2093, false)` (Sydney, Australia longitude, +151.2093° E)
       - **Observed output**: `"151° 12' 33\" S"`
       - **Expected output**: `"151° 12' 33\" E"`

3. **7-Pass Progressive Compression Loop in `src/lib/smartCompress.ts:104-165`**:
   - Monotonic decay verified:
     - Qualities: `0.82 -> 0.68 -> 0.52 -> 0.40 -> 0.28 -> 0.22 -> 0.16`
     - Max dimensions: `2560px -> 2048px -> 1600px -> 1280px -> 1024px -> 800px -> 640px`
   - Bypass verified: when `file.size <= targetSizeBytes`, returns attempt 1 directly without compression (`achieved: true`).
   - Extreme caps verified: Target sizes <100KB (`0.095 MB`), <50KB (`0.048 MB`), <10KB (`0.009 MB`) compute non-zero byte caps without NaN.
   - Canvas fallback verified: Web worker catch block falls back to `canvasResizeAndCompress(file, pass.quality, pass.maxDim)`.
   - PDF 2-pass compression verified: Pass 1 executes object stream deduplication; Pass 2 executes structural page hierarchy compaction.

4. **Crop Coordinate Synchronization on Rotated/Flipped Images in `src/app/crop-image/page.tsx:118-250`**:
   - Orientation changes are rendered into an offscreen canvas bitmap (`renderBitmap`), resulting in `displayImg` showing the transformed image at 0° CSS rotation.
   - 90° CW and 270° CCW rotations transpose natural dimensions correctly: $1920 \times 1080 \to 1080 \times 1920$.
   - `<ReactCrop>` operates on 0° displayed canvas with zero coordinate drift or inversion.
   - Export logic (`handleExport`) slices `(cropX, cropY, cropW, cropH)` directly from `displayImg` scaled by `naturalW / displayW`, with boundary clamping (`Math.max(0, ...)`, `Math.min(naturalW - cropX, ...)`).
   - `applyTransform` explicitly clears active crop (`setCrop(undefined); setCompletedCrop(null);`), preventing old crop coordinates from drifting onto new orientation dimensions.

5. **Aspect Ratio Presets & Calculations in `src/app/resize-image/page.tsx:81-124`**:
   - Aspect ratios verified:
     - 16:9 ($16/9 \approx 1.7778$): $1920 \times 1080$, $1280 \times 720$, $2560 \times 1440$
     - 4:3 ($4/3 \approx 1.3333$): $1024 \times 768$, $800 \times 600$
     - 1:1 ($1.0$): $1080 \times 1080$, $500 \times 500$
     - 9:16 ($9/16 = 0.5625$): $1080 \times 1920$, $720 \times 1280$
   - Bidirectional synchronization verified: changing width updates height as `Math.max(1, Math.round(w / ratio))`; changing height updates width as `Math.max(1, Math.round(h * ratio))`.
   - Percentage scaling verified on base dimensions ($25\% \to 480 \times 270$, $50\% \to 960 \times 540$, $200\% \to 3840 \times 2160$).

6. **Static Production Build & Ergonomics**:
   - `npm run build --prefix filefixer` exited with code 0: all 33 static routes generated successfully.
   - Universal `.tabular-nums` verified across all 7 image workstations.
   - All interactive buttons enforce `min-h-[44px]` touch targets.
   - `BeforeAfter.tsx` slider uses CSS `clip-path: inset(...)` with keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`).

---

## 2. Logic Chain

1. **Defect in `src/lib/image/metadata.ts:56`**:
   - In `toDMS(deg, isLat)`:
     `const direction = deg >= 0 ? (isLat ? "N" : "S") : (isLat ? "E" : "W");`
   - When `deg >= 0` (positive coordinate):
     The expression evaluates `isLat ? "N" : "S"`.
     For a latitude (`isLat === true`), it evaluates to `"N"`. This is correct.
     However, for a longitude (`isLat === false`), it evaluates to `"S"`! Longitude cannot be South. Positive longitude is Eastern hemisphere (**"E"**).
   - When `deg < 0` (negative coordinate):
     The expression evaluates `isLat ? "E" : "W"`.
     For a longitude (`isLat === false`), it evaluates to `"W"`. This is correct.
     However, for a latitude (`isLat === true`), it evaluates to `"E"`! Latitude cannot be East. Negative latitude is Southern hemisphere (**"S"**).
   - Impact: In the GPS Inspector card on `/image-metadata`, photos captured in Europe, Asia, Africa, or Australia have their Eastern longitudes displayed with an **"S"** label (e.g., Delhi, Tokyo, Paris, Sydney). Photos captured in Australia, South Africa, or South America have their Southern latitudes displayed with an **"E"** label.
   - Required fix:
     The conditional branching must test `isLat` first:
     ```typescript
     const direction = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
     ```

2. **Soundness of Remaining Image Workstations**:
   - Exposure time calculation (`formatShutterSpeed`) is mathematically sound and handles both integer and fractional shutter speeds.
   - Progressive 7-pass compression handles extreme caps gracefully without crashing.
   - Crop coordinate synchronization avoids CSS transform drift by rendering to an offscreen bitmap.
   - Aspect ratio calculations in `/resize-image` maintain strict geometric proportionality.

---

## 3. Caveats

- Node.js test environment requires polyfilling `FileReader` (standard in browsers) for testing `smartCompressPDF`, since `pdf-lib` stream saving expects ArrayBuffers. This was polyfilled in `adversarial-m3-challenger.test.ts` without modifying application source code.
- No other caveats; all image transformations remain 100% browser-native client-side with zero external network egress.

---

## 4. Conclusion

**Verdict**: **REQUEST_CHANGES**

While 6 of the 7 image workstations and mathematical engines are robust, well-synchronized, and pass static build gates, Milestone 3 cannot be approved in its current state due to the coordinate inversion defect in `src/lib/image/metadata.ts:56`.

### Action Required:
Worker M3 must update `src/lib/image/metadata.ts:56` from:
```typescript
const direction = deg >= 0 ? (isLat ? "N" : "S") : (isLat ? "E" : "W");
```
to:
```typescript
const direction = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
```

Once updated, all 46 tests in `filefixer/tests/adversarial-m3-challenger.test.ts` and the full test suite (`npm test --prefix filefixer`) will pass 100%.

---

## 5. Verification Method

1. **Run the Adversarial Test Suite**:
   ```powershell
   npx tsx --test tests/adversarial-m3-challenger.test.ts
   ```
   *Current result*: Exits with code 1, reporting:
   - `Expected Southern latitude to end with 'S', but got "33° 52' 7\" E"`
   - `Expected Eastern longitude to end with 'E', but got "77° 12' 32\" S"`

2. **Verify Fix**:
   After changing line 56 in `src/lib/image/metadata.ts`:
   ```powershell
   npm test --prefix filefixer
   npm run build --prefix filefixer
   ```
   *Expected result*: All 46 adversarial tests pass (0 failures), full test suite passes (all suites green), and static build succeeds with 33/33 static pages.
