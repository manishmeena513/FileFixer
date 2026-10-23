import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Studio — Visual PDF Organizing Hub | FileFixer",
  description:
    "Interactive browser-native PDF workstation. Reorder, rotate, duplicate, extract, and split PDF pages with visual thumbnails and zero server uploads.",
  alternates: {
    canonical: "/pdf-studio",
  },
  openGraph: {
    title: "PDF Studio — Visual PDF Organizing Hub | FileFixer",
    description:
      "Interactive browser-native PDF workstation. 100% private on-device processing.",
    url: "/pdf-studio",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "PDF Studio | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Studio — Visual PDF Organizing Hub | FileFixer",
    description:
      "Interactive browser-native PDF workstation. 100% private on-device processing.",
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
