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

// ── Module-level singleton store ──────────────────────────
// Works regardless of where useToast() is called in the tree.
// Toaster writes to it, useToast reads from it.
let _addFn: ((t: Omit<Toast, "id">) => void) | null = null;
let _listener: (() => void) | null = null;
let _toasts: Toast[] = [];

export function useToast() {
  const [, rerender] = React.useState(0);

  React.useEffect(() => {
    const notify = () => rerender(n => n + 1);
    _listener = notify;
    return () => { _listener = null; };
  }, []);

  return {
    toasts: _toasts,
    addToast: (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      _toasts = [..._toasts, { ...t, id }];
      _listener?.();
      setTimeout(() => {
        _toasts = _toasts.filter(x => x.id !== id);
        _listener?.();
      }, 4000);
    },
    removeToast: (id: string) => {
      _toasts = _toasts.filter(x => x.id !== id);
      _listener?.();
    },
  };
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    _addFn = (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      _toasts = [..._toasts, { ...t, id }];
      setToasts([..._toasts]);
      setTimeout(() => {
        _toasts = _toasts.filter(x => x.id !== id);
        setToasts([..._toasts]);
      }, 4000);
    };
    return () => { _addFn = null; };
  }, []);

  return (
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
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
