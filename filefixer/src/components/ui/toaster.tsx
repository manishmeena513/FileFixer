"use client";

import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast";
import { useFileStore } from "@/stores/fileStore";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

interface ToasterContextValue {
  toast: (data: Omit<ToastData, "id">) => void;
}

const ToasterContext = React.createContext<ToasterContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToasterContext);
  if (!ctx) throw new Error("useToast must be used within <Toaster>");
  return ctx;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((data: Omit<ToastData, "id">) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...data, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);

    // Trigger voluntary support prompt on successful processing operations
    if (data.variant === "success") {
      const titleLower = data.title.toLowerCase();
      const isExcluded =
        titleLower.includes("download") ||
        titleLower.includes("cleared") ||
        titleLower.includes("history") ||
        titleLower.includes("copied");

      if (!isExcluded) {
        useFileStore.getState().triggerSupportPrompt();
      }
    }
  }, []);

  return (
    <ToasterContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant} open>
            <div className="flex-1">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToasterContext.Provider>
  );
}
