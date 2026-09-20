import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Identity & Logo Assets | FileFixer",
  description: "Official FileFixer brand guidelines, vector logo assets, color tokens, and design specifications.",
  alternates: {
    canonical: "/branding",
  },
  openGraph: {
    title: "Brand Identity & Logo Assets | FileFixer",
    description: "Official FileFixer brand guidelines, vector logo assets, color tokens, and design specifications.",
    url: "/branding",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Brand Identity & Logo Assets | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Identity & Logo Assets | FileFixer",
    description: "Official FileFixer brand guidelines, vector logo assets, color tokens, and design specifications.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function BrandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
