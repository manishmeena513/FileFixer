import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Processing History | FileFixer",
  description: "View your recent local browser processing history. All data is stored in your browser IndexedDB.",
  alternates: {
    canonical: "/history",
  },
  openGraph: {
    title: "Local Processing History | FileFixer",
    description: "View your recent local browser processing history. All data is stored in your browser IndexedDB.",
    url: "/history",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Local Processing History | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Processing History | FileFixer",
    description: "View your recent local browser processing history. All data is stored in your browser IndexedDB.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
