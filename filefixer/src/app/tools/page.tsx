import { Metadata } from "next";
import { ToolsDirectory } from "@/components/tools/ToolsDirectory";

export const metadata: Metadata = {
  title: "All File Tools | FileFixer",
  description:
    "Explore FileFixer's image, PDF, batch, and file utility tools for compressing, converting, resizing, organizing, and managing files.",
};

export default function AllToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ToolsDirectory />
    </div>
  );
}
