# Master Tools Registry & Synchronization Plan

**Milestone**: Milestone 2 (Homepage & Central Tools Directory Overhaul)  
**Author**: Explorer 3 (`explorer_m2_g2_3`)  
**Target Repository**: `filefixer` (Next.js 15 App Router, React 19, TypeScript)  
**Date**: 2026-10-23  

---

## 1. Executive Summary

This plan provides a comprehensive technical audit of the **FileFixer Master Tools Catalog** (`src/lib/tools.ts`), cross-referencing all **Next.js App Router routes** in `src/app/`, search indexing in `src/components/command/CommandCenter.tsx`, navigation menus in `src/components/layout/Header.tsx`, homepage presentation in `src/app/page.tsx`, and central catalog rendering in `src/app/tools/page.tsx` & `src/components/tools/ToolsDirectory.tsx`.

### Core Investigation Findings
1. **Catalog Integrity**: `TOOLS` in `src/lib/tools.ts` contains exactly **20 tools** cleanly partitioned into 4 categories (`images`: 6, `pdf`: 6, `batch`: 3, `utilities`: 5). Every tool possesses valid `id`, `name`, `slug`, `description`, `icon`, `category`, and `supportedFormats`.
2. **Route Alignment**: Every one of the 20 tools corresponds 1:1 with an existing route in `src/app/`. The full application has 26 page routes (20 tools + 6 system/informational pages) generating 33 static targets during Next.js build.
3. **Metadata Gap**: Exactly **3 tool routes** (`/image-studio`, `/pdf-studio`, and `/privacy-cleaner`) are `"use client"` components that lack a server `layout.tsx` metadata wrapper. As a result, these three routes fall back to root site metadata and lack dedicated page titles, descriptions, canonical URLs, and OpenGraph metadata.
4. **Command Center Gap**: `CommandCenter.tsx` contains 15 tools in `allItems`, but is **missing 5 tools** from the catalog: `/image-metadata`, `/pdf-workspace`, `/batch-rename`, `/inspect`, and `/history`.
5. **Homepage Copy Stale Reference**: `src/app/page.tsx` contains legacy hardcoded copy referencing `"all 13 tools"` (lines 540 and 627), which contradicts the 20-tool platform reality.
6. **Interface Contract Compatibility**: `ToolItem` in `tools.ts` defines `slug: string` and `supportedFormats?: string[]`, while `PROJECT.md` interface contracts describe `href` and `formats`. Adding `href?: string` and `formats?: string[]` as first-class properties or aliases will ensure universal contract compliance without breaking existing code.

---

## 2. Complete Audit of Master Tools Catalog (`src/lib/tools.ts`)

### 2.1 Complete 20-Tool Inventory Matrix

| # | ID | Name | Slug / Route | Category (Key) | Icon | Badge | Formats | Popular | Route Exists? | Layout Metadata? |
|---|----|------|--------------|----------------|------|-------|---------|---------|---------------|------------------|
| 1 | `workspace` | File Workspace | `/workspace` | Utilities (`utilities`) | `FolderKanban` | `3.0 Signature` | Images, PDF | Yes | Yes (`app/workspace/`) | Yes (`page.tsx` metadata) |
| 2 | `workflows` | Visual Workflow Builder | `/workflows` | Batch (`batch`) | `Workflow` | `New` | Images | Yes | Yes (`app/workflows/`) | Yes (`page.tsx` metadata) |
| 3 | `image-studio` | Image Studio | `/image-studio` | Images (`images`) | `FileImage` | `Workstation` | JPG, PNG, WebP | Yes | Yes (`app/image-studio/`) | ❌ **MISSING layout.tsx** |
| 4 | `pdf-studio` | PDF Studio | `/pdf-studio` | PDF (`pdf`) | `FileText` | `Workstation` | PDF | Yes | Yes (`app/pdf-studio/`) | ❌ **MISSING layout.tsx** |
| 5 | `privacy-cleaner` | Privacy Cleaner | `/privacy-cleaner` | Utilities (`utilities`) | `Shield` | `Security` | Images, PDF | Yes | Yes (`app/privacy-cleaner/`) | ❌ **MISSING layout.tsx** |
| 6 | `compress-image` | Compress Image | `/compress-image` | Images (`images`) | `Minimize2` | `Popular` | JPG, PNG, WebP | Yes | Yes (`app/compress-image/`) | Yes (`layout.tsx`) |
| 7 | `resize-image` | Resize Image | `/resize-image` | Images (`images`) | `Maximize2` | `Presets` | JPG, PNG, WebP | Yes | Yes (`app/resize-image/`) | Yes (`layout.tsx`) |
| 8 | `convert-image` | Convert Image | `/convert-image` | Images (`images`) | `RefreshCw` | `Batch` | JPG, PNG, WebP | No | Yes (`app/convert-image/`) | Yes (`layout.tsx`) |
| 9 | `crop-image` | Crop & Rotate | `/crop-image` | Images (`images`) | `Crop` | — | JPG, PNG, WebP | No | Yes (`app/crop-image/`) | Yes (`layout.tsx`) |
| 10 | `image-metadata` | Image Metadata & Privacy | `/image-metadata` | Images (`images`) | `Shield` | `Privacy` | JPG, PNG, WebP | No | Yes (`app/image-metadata/`) | Yes (`layout.tsx`) |
| 11 | `pdf-merge` | Merge PDF | `/pdf-merge` | PDF (`pdf`) | `FilePlus` | `Popular` | PDF | Yes | Yes (`app/pdf-merge/`) | Yes (`layout.tsx`) |
| 12 | `pdf-split` | Split & Extract PDF | `/pdf-split` | PDF (`pdf`) | `Scissors` | `Fast` | PDF | Yes | Yes (`app/pdf-split/`) | Yes (`layout.tsx`) |
| 13 | `pdf-compress` | Compress PDF | `/pdf-compress` | PDF (`pdf`) | `FileDown` | — | PDF | No | Yes (`app/pdf-compress/`) | Yes (`layout.tsx`) |
| 14 | `pdf-workspace` | PDF Visual Workspace | `/pdf-workspace` | PDF (`pdf`) | `Layers` | `Interactive` | PDF | No | Yes (`app/pdf-workspace/`) | Yes (`layout.tsx`) |
| 15 | `images-to-pdf` | Images to PDF | `/images-to-pdf` | PDF (`pdf`) | `Images` | — | JPG, PNG, WebP | No | Yes (`app/images-to-pdf/`) | Yes (`layout.tsx`) |
| 16 | `batch` | Batch Studio | `/batch` | Batch (`batch`) | `Layers` | `Power Tool` | JPG, PNG, WebP | Yes | Yes (`app/batch/`) | Yes (`layout.tsx`) |
| 17 | `batch-rename` | Batch Sequence Rename | `/batch-rename` | Batch (`batch`) | `Layers` | — | All files | No | Yes (`app/batch-rename/`) | Yes (`layout.tsx`) |
| 18 | `smart-compress` | Smart 'Under X MB' | `/smart-compress` | Utilities (`utilities`) | `Sparkles` | `Signature` | Images, PDF | Yes | Yes (`app/smart-compress/`) | Yes (`layout.tsx`) |
| 19 | `inspect` | Universal File Inspector | `/inspect` | Utilities (`utilities`) | `FileSearch` | — | All files | No | Yes (`app/inspect/`) | Yes (`layout.tsx`) |
| 20 | `history` | Local Processing History | `/history` | Utilities (`utilities`) | `Clock` | — | Local data | No | Yes (`app/history/`) | Yes (`layout.tsx`) |

### 2.2 Category Partition Verification
- **All Tools**: 20 total.
- **Images (`images`)**: 6 tools (`image-studio`, `compress-image`, `resize-image`, `convert-image`, `crop-image`, `image-metadata`).
- **PDF (`pdf`)**: 6 tools (`pdf-studio`, `pdf-merge`, `pdf-split`, `pdf-compress`, `pdf-workspace`, `images-to-pdf`).
- **Batch (`batch`)**: 3 tools (`workflows`, `batch`, `batch-rename`).
- **Utilities (`utilities`)**: 5 tools (`workspace`, `privacy-cleaner`, `smart-compress`, `inspect`, `history`).
- **Popular tools**: Exactly 10 tools marked `isPopular: true`.

*Verification Result*: Categorization perfectly satisfies test `TC-T3-6` in `tier3-cross-feature.test.ts` (0 orphans, 0 overlaps).

---

## 3. Metadata & App Router Gap Analysis

### 3.1 Metadata Architecture in Next.js App Router
In Next.js App Router:
- **Server Components** (`page.tsx` without `"use client"`) can export `export const metadata: Metadata = { ... }`.
- **Client Components** (`page.tsx` starting with `"use client"`) **CANNOT** export `metadata`. If they do, Next.js throws an error during compilation.
- For Client Components, metadata **MUST** be defined in a co-located `layout.tsx` Server Component that renders `{children}`.

### 3.2 The 3 Missing Layout Metadata Wrappers
The following three routes are Client Components and currently lack a `layout.tsx`:

#### 1. `src/app/image-studio/layout.tsx` (Missing)
- **Current Behavior**: Renders with root fallback title (`FileFixer 3.0 — The Private File Workspace`).
- **Required Fix**: Create `src/app/image-studio/layout.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Studio — All-in-One Canvas Workstation | FileFixer",
  description:
    "All-in-one in-browser image workstation: crop, resize, compress, convert, and strip metadata on an interactive live canvas.",
  alternates: {
    canonical: "/image-studio",
  },
  openGraph: {
    title: "Image Studio — All-in-One Canvas Workstation | FileFixer",
    description:
      "All-in-one in-browser image workstation: crop, resize, compress, convert, and strip metadata on an interactive live canvas.",
    url: "/image-studio",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Image Studio — FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Studio — All-in-One Canvas Workstation | FileFixer",
    description:
      "All-in-one in-browser image workstation: crop, resize, compress, convert, and strip metadata on an interactive live canvas.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function ImageStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

#### 2. `src/app/pdf-studio/layout.tsx` (Missing)
- **Current Behavior**: Renders with root fallback title.
- **Required Fix**: Create `src/app/pdf-studio/layout.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Studio — Visual PDF Workbench & Page Editor | FileFixer",
  description:
    "Visual PDF page workstation: drag to reorder, rotate, delete, duplicate, merge, and compress pages with zero server uploads.",
  alternates: {
    canonical: "/pdf-studio",
  },
  openGraph: {
    title: "PDF Studio — Visual PDF Workbench & Page Editor | FileFixer",
    description:
      "Visual PDF page workstation: drag to reorder, rotate, delete, duplicate, merge, and compress pages with zero server uploads.",
    url: "/pdf-studio",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "PDF Studio — FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Studio — Visual PDF Workbench & Page Editor | FileFixer",
    description:
      "Visual PDF page workstation: drag to reorder, rotate, delete, duplicate, merge, and compress pages with zero server uploads.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PdfStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

#### 3. `src/app/privacy-cleaner/layout.tsx` (Missing)
- **Current Behavior**: Renders with root fallback title.
- **Required Fix**: Create `src/app/privacy-cleaner/layout.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Cleaner — Strip EXIF, GPS & Author Tags | FileFixer",
  description:
    "Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags from images and PDFs in your browser.",
  alternates: {
    canonical: "/privacy-cleaner",
  },
  openGraph: {
    title: "Privacy Cleaner — Strip EXIF, GPS & Author Tags | FileFixer",
    description:
      "Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags from images and PDFs in your browser.",
    url: "/privacy-cleaner",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Privacy Cleaner — FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Cleaner — Strip EXIF, GPS & Author Tags | FileFixer",
    description:
      "Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags from images and PDFs in your browser.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PrivacyCleanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

---

## 4. Cross-Component Synchronization Audit

### 4.1 CommandCenter Search Palette (`src/components/command/CommandCenter.tsx`)
`CommandCenter.tsx` provides quick keyboard-driven navigation (Ctrl+K).
Currently, its `allItems` array defines 15 tools, 4 presets, 4 workflows, and 1 support trigger.

**Discrepancy: 5 Tools Missing from CommandCenter**:
1. `/image-metadata` (Image Metadata & Privacy / EXIF & GPS Stripper)
2. `/pdf-workspace` (PDF Visual Page Workspace)
3. `/batch-rename` (Batch Sequence Rename)
4. `/inspect` (Universal File Inspector)
5. `/history` (Local Processing History)

**Recommended Additions to `allItems`**:
```tsx
      // In Quick Actions:
      {
        id: "action-image-metadata",
        category: "Quick Actions",
        title: "Image Metadata & Privacy",
        subtitle: "Inspect camera settings and strip sensitive EXIF & GPS tags",
        icon: Shield,
        action: () => navigateTo("/image-metadata"),
        keywords: ["exif", "metadata", "gps", "camera", "privacy", "strip", "clean"],
      },
      {
        id: "action-pdf-workspace",
        category: "Quick Actions",
        title: "PDF Visual Workspace",
        subtitle: "Reorder, rotate, duplicate, and delete PDF pages interactively",
        icon: Layers,
        action: () => navigateTo("/pdf-workspace"),
        keywords: ["pdf workspace", "reorder pages", "rotate pdf", "delete page", "organize pdf"],
      },
      {
        id: "action-batch-rename",
        category: "Quick Actions",
        title: "Batch Sequence Rename",
        subtitle: "Standardize file names into numbered templates and patterns",
        icon: Layers,
        action: () => navigateTo("/batch-rename"),
        keywords: ["rename", "batch rename", "sequence", "numbering", "template", "pattern"],
      },
      {
        id: "action-inspect",
        category: "Quick Actions",
        title: "Universal File Inspector",
        subtitle: "Examine MIME types, dimensions, EXIF tags, and PDF dictionaries",
        icon: FileSearch,
        action: () => navigateTo("/inspect"),
        keywords: ["inspect", "inspector", "mime", "details", "technical", "audit"],
      },
      {
        id: "action-history",
        category: "Quick Actions",
        title: "Local Processing History",
        subtitle: "Review past file processing logs and saved bandwidth telemetry",
        icon: Clock,
        action: () => navigateTo("/history"),
        keywords: ["history", "logs", "saved", "telemetry", "indexeddb", "bandwidth"],
      },
```
With these 5 items added, `CommandCenter` achieves **100% coverage** of all 20 catalog tools.

### 4.2 Homepage Presentation (`src/app/page.tsx`)
- **Stale Text Bug (Lines 540 & 627)**:
  - Line 540: `Browse all 13 tools <ArrowRight className="h-3.5 w-3.5" />`
  - Line 627: `Explore all 13 local tools`
  - **Fix**: Update copy to reference `20 tools` or dynamic `{TOOLS.length}` (importing `TOOLS` from `@/lib/tools`).
- **Smart Quick Actions & Quick Tools**:
  - `quickTools` array currently lists 9 handpicked tools.
  - In Milestone 2 implementation, ensure `quickTools` descriptions and routes align with `TOOLS`.

### 4.3 Navigation Header (`src/components/layout/Header.tsx`)
- Desktop `navLinks`:
  - "Studios": contains 5 workstations (`/image-studio`, `/pdf-studio`, `/batch`, `/workflows`, `/privacy-cleaner`).
  - "Images": contains 6 tools (`/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/smart-compress`, `/image-metadata`).
  - "PDF": contains 5 tools (`/pdf-merge`, `/pdf-split`, `/pdf-compress`, `/pdf-workspace`, `/images-to-pdf`).
  - Direct links: `/workspace`, `/tools`, `/history`.
  - *Observation*: `/batch-rename` and `/inspect` are accessible via `/tools` and `CommandCenter`. Adding a dedicated Batch dropdown or incorporating `/batch-rename` under Studios would provide full desktop nav reach.
- Mobile `mobileLinks`:
  - Contains 16 top-level shortcuts. Users can reach any tool via `/tools` or the MobileBottomNav search trigger.

### 4.4 Central Tools Directory (`src/components/tools/ToolsDirectory.tsx`)
- Fully synchronized with `TOOLS` and `CATEGORIES`.
- Category tabs: All (20), Images (6), PDF (6), Batch (3), Utilities (5).
- Search filter: Dynamically queries `name`, `description`, `category`, and `supportedFormats`.
- Top section: Renders 10 popular tools when in default view.
- EmptyState: Gracefully informs user when no results match search query.

---

## 5. Tool Item Interface Contract Harmonization

In `src/lib/tools.ts`, `ToolItem` is currently defined as:
```ts
export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  categoryKey: "images" | "pdf" | "batch" | "utilities";
  categoryLabel: string;
  icon: LucideIcon;
  badge?: string;
  featureIndicator?: string;
  supportedFormats?: string[];
  isPopular?: boolean;
}
```

In `PROJECT.md`, the interface contract specifies:
`Each tool defines: id, name, description, icon, href, category, badge, formats.`

### Proposed Interface Harmonization
Update `ToolItem` in `src/lib/tools.ts` to include optional or first-class properties:
```ts
export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  href?: string;             // Alias for slug
  description: string;
  category: ToolCategory;
  categoryKey: "images" | "pdf" | "batch" | "utilities";
  categoryLabel: string;
  icon: LucideIcon;
  badge?: string;
  featureIndicator?: string;
  formats?: string[];        // Alias for supportedFormats
  supportedFormats?: string[];
  isPopular?: boolean;
}
```
And in each tool definition:
`href: "<slug>",`
`formats: [...],`
This satisfies both existing consumers (which use `tool.slug` and `tool.supportedFormats`) and any consumer adhering to the `PROJECT.md` contract.

---

## 6. Implementation Checklist for Milestone 2 Implementers

### Phase 1: Master Tools Catalog Harmonization (`src/lib/tools.ts`)
- [ ] Add `href` and `formats` properties to `ToolItem` interface.
- [ ] Add `href: tool.slug` and `formats: tool.supportedFormats` to all 20 entries in `TOOLS`.
- [ ] Verify test suite `npm test` still passes 100% of tests.

### Phase 2: Metadata Wrapper Creation
- [ ] Create `src/app/image-studio/layout.tsx` with full SEO metadata and OpenGraph tags.
- [ ] Create `src/app/pdf-studio/layout.tsx` with full SEO metadata and OpenGraph tags.
- [ ] Create `src/app/privacy-cleaner/layout.tsx` with full SEO metadata and OpenGraph tags.
- [ ] Run `npm run build --prefix filefixer` to confirm static route generation succeeds.

### Phase 3: Command Center Synchronization (`src/components/command/CommandCenter.tsx`)
- [ ] Import missing icons (`FileSearch`, etc.).
- [ ] Add 5 missing tools to `allItems`:
  - `action-image-metadata` (`/image-metadata`)
  - `action-pdf-workspace` (`/pdf-workspace`)
  - `action-batch-rename` (`/batch-rename`)
  - `action-inspect` (`/inspect`)
  - `action-history` (`/history`)
- [ ] Verify keyboard search in `CommandCenter` matches all 20 tools.

### Phase 4: Homepage Copy Synchronization (`src/app/page.tsx`)
- [ ] Replace `"Browse all 13 tools"` on line 540 with `"Browse all 20 tools"` or `{TOOLS.length}`.
- [ ] Replace `"Explore all 13 local tools"` on line 627 with `"Explore all 20 local tools"` or dynamic `{TOOLS.length}`.
- [ ] Verify smart file drop zone and tool links route properly.

### Phase 5: Verification Gate
- [ ] Run `npm test` across all 11 test files in `filefixer/tests/`.
- [ ] Run `npm run build --prefix filefixer` to ensure exit code 0 and all 33 static routes prerendered.
- [ ] Verify zero console errors, zero TypeScript errors.
