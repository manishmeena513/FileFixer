"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, AlertCircle } from "lucide-react";
import { useFileStore } from "@/stores/fileStore";

export function SupportModal() {
  const { isSupportModalOpen, closeSupportModal } = useFileStore();
  const [imageFailed, setImageFailed] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Manage focus, Tab trapping & background scroll lock
  useEffect(() => {
    if (isSupportModalOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Initial focus on close button
      closeButtonRef.current?.focus();
      const timerId = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeSupportModal();
          return;
        }

        // Tab Focus Trap Loop
        if (e.key === "Tab" && modalContainerRef.current) {
          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timerId);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isSupportModalOpen, closeSupportModal]);

  if (!isSupportModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
      onClick={closeSupportModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-dialog-title"
      aria-describedby="support-dialog-desc"
    >
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[var(--glass-border-luminous)] bg-[var(--glass-surface-elevated)] backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.7)] animate-slide-up sm:animate-scale-in text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visible Close Button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={closeSupportModal}
          className="absolute top-4 right-4 flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation cursor-pointer"
          aria-label="Close support dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Copy Above the Image */}
        <div className="space-y-1.5 pt-1">
          <h2
            id="support-dialog-title"
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-[hsl(var(--foreground))]"
          >
            Support FileFixer
          </h2>
          <p
            id="support-dialog-desc"
            className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed max-w-xs mx-auto"
          >
            Scan this QR code with your preferred UPI app to support the continued development of free file tools.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="relative mx-auto flex items-center justify-center rounded-2xl bg-white p-3 sm:p-4 shadow-sm border border-slate-200/80 max-w-[280px] sm:max-w-[320px] transition-all">
          {!imageFailed ? (
            <Image
              src="/images/filefixer_support_qr.png"
              alt="FileFixer voluntary support UPI QR code"
              width={320}
              height={332}
              unoptimized
              priority
              className="w-full h-auto max-h-[46vh] sm:max-h-[340px] object-contain transition-opacity rounded-lg"
              onError={(e) => {
                console.error("Failed to load /images/filefixer_support_qr.png", e);
                setImageFailed(true);
              }}
            />
          ) : (
            <div className="py-8 px-4 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                Unable to load the support QR code at this moment.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                The rest of FileFixer remains fully functional and private.
              </p>
            </div>
          )}
        </div>

        {/* Copy Below the Image */}
        <div className="space-y-1 pt-1 pb-1">
          <p className="text-sm font-bold text-[hsl(var(--foreground))]">
            Any amount is appreciated ❤️
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Completely optional. All FileFixer tools remain free.
          </p>
        </div>
      </div>
    </div>
  );
}
