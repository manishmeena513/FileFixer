import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert Images Online (JPG, PNG, WebP) | FileFixer",
  description: "Convert JPG, PNG and WebP images directly in your browser with FileFixer. Fast, private and no upload required.",
  alternates: {
    canonical: "/convert-image",
  },
  openGraph: {
    title: "Convert Images Online (JPG, PNG, WebP) | FileFixer",
    description: "Convert JPG, PNG and WebP images directly in your browser with FileFixer. Fast, private and no upload required.",
    url: "/convert-image",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Convert Images Online (JPG, PNG, WebP) | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert Images Online (JPG, PNG, WebP) | FileFixer",
    description: "Convert JPG, PNG and WebP images directly in your browser with FileFixer. Fast, private and no upload required.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function ConvertImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
