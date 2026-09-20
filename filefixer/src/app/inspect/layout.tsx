import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Universal File Inspector | FileFixer",
  description: "Inspect dimensions, MIME types, EXIF camera tags, GPS presence, and PDF metadata dictionaries locally.",
  alternates: {
    canonical: "/inspect",
  },
  openGraph: {
    title: "Universal File Inspector | FileFixer",
    description: "Inspect dimensions, MIME types, EXIF camera tags, GPS presence, and PDF metadata dictionaries locally.",
    url: "/inspect",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Universal File Inspector | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal File Inspector | FileFixer",
    description: "Inspect dimensions, MIME types, EXIF camera tags, GPS presence, and PDF metadata dictionaries locally.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function InspectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
