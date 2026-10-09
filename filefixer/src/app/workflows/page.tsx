import React from "react";
import type { Metadata } from "next";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";

export const metadata: Metadata = {
  title: "Visual Workflow Builder — FileFixer 3.0",
  description:
    "Combine multiple file operations into automated sequential pipelines. Resize, convert, compress, and strip metadata in one private browser run.",
  alternates: {
    canonical: "/workflows",
  },
  openGraph: {
    title: "Visual Workflow Builder — FileFixer 3.0",
    description:
      "Combine multiple file operations into automated sequential pipelines. Resize, convert, compress, and strip metadata in one private browser run.",
    url: "/workflows",
    images: ["/branding/filefixer-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Workflow Builder — FileFixer 3.0",
    description:
      "Combine multiple file operations into automated sequential pipelines. Resize, convert, compress, and strip metadata in one private browser run.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function WorkflowsPage() {
  return (
    <div className="w-full">
      <WorkflowBuilder />
    </div>
  );
}
