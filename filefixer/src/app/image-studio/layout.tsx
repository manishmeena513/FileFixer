import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Studio — All-in-One Canvas Workstation | FileFixer",
  description:
    "All-in-one in-browser image workstation: crop, resize, compress, convert, and strip metadata on an interactive live canvas.",
  alternates: {
    canonical: "/image-studio",
  },
  openGraph: {
    title: "Image Studio — All-in-One Canvas Workstation | FileFixer",
    description:
      "All-in-one in-browser image workstation: crop, resize, compress, convert, and strip metadata on an interactive live canvas.",
    url: "/image-studio",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Image Studio — FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Studio — All-in-One Canvas Workstation | FileFixer",
    description:
      "All-in-one in-browser image workstation: crop, resize, compress, convert, and strip metadata on an interactive live canvas.",
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
