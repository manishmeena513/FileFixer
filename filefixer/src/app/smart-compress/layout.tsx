import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Under-X-MB File Compressor | FileFixer",
  description: "Intelligent multi-pass optimizer that progressively tests compression levels to meet exact target file sizes.",
  alternates: {
    canonical: "/smart-compress",
  },
  openGraph: {
    title: "Smart Under-X-MB File Compressor | FileFixer",
    description: "Intelligent multi-pass optimizer that progressively tests compression levels to meet exact target file sizes.",
    url: "/smart-compress",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Smart Under-X-MB File Compressor | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Under-X-MB File Compressor | FileFixer",
    description: "Intelligent multi-pass optimizer that progressively tests compression levels to meet exact target file sizes.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function SmartCompressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
