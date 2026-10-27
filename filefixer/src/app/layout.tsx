import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WorkspaceDrawer } from "@/components/workspace/WorkspaceDrawer";
import { CommandCenter } from "@/components/command/CommandCenter";
import { KeyboardShortcutsModal } from "@/components/shortcuts/KeyboardShortcutsModal";
import { DownloadDock } from "@/components/download/DownloadDock";
import { FileDeliveredModal } from "@/components/download/FileDeliveredModal";
import { DownloadCenterModal } from "@/components/download/DownloadCenterModal";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";
import { SupportPrompt } from "@/components/support/SupportPrompt";
import { SupportModal } from "@/components/support/SupportModal";

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
  title: "FileFixer 3.0 — The Private File Workspace",
  description:
    "Compress, convert, resize, merge, split and organize your files directly in your browser. 100% private, no cloud uploads, no account required.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "FileFixer 3.0 — The Private File Workspace",
    description:
      "Compress, convert, resize, merge, split and organize your files directly in your browser. 100% private, zero server uploads.",
    url: "/",
    siteName: "FileFixer",
    images: [
      {
        url: "/branding/filefixer-og.png",
        width: 1200,
        height: 630,
        alt: "FileFixer 3.0 — The Private File Workspace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FileFixer 3.0 — The Private File Workspace",
    description:
      "Compress, convert, resize, merge, split and organize your files directly in your browser. Zero server uploads.",
    images: ["/branding/filefixer-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('filefixer_theme');
                var isDark = theme === 'dark' || (!theme) || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative selection:bg-blue-500/20 selection:text-blue-200">
        {/* Cinematic Atmospheric Light Engine */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[15%] left-[10%] w-[680px] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--ambient-glow-1)_0%,transparent_70%)] blur-[90px]" />
          <div className="absolute top-[32%] -right-[10%] w-[580px] h-[480px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--ambient-glow-2)_0%,transparent_70%)] blur-[90px]" />
          <div className="absolute -bottom-[10%] left-[25%] w-[620px] h-[440px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--ambient-glow-1)_0%,transparent_70%)] blur-[90px]" />
        </div>
        <PwaRegistration />
        <Toaster>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WorkspaceDrawer />
          <MobileBottomNav />
          <CommandCenter />
          <KeyboardShortcutsModal />
          <DownloadDock />
          <FileDeliveredModal />
          <DownloadCenterModal />
          <SupportPrompt />
          <SupportModal />
        </Toaster>
      </body>
    </html>
  );
}
