import React from "react";
import type { Metadata } from "next";
import { WorkspaceView } from "@/components/workspace/WorkspaceView";

export const metadata: Metadata = {
  title: "File Workspace — FileFixer 3.0",
  description:
    "Your private, browser-based file workstation. Inspect, optimize, resize, convert, and organize images and PDFs locally with zero cloud uploads.",
  alternates: {
    canonical: "/workspace",
  },
  openGraph: {
    title: "File Workspace — FileFixer 3.0",
    description:
      "Your private, browser-based file workstation. Inspect, optimize, resize, convert, and organize images and PDFs locally with zero cloud uploads.",
    url: "/workspace",
    images: ["/branding/filefixer-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "File Workspace — FileFixer 3.0",
    description:
      "Your private, browser-based file workstation. Inspect, optimize, resize, convert, and organize images and PDFs locally with zero cloud uploads.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function WorkspacePage() {
  return (
    <div className="w-full h-full">
      <WorkspaceView />
    </div>
  );
}
