# FileFixer — Testing Infrastructure & Specification

## 1. Overview & Testing Philosophy

FileFixer employs a **4-tier, requirement-driven, opaque-box testing harness** powered natively by the Node.js 22 Test Runner (`node:test` and `node:assert/strict`) via `tsx`.

The testing suite enforces:
1. **Zero-Server Invariant Verification**: Continuous static and structural assertions guaranteeing that files never leave the browser sandbox.
2. **Systematic 4-Tier Matrix**: Comprehensive coverage across features, boundaries, pairwise integrations, and real-world user scenarios.
3. **Execution Speed**: The entire suite of 421 tests runs in under 7 seconds without requiring headless browser overhead or network dependencies.

---

## 2. Running Tests Locally

Navigate to the `filefixer` directory and run:

```bash
cd filefixer
npm test
```

Or execute directly with tsx:
```bash
npx tsx --test tests/*.test.ts
```

To run a specific test suite file:
```bash
npx tsx --test tests/privacy-invariant.test.ts
```

---

## 3. Systematic 4-Tier Test Architecture

The test suite is structured into 4 distinct tiers:

### Tier 1: Primary Feature Coverage (`tier1-feature-coverage.test.ts`)
Covers primary behaviors and happy paths across all 5 functional areas:
- **R1: Design System & Shell**: CSS token definitions in `globals.css`, `.tabular-nums` formatting, Header ARIA and navigation structure, CommandCenter search palette and shortcuts (Ctrl/Cmd+K), MobileBottomNav dock.
- **R2: Homepage & Catalog**: Hero messaging, 20 canonical tools verification, category partitions, format tags, catalog filtering and live search.
- **R3: Tool Workstations**: Image MIME mapping, PDF split page range parser (`"1-3, 5"`), PDF merge preconditions, batch sequential rename index padding, optimization scoring calculation.
- **R4: Processing, Deliveries & Support**: Download dock queue management, voluntary support QR asset existence, modal Escape/focus management, floating dock layout.
- **R5: Responsive Design & Invariants**: Touch bounding box compliance ($\ge 44\times 44\text{px}$), zero server API endpoints, 33 static application routes, SEO metadata (`sitemap.ts`, `robots.ts`), PWA manifest and service worker.

### Tier 2: Boundary & Corner Cases (`tier2-boundary-corner.test.ts`)
Stress-tests boundary conditions and edge cases:
- **R1 Boundaries**: `prefers-reduced-motion` 0.01ms animation duration override, semantic border/input tokens, Switch/Slider focus rings, modern radius scale, command palette whitespace trimming.
- **R2 Boundaries**: Regex meta-characters in search, empty search returning all tools, unmatched queries triggering EmptyState, non-existent category fallbacks, 1,000-character query survival.
- **R3 Boundaries**: Negative and 0 page range clamping, inverted ranges (`"5-2"` $\rightarrow$ 2–5), non-numeric token discarding, `maxPages` bound clamping, single-hash and no-hash rename pattern fallbacks.
- **R4 Boundaries**: 20-item maximum capacity cap on download dock queue, `formatBytes` boundary values (0, 1023 B, 1 KB, 1 MB, 1 GB), `calcSavings` zero-division safety, download item status transitions, support modal image failure fallbacks.
- **R5 Boundaries**: Source code audit for zero remote API hosts, multi-dot and no-dot extension handling, safe fallback for unknown MIME types, root layout structure, custom 404 / not-found handling.

### Tier 3: Cross-Feature Combinations (`tier3-cross-feature.test.ts`)
Validates pairwise interactions across multiple tools:
- **TC-T3-1**: Button variants and sizes bound to semantic design system CSS variables.
- **TC-T3-2**: CommandCenter search items mapping directly to canonical `TOOLS` slugs.
- **TC-T3-3**: Sequential renaming template combined with target MIME format conversion.
- **TC-T3-4**: Multi-page PDF range splitting populating the Download Dock queue.
- **TC-T3-5**: Delivery completion updating delivered file modal without suppressing support modal.
- **TC-T3-6**: Catalog categories partitioning the exact 20 tools with zero overlap or orphans.
- **TC-T3-7**: MobileBottomNav matching canonical top-level routes with touch target compliance.

### Tier 4: Real-World Scenarios (`tier4-application-scenarios.test.ts`)
Validates realistic end-to-end user workflows:
- **Scenario 1**: Photographer imports high-res photo, scrubs GPS metadata, converts to WebP, and evaluates optimization score.
- **Scenario 2**: Corporate user merges 3 quarterly reports into a single consolidated PDF.
- **Scenario 3**: Academic thesis chapter extraction using complex multi-range expression.
- **Scenario 4**: E-commerce team standardizes 6 product photos into numbered WebP sequence.
- **Scenario 5**: Mobile citizen compresses identity scan under strict portal file limits with zero external network requests.

---

## 4. Invariant Verification Suites

In addition to functional tests, specialized challenger and invariant suites run on every commit:
- `privacy-invariant.test.ts`: Asserts zero API route files in `src/app/api` and zero egress tracking domains.
- `routes-and-design.test.ts`: Asserts all 33 static routes exist on disk, verifies light and dark design tokens, and checks QR code SHA-256 hash.
- `adversarial-contrast-layout-challenger-m1r2.test.ts`: Verifies WCAG AA color contrast math ($\ge 4.5:1$) for dark/light buttons and destructive actions.
- `adversarial-modal-accessibility.test.ts`: Tests accessibility attributes, keyboard trap prevention, and dialog dismissibility.
