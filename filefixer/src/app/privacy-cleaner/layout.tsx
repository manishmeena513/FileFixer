import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Cleaner — Sanitize Metadata & GPS Tags | FileFixer",
  description:
    "Scrub hidden camera EXIF tags, GPS location coordinates, and sensitive author dictionaries from images and documents locally in your browser.",
  alternates: {
    canonical: "/privacy-cleaner",
  },
  openGraph: {
    title: "Privacy Cleaner — Sanitize Metadata & GPS Tags | FileFixer",
    description:
      "Scrub hidden camera EXIF tags and GPS coordinates. 100% private client-side processing.",
    url: "/privacy-cleaner",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Privacy Cleaner | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Cleaner — Sanitize Metadata & GPS Tags | FileFixer",
    description:
      "Scrub hidden camera EXIF tags and GPS coordinates. 100% private client-side processing.",
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
