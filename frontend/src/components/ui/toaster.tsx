"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-xl border bg-white shadow-lg p-4 animate-fade-in",
              toast.variant === "error" && "border-destructive/50 bg-destructive/5",
              toast.variant === "success" && "border-accent/50 bg-accent/5",
              toast.variant === "warning" && "border-warning/50 bg-warning/5"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {toast.title && <p className="font-medium text-sm">{toast.title}</p>}
                {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within Toaster");
  return ctx;
}