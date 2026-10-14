"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useFileStore } from "@/stores/fileStore";

export function FooterSupportButton() {
  const { openSupportModal } = useFileStore();

  return (
    <button
      type="button"
      onClick={openSupportModal}
      className="inline-flex items-center gap-1.5 text-xs text-rose-400/90 hover:text-rose-400 hover:underline transition-colors cursor-pointer"
      title="Voluntary Support for FileFixer"
      aria-label="Support FileFixer"
    >
      <Heart className="h-3 w-3 fill-rose-500/20 text-rose-400" />
      <span>Support FileFixer</span>
    </button>
  );
}
