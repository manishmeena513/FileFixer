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
