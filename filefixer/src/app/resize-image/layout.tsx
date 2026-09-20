import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resize Images Online | FileFixer",
  description:
    "Resize JPG, PNG and WebP images directly in your browser. Choose custom dimensions and download your resized image privately.",
  alternates: {
    canonical: "/resize-image",
  },
  openGraph: {
    title: "Resize Images Online | FileFixer",
    description:
      "Resize images directly in your browser with FileFixer. Simple, fast and private.",
    url: "/resize-image",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Resize Images Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resize Images Online | FileFixer",
    description:
      "Resize images directly in your browser with FileFixer. Simple, fast and private.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function ResizeImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
