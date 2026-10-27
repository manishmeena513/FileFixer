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
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all touch-manipulation cursor-pointer"
      title="Voluntary Support for FileFixer"
      aria-label="Support FileFixer"
    >
      <Heart className="h-3.5 w-3.5 fill-rose-500/30 text-rose-400" />
      <span>Support FileFixer</span>
    </button>
  );
}
