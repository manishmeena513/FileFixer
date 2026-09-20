import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop & Rotate Images Online | FileFixer",
  description: "Crop, rotate and frame your images directly in your browser with FileFixer. Free, fast and 100% private.",
  alternates: {
    canonical: "/crop-image",
  },
  openGraph: {
    title: "Crop & Rotate Images Online | FileFixer",
    description: "Crop, rotate and frame your images directly in your browser with FileFixer. Free, fast and 100% private.",
    url: "/crop-image",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Crop & Rotate Images Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crop & Rotate Images Online | FileFixer",
    description: "Crop, rotate and frame your images directly in your browser with FileFixer. Free, fast and 100% private.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function CropImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
