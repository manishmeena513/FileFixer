# Remediation Blueprint for Worker (Milestone 5 Iteration 2)

**Author**: `explorer_m5_r2` (Remediation Investigation Agent)  
**Target Consumer**: `worker_m5_r2`  
**Date**: 2026-10-24  
**Status**: APPROVED FOR REMEDIATION  

---

## Executive Summary

Reviewer 1 (`reviewer_m5_1`) issued a `REQUEST_CHANGES` verdict on Milestone 5 due to:
1. TypeScript compilation error TS2341 in challenger tests (`Property 'getInfoDict' is private and only accessible within class 'PDFDocument'`).
2. Test Failure A in `filefixer/tests/challenger-m5-adversarial.test.ts:191`: Negative index zero padding producing `"0-3"` instead of `"-03"` (or `"-003"`).
3. Test Failure B in `filefixer/tests/challenger-m5-adversarial.test.ts:390`: `pdf-lib` auto-injecting its Producer string on save/load.
4. Test Failure C in `filefixer/tests/m5-challenger-stress.test.ts:125`: Kebab-case delimiter collapsing expectation mismatch.

This document provides worker `worker_m5_r2` with exact, file-by-file, line-by-line instructions to resolve all four issues and ensure 100% clean passes for `npx tsc --noEmit`, `npm test`, and `npm run build`.

---

## Detailed Root Cause Analysis & Line-by-Line Fixes

### 1. Issue 1: TypeScript Build Error (TS2341) — Private Property `getInfoDict`

- **Affected Files**:
  - `filefixer/tests/challenger-m5-adversarial.test.ts`
  - `filefixer/tests/m5-challenger-stress.test.ts`
- **Root Cause**:
  In `pdf-lib`, `PDFDocument.prototype.getInfoDict` is declared `private` in TypeScript definitions (`index.d.ts`), but exists at runtime. When challenger tests called `doc.getInfoDict()` directly, TypeScript compiler flagged `error TS2341: Property 'getInfoDict' is private and only accessible within class 'PDFDocument'`. Because Next.js production build (`next build`) runs `tsc`, this blocked the build gate.
- **Remediation Specification**:
  Cast `doc`, `loadedDirty`, and `cleanedDoc` to `any` before calling `.getInfoDict()`.
  
  **Exact Locations in `filefixer/tests/challenger-m5-adversarial.test.ts`**:
  - Line 449: `const infoDict = (doc as any).getInfoDict();`
  - Line 465: `const dirtyInfo = (loadedDirty as any).getInfoDict();`
  - Line 480: `const cleanInfo = (cleanedDoc as any).getInfoDict();`

  **Exact Locations in `filefixer/tests/m5-challenger-stress.test.ts`**:
  - Line 304: `const infoDict = (doc as any).getInfoDict();`
  - Line 328: `const dirtyInfo = (loadedDirty as any).getInfoDict();`
  - Line 354: `const cleanInfo = (cleanedDoc as any).getInfoDict();`

- **Worker Action**:
  Verify these 6 lines in the test suites contain `(doc as any).getInfoDict()`. Run `npx tsc --noEmit` in `filefixer/` to confirm zero TS errors.

---

### 2. Issue 2: Failure A — Sign-Preserving Zero Padding for Negative Numbers

- **Affected Files**:
  - Implementation: `filefixer/src/lib/batch/rename.ts` (lines 143–147 and 180–183)
  - Adversarial Test: `filefixer/tests/challenger-m5-adversarial.test.ts` (lines 198–203)
- **Root Cause**:
  In `filefixer/src/lib/batch/rename.ts`, number padding was implemented as:
  ```typescript
  const padded = String(num).padStart(padding, "0");
  ```
  When `num` is negative (e.g. `startIndex: -5`, `index: 2` $\rightarrow$ `num = -3`), JavaScript converts `num` to `"-3"` (length 2). Calling `.padStart(3, "0")` pads a single `"0"` at index 0, producing `"0-3"`. When appended to a filename, this produces `img_0-3.png`.
  A negative number must maintain the minus sign as the leading character (`-03` or `-003`), not `0-3`.

- **Remediation Specification**:

  In `filefixer/src/lib/batch/rename.ts`:
  Add a dedicated helper function `formatPaddedNumber`:
  ```typescript
  /**
   * Formats a numeric sequence index with sign-preserving zero padding.
   * If num is negative, the minus sign is preserved at the front.
   * Total width is preserved: e.g. num = -3 with padding = 3 yields "-03".
   */
  export function formatPaddedNumber(num: number, padding: number): string {
    if (padding <= 0) return String(num);
    if (num < 0) {
      const digits = String(Math.abs(num)).padStart(Math.max(0, padding - 1), "0");
      return `-${digits}`;
    }
    return String(num).padStart(padding, "0");
  }
  ```

  Alternatively, if magnitude padding (where padding specifies the number of digits after the sign, e.g. `-003`) is desired:
  ```typescript
  export function formatPaddedNumber(num: number, padding: number): string {
    if (padding <= 0) return String(num);
    const sign = num < 0 ? "-" : "";
    const digits = String(Math.abs(num)).padStart(padding, "0");
    return `${sign}${digits}`;
  }
  ```
  *Recommendation*: Use total width padding (`num < 0 ? '-' + abs.padStart(padding - 1, '0') : num.padStart(padding, '0')`) as recommended by reviewer_m5_1, which produces `-03` for padding 3.

  **Update call sites in `filefixer/src/lib/batch/rename.ts`**:
  1. In template substitution (lines 143–147):
     ```typescript
     // BEFORE:
     const num = (rules.numbering?.startIndex ?? 1) + index;
     const hashMatch = tpl.match(/#+/);
     const padding = hashMatch ? hashMatch[0].length : rules.numbering?.padding ?? 3;
     const paddedNum = String(num).padStart(padding, "0");

     // AFTER:
     const num = (rules.numbering?.startIndex ?? 1) + index;
     const hashMatch = tpl.match(/#+/);
     const padding = hashMatch ? hashMatch[0].length : rules.numbering?.padding ?? 3;
     const paddedNum = formatPaddedNumber(num, padding);
     ```

  2. In number sequencing (lines 180–183):
     ```typescript
     // BEFORE:
     const num = (rules.numbering.startIndex ?? 1) + index;
     const padding = rules.numbering.padding ?? 3;
     const padded = String(num).padStart(padding, "0");

     // AFTER:
     const num = (rules.numbering.startIndex ?? 1) + index;
     const padding = rules.numbering.padding ?? 3;
     const padded = formatPaddedNumber(num, padding);
     ```

  **Update test assertion in `filefixer/tests/challenger-m5-adversarial.test.ts` (lines 198–203)**:
  ```typescript
  // BEFORE:
  // Negative startIndex: in JavaScript String(-3).padStart(3, "0") yields "0-3"
  const negStart = applyRenameRules("img.png", 2, {
    numbering: { enabled: true, startIndex: -5, padding: 3, position: "suffix" },
  });
  assert.equal(negStart, "img_0-3.png");

  // AFTER:
  // Negative startIndex: sign-preserving padding formats -3 with padding 3 as "-03"
  const negStart = applyRenameRules("img.png", 2, {
    numbering: { enabled: true, startIndex: -5, padding: 3, position: "suffix" },
  });
  assert.equal(negStart, "img_-03.png");
  ```
  *(Note: If magnitude padding `sign + abs.padStart(padding, '0')` is chosen, assert `"img_-003.png"`).*

---

### 3. Issue 3: Failure B — PDF Producer Metadata Sanitization

- **Affected Files**:
  - Implementation: `filefixer/src/lib/pdf/compress.ts` (lines 37, 68–75, 78–83)
  - Test: `filefixer/tests/challenger-m5-adversarial.test.ts` (lines 423–436)
- **Root Cause**:
  `pdf-lib` has internal behavior where `PDFDocument.create()` and `PDFDocument.load()` both accept `{ updateMetadata?: boolean }`, which defaults to `true`.
  When `updateMetadata: true`:
  - `pdf-lib` automatically runs `this.updateInfoDict()`.
  - Inside `updateInfoDict()`, `pdf-lib` executes `this.setProducer("pdf-lib (https://github.com/Hopding/pdf-lib)")`.
  
  Therefore:
  1. When `compressPDF` creates `newPdf` via `PDFDocument.create()`, `pdf-lib` populates `Producer` with its default URL string.
  2. Even more critically: when the test reloads the cleaned PDF via `PDFDocument.load(cleanedBytes, { ignoreEncryption: true })`, because `updateMetadata` was not set to `false`, `PDFDocument.load()` itself reinjected `"pdf-lib (https://github.com/Hopding/pdf-lib)"` on the loaded document object!

- **Remediation Specification**:

  1. In `filefixer/src/lib/pdf/compress.ts`:
     When metadata removal is requested (`options.removeMetadata || options.level === "smaller"`), create the new document with `{ updateMetadata: false }`:
     ```typescript
     // Lines 37 in src/lib/pdf/compress.ts:
     const shouldStripMetadata = Boolean(options.removeMetadata || options.level === "smaller");
     const newPdf = await PDFDocument.create({ updateMetadata: !shouldStripMetadata });
     ```
     And in the stripping branch (lines 68–75):
     ```typescript
     if (!options.removeMetadata && options.level !== "smaller") {
       // preserve original metadata ...
     } else {
       newPdf.setTitle("");
       newPdf.setAuthor("");
       newPdf.setSubject("");
       newPdf.setKeywords([]);
       newPdf.setProducer("");
       newPdf.setCreator("");
       try {
         const info = (newPdf as any).getInfoDict?.();
         if (info) {
           info.delete(PDFName.of("Producer"));
           info.delete(PDFName.of("Creator"));
         }
       } catch {
         // ignore if getInfoDict is unavailable
       }
     }
     ```

  2. In `filefixer/tests/challenger-m5-adversarial.test.ts` (lines 423–436):
     Pass `{ ignoreEncryption: true, updateMetadata: false }` when reloading `cleanedBytes`:
     ```typescript
     // Line 425:
     const cleanedDoc = await PDFDocument.load(cleanedBytes, {
       ignoreEncryption: true,
       updateMetadata: false,
     });

     assert.equal(cleanedDoc.getTitle() || "", "", "Title must be empty");
     assert.equal(cleanedDoc.getAuthor() || "", "", "Author must be empty");
     assert.equal(cleanedDoc.getSubject() || "", "", "Subject must be empty");
     assert.equal(cleanedDoc.getCreator() || "", "", "Creator must be empty");
     assert.notEqual(cleanedDoc.getProducer(), sensitiveProducer, "Sensitive producer must be stripped");
     assert.equal(cleanedDoc.getProducer() || "", "", "Producer must be completely stripped");
     ```

---

### 4. Issue 4: Failure C — Kebab-Case Delimiter Normalization

- **Affected Files**:
  - Implementation: `filefixer/src/lib/batch/rename.ts` (lines 76–83)
  - Test: `filefixer/tests/m5-challenger-stress.test.ts` (lines 125–137)
- **Root Cause**:
  `rename.ts` implements standard kebab-case conversion:
  ```typescript
  case "kebab":
    return input
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  ```
  This collapses consecutive delimiters (`___`, `---`, spaces) into a single hyphen `-`, and trims leading/trailing hyphens.
  The challenger test originally asserted three hyphens `hello-world---test-run`, which was an incorrect expectation for kebab-case.
- **Remediation Specification**:
  The implementation in `rename.ts` is canonical and correct.
  In `filefixer/tests/m5-challenger-stress.test.ts:131`, ensure the assertion expects the collapsed output:
  ```typescript
  assert.equal(applyCaseTransform("hello___world---test   run", "kebab"), "hello-world-test-run");
  assert.equal(applyCaseTransform("hello___world---test   run", "snake"), "hello_world_test_run");
  ```
- **Worker Action**:
  Verify that `m5-challenger-stress.test.ts` line 131 asserts `"hello-world-test-run"`. Both implementation and test are aligned.

---

## Remediation Checklist for `worker_m5_r2`

| # | Task | Target File | Line(s) | Status |
|---|------|-------------|---------|--------|
| 1 | Add `formatPaddedNumber` helper with sign-preserving zero padding | `filefixer/src/lib/batch/rename.ts` | 143–147, 180–183 | Pending Worker |
| 2 | Update negative start index test assertion from `"img_0-3.png"` to `"img_-03.png"` | `filefixer/tests/challenger-m5-adversarial.test.ts` | 198–203 | Pending Worker |
| 3 | In `compressPDF`, create `newPdf` with `{ updateMetadata: !shouldStrip }` and clean Producer | `filefixer/src/lib/pdf/compress.ts` | 37, 68–75 | Pending Worker |
| 4 | In PDF adversarial test, load cleaned PDF with `updateMetadata: false` and verify Producer is stripped | `filefixer/tests/challenger-m5-adversarial.test.ts` | 425, 434–436 | Pending Worker |
| 5 | Verify all occurrences of `getInfoDict()` in tests are cast via `(doc as any).getInfoDict()` | `filefixer/tests/challenger-m5-adversarial.test.ts`, `filefixer/tests/m5-challenger-stress.test.ts` | 449, 465, 480; 304, 328, 354 | Verified |
| 6 | Verify kebab-case test asserts `"hello-world-test-run"` | `filefixer/tests/m5-challenger-stress.test.ts` | 131 | Verified |
| 7 | Run TypeScript verification: `npx tsc --noEmit` in `filefixer` | N/A | CLI | Expected: 0 errors |
| 8 | Run full test suite: `npm test --prefix filefixer` | N/A | CLI | Expected: 376+ pass, 0 fail |
| 9 | Run Next.js static build: `npm run build --prefix filefixer` | N/A | CLI | Expected: 33/33 static pages |
| 10| Verify support QR asset SHA-256 hash | `public/images/filefixer_support_qr.png` | CLI | Must be `8592bd8a...` |

---

## Verification Commands & Expected Outputs

1. **TypeScript Type Check**:
   ```powershell
   cd filefixer; npx tsc --noEmit
   ```
   *Expected Result*: Exits with code 0 (zero errors).

2. **Full Test Suite Execution**:
   ```powershell
   npm test --prefix filefixer
   ```
   *Expected Result*: Exits with code 0, 100% tests passing across all suites.

3. **Production Static Export Build**:
   ```powershell
   npm run build --prefix filefixer
   ```
   *Expected Result*: Exits with code 0, 33/33 static pages generated without error.

4. **Preservation Invariant Check**:
   ```powershell
   powershell -Command "(Get-FileHash filefixer/public/images/filefixer_support_qr.png -Algorithm SHA256).Hash.ToLower()"
   ```
   *Expected Result*: `8592bd8a18457f3ac496d6735c472d7c4f3239e87b93771ed238d348b87d4744`.
