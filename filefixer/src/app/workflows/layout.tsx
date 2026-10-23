import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Automated File Workflows | FileFixer",
  description:
    "Combine multiple file operations into automated sequential pipelines. Resize, convert, compress, and strip metadata in one private browser run.",
  alternates: {
    canonical: "/workflows",
  },
  openGraph: {
    title: "Automated File Workflows | FileFixer",
    description:
      "Combine multiple file operations into automated sequential pipelines. Resize, convert, compress, and strip metadata in one private browser run.",
    url: "/workflows",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "Automated File Workflows | FileFixer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Automated File Workflows | FileFixer",
    description:
      "Combine multiple file operations into automated sequential pipelines. Resize, convert, compress, and strip metadata in one private browser run.",
    images: ["/branding/filefixer-og.png"],
  },
};

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
