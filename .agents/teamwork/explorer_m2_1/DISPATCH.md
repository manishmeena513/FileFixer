# Dispatch for explorer_m2_1 (Homepage Hero & Smart Drop Zone Explorer)
Milestone 2
## 2026-10-23T13:57:50Z
Your identity: Homepage Hero & Smart Drop Zone Explorer (explorer_m2_1)
Your working directory: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m2_1
Original request path: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md
Project specification: c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\PROJECT.md

You MUST read c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\ORIGINAL_REQUEST.md first.

Task:
Explore and design the implementation plan for Milestone 2 Homepage Overhaul:
1. Inspect filefixer/src/app/page.tsx:
   - Hero section: Update copy to "Fix your files. Keep them private." with subtitle emphasizing speed, zero server uploads, and in-browser security.
   - Trust indicators: "100% On-Device • Zero Server Uploads • Instant Processing".
   - Replace any legacy "13 tools" copy with dynamic `${TOOLS.length} tools` (20 tools).
   - Smart Drag-and-Drop Zone:
     - Multi-format file ingestion with responsive drop target.
     - Automatic format detection: when a user drops or selects an image or PDF, inspect MIME type / extension and present instant recommended action buttons (e.g., Image: Compress, Resize, Convert, Strip Metadata; PDF: Compress, Split, Merge, Studio).
     - Seamless navigation to the selected tool with file passed via fileStore or URL/session state.
   - Quick Workflows section:
     - 1-click popular actions with high-contrast Swiss styling, touch targets >=44px, and .tabular-nums on file metrics.
2. Produce a detailed implementation plan with exact file paths and proposed diffs in c:\Users\nives\OneDrive\Documents\FileFixer\.agents\teamwork\explorer_m2_1\homepage_plan.md.
3. Write handoff.md in your working directory and notify the parent orchestrator via send_message when complete.
