import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../context/ToastContext";

const TOAST_AUTO_DISMISS_MS = 4000;
const TOAST_EXIT_MS = 150;

interface ToastEntryProps {
  id: number;
  message: string;
  onRemove: (id: number) => void;
}

function ToastEntry({ id, message, onRemove }: ToastEntryProps) {
  const [isExiting, setIsExiting] = useState(false);
  const isExitingRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startExit = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);
    if (autoDismissRef.current !== null) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
    exitTimerRef.current = setTimeout(() => {
      onRemove(id);
    }, TOAST_EXIT_MS);
  }, [id, onRemove]);

  useEffect(() => {
    autoDismissRef.current = setTimeout(() => {
      startExit();
    }, TOAST_AUTO_DISMISS_MS);

    return () => {
      if (autoDismissRef.current !== null) {
        clearTimeout(autoDismissRef.current);
      }
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [startExit]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-accent/40 bg-[#1a1a1a] px-4 py-3 shadow-2xl max-w-sm ${
        isExiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <span className="flex-1 text-sm font-medium text-white">{message}</span>
      <button
        onClick={startExit}
        className="text-white/30 hover:text-white/70 transition-colors text-xs leading-none mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastEntry
          key={toast.id}
          id={toast.id}
          message={toast.message}
          onRemove={dismiss}
        />
      ))}
    </div>
  );
}
