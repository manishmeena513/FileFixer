import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://filefixer.vercel.app"),
  title: "FileFixer — Fix your files. Keep them private.",
  description:
    "Compress, convert, resize, merge, split and organize your files directly in your browser. 100% private, no cloud uploads, no account required.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/branding/filefixer-favicon.svg", type: "image/svg+xml" },
      { url: "/branding/filefixer-mark.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.svg" },
      { url: "/branding/filefixer-mark.svg" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
  openGraph: {
    title: "FileFixer — Fix your files. Keep them private.",
    description:
      "Compress, convert, resize, merge, split and organize your files directly in your browser. 100% private, zero server uploads.",
    url: "/",
    siteName: "FileFixer",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "FileFixer — Fix your files. Keep them private.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FileFixer — Fix your files. Keep them private.",
    description:
      "Compress, convert, resize, merge, split and organize your files directly in your browser. Zero server uploads.",
    images: ["/branding/filefixer-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <PwaRegistration />
        <Toaster>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Toaster>
      </body>
    </html>
  );
}
