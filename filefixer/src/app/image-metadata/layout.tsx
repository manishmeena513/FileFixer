import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EXIF & GPS Metadata Stripper | FileFixer",
  description: "Inspect and strip sensitive EXIF camera tags and GPS location data from images directly in your browser.",
  alternates: {
    canonical: "/image-metadata",
  },
  openGraph: {
    title: "EXIF & GPS Metadata Stripper | FileFixer",
    description: "Inspect and strip sensitive EXIF camera tags and GPS location data from images directly in your browser.",
    url: "/image-metadata",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "EXIF & GPS Metadata Stripper | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EXIF & GPS Metadata Stripper | FileFixer",
    description: "Inspect and strip sensitive EXIF camera tags and GPS location data from images directly in your browser.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function ImageMetadataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
