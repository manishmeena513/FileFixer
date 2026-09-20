import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visual PDF Page Workspace | FileFixer",
  description: "Reorder, rotate, duplicate and delete PDF pages interactively in your browser with FileFixer.",
  alternates: {
    canonical: "/pdf-workspace",
  },
  openGraph: {
    title: "Visual PDF Page Workspace | FileFixer",
    description: "Reorder, rotate, duplicate and delete PDF pages interactively in your browser with FileFixer.",
    url: "/pdf-workspace",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Visual PDF Page Workspace | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual PDF Page Workspace | FileFixer",
    description: "Reorder, rotate, duplicate and delete PDF pages interactively in your browser with FileFixer.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PdfWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
