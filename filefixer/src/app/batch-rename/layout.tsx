import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batch File Rename Tool | FileFixer",
  description: "Rename collections of files using prefixes, suffixes, numbering, and patterns directly in your browser.",
  alternates: {
    canonical: "/batch-rename",
  },
  openGraph: {
    title: "Batch File Rename Tool | FileFixer",
    description: "Rename collections of files using prefixes, suffixes, numbering, and patterns directly in your browser.",
    url: "/batch-rename",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Batch File Rename Tool | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Batch File Rename Tool | FileFixer",
    description: "Rename collections of files using prefixes, suffixes, numbering, and patterns directly in your browser.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function BatchRenameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
