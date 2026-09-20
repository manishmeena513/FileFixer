import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress Images Online | FileFixer",
  description:
    "Compress JPG, PNG and WebP images directly in your browser with FileFixer. Reduce image size while keeping your files private.",
  alternates: {
    canonical: "/compress-image",
  },
  openGraph: {
    title: "Compress Images Online | FileFixer",
    description:
      "Compress images directly in your browser. Fast, private and no upload required.",
    url: "/compress-image",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Compress Images Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress Images Online | FileFixer",
    description:
      "Compress images directly in your browser. Fast, private and no upload required.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function CompressImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
