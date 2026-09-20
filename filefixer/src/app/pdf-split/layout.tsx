import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split & Extract PDF Pages Online | FileFixer",
  description: "Split PDF documents or extract specific page ranges directly in your browser with FileFixer. 100% private.",
  alternates: {
    canonical: "/pdf-split",
  },
  openGraph: {
    title: "Split & Extract PDF Pages Online | FileFixer",
    description: "Split PDF documents or extract specific page ranges directly in your browser with FileFixer. 100% private.",
    url: "/pdf-split",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Split & Extract PDF Pages Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Split & Extract PDF Pages Online | FileFixer",
    description: "Split PDF documents or extract specific page ranges directly in your browser with FileFixer. 100% private.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PdfSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
