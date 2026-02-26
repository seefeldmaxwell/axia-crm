"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const iconColors: Record<string, string> = {
    success: "var(--accent-green)",
    error: "var(--accent-red)",
    info: "var(--accent-blue)",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-3 min-w-[280px] animate-[slideIn_0.2s_ease]"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-md)",
              color: "var(--text-primary)",
            }}
          >
            {t.type === "success" && <CheckCircle size={16} style={{ color: iconColors.success }} />}
            {t.type === "error" && <AlertCircle size={16} style={{ color: iconColors.error }} />}
            {t.type === "info" && <Info size={16} style={{ color: iconColors.info }} />}
            <span className="flex-1 text-[13px]" style={{ color: "var(--text-primary)" }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={{ color: "var(--text-secondary)" }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
