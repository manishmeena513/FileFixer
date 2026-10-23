import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Studio — Visual Image Editing Hub | FileFixer",
  description:
    "Integrated client-side image editing workspace. Compress, resize, crop, convert, and inspect images locally in your browser with zero server uploads.",
  alternates: {
    canonical: "/image-studio",
  },
  openGraph: {
    title: "Image Studio — Visual Image Editing Hub | FileFixer",
    description:
      "Integrated client-side image editing workspace. Fast, private, browser-native file utility.",
    url: "/image-studio",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Image Studio | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Studio — Visual Image Editing Hub | FileFixer",
    description:
      "Integrated client-side image editing workspace. Fast, private, browser-native file utility.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function ImageStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
