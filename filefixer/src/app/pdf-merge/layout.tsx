import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merge PDF Files Online | FileFixer",
  description:
    "Merge multiple PDF files into one document directly in your browser with FileFixer. Your files stay private.",
  alternates: {
    canonical: "/pdf-merge",
  },
  openGraph: {
    title: "Merge PDF Files Online | FileFixer",
    description:
      "Combine multiple PDFs into one document directly in your browser. Private and easy.",
    url: "/pdf-merge",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Merge PDF Files Online | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merge PDF Files Online | FileFixer",
    description:
      "Combine multiple PDFs into one document directly in your browser. Private and easy.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function PdfMergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
