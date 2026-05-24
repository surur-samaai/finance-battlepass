import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToasts: (messages: string[]) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToasts = useCallback(
    (messages: string[]) => {
      const newItems: ToastItem[] = messages.map((message) => ({
        id: nextId++,
        message,
      }));

      setToasts((prev) => [...prev, ...newItems]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, showToasts, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
