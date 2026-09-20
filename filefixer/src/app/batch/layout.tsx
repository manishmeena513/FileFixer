import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batch Image Processing Pipeline | FileFixer",
  description: "Execute multi-stage image processing (Resize, Convert, Compress, Rename) in one pass in your browser.",
  alternates: {
    canonical: "/batch",
  },
  openGraph: {
    title: "Batch Image Processing Pipeline | FileFixer",
    description: "Execute multi-stage image processing (Resize, Convert, Compress, Rename) in one pass in your browser.",
    url: "/batch",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Batch Image Processing Pipeline | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Batch Image Processing Pipeline | FileFixer",
    description: "Execute multi-stage image processing (Resize, Convert, Compress, Rename) in one pass in your browser.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function BatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
