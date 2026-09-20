import { Metadata } from "next";
import { ToolsDirectory } from "@/components/tools/ToolsDirectory";

export const metadata: Metadata = {
  title: "All File Tools | FileFixer",
  description:
    "Explore FileFixer's image, PDF, batch, and file utility tools for compressing, converting, resizing, organizing, and managing files.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "All File Tools | FileFixer",
    description:
      "Explore FileFixer's image, PDF, batch, and file utility tools for compressing, converting, resizing, organizing, and managing files.",
    url: "/tools",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "All File Tools | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All File Tools | FileFixer",
    description:
      "Explore FileFixer's image, PDF, batch, and file utility tools for compressing, converting, resizing, organizing, and managing files.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function AllToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ToolsDirectory />
    </div>
  );
}
