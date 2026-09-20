import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert Images to PDF Online | FileFixer",
  description: "Combine JPG, PNG and WebP images into a clean PDF document directly in your browser with FileFixer.",
  alternates: {
    canonical: "/images-to-pdf",
  },
  openGraph: {
    title: "Convert Images to PDF Online | FileFixer",
    description: "Combine JPG, PNG and WebP images into a clean PDF document directly in your browser with FileFixer.",
    url: "/images-to-pdf",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Convert Images to PDF Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert Images to PDF Online | FileFixer",
    description: "Combine JPG, PNG and WebP images into a clean PDF document directly in your browser with FileFixer.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function ImagesToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
