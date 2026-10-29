# FileFixer — Deployment Guide

## Production Environment

- **Live Application URL**: [https://filefixer.vercel.app/](https://filefixer.vercel.app/)
- **Hosting Platform**: Vercel (Edge Network / Static CDN)
- **Deployment Type**: Static Site Generation (SSG) / Jamstack

---

## Vercel Project Configuration

Because the repository structure maintains a root `filefixer/` subdirectory for the Next.js application, Vercel must be configured with the proper Root Directory.

### 1. Root Directory Setting
In the Vercel Dashboard under **Project Settings $\rightarrow$ General**:
- **Root Directory**: `filefixer`
- **Include files outside the Root Directory in the Build Step**: No (or default)

### 2. Build & Development Settings
- **Framework Preset**: `Next.js`
- **Build Command**: `next build` (or default `npm run build`)
- **Output Directory**: `.next` (default Next.js build output)
- **Install Command**: `npm install` (or default)

### 3. Environment Variables
- **Zero Environment Variables Required**: FileFixer does not communicate with external databases, cloud storage buckets, or authentication providers. The production application builds cleanly with **zero environment variables**.

---

## Verification of a Successful Deployment

When a production deployment completes on Vercel:

1. **Static Pre-rendering**: Verify in build logs that all 33 routes pre-rendered with the static marker `○`:
   ```text
   Route (app)
   ┌ ○ /
   ├ ○ /_not-found
   ├ ○ /about
   ├ ○ /batch
   ├ ○ /batch-rename
   ├ ○ /branding
   ├ ○ /compress-image
   ├ ○ /convert-image
   ├ ○ /crop-image
   ├ ○ /history
   ├ ○ /image-metadata
   ├ ○ /image-studio
   ├ ○ /images-to-pdf
   ├ ○ /inspect
   ├ ○ /pdf-compress
   ├ ○ /pdf-merge
   ├ ○ /pdf-split
   ├ ○ /pdf-studio
   ├ ○ /pdf-workspace
   ├ ○ /privacy
   ├ ○ /privacy-cleaner
   ├ ○ /resize-image
   ├ ○ /robots.txt
   ├ ○ /sitemap.xml
   ├ ○ /smart-compress
   ├ ○ /terms
   ├ ○ /tools
   ├ ○ /workflows
   └ ○ /workspace
   ```

2. **Network Activity Check**: In the browser Developer Tools (Network tab), load `https://filefixer.vercel.app/`, upload a test image or PDF, and execute a compression or merge. Verify that **zero network requests** are sent during processing.

3. **PWA Service Worker Registration**: In Developer Tools $\rightarrow$ Application $\rightarrow$ Service Workers, confirm `sw.js` is registered and caching static shell resources for offline resilience.
