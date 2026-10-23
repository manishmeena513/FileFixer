import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Cleaner — Strip EXIF, GPS & Author Tags | FileFixer",
  description:
    "Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags from images and PDFs in your browser.",
  alternates: {
    canonical: "/privacy-cleaner",
  },
  openGraph: {
    title: "Privacy Cleaner — Strip EXIF, GPS & Author Tags | FileFixer",
    description:
      "Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags from images and PDFs in your browser.",
    url: "/privacy-cleaner",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Privacy Cleaner — FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Cleaner — Strip EXIF, GPS & Author Tags | FileFixer",
    description:
      "Inspect and eliminate sensitive GPS coordinates, camera serial numbers, and author tags from images and PDFs in your browser.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PrivacyCleanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
