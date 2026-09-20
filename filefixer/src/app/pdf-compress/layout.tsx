import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress PDF Files Online | FileFixer",
  description: "Reduce PDF document file size directly in your browser with FileFixer. No cloud uploads, completely private.",
  alternates: {
    canonical: "/pdf-compress",
  },
  openGraph: {
    title: "Compress PDF Files Online | FileFixer",
    description: "Reduce PDF document file size directly in your browser with FileFixer. No cloud uploads, completely private.",
    url: "/pdf-compress",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Compress PDF Files Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress PDF Files Online | FileFixer",
    description: "Reduce PDF document file size directly in your browser with FileFixer. No cloud uploads, completely private.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PdfCompressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
