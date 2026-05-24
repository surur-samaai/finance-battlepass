import { useToast } from "../context/ToastContext";

export default function Toast() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-accent/40 bg-[#1a1a1a] px-4 py-3 shadow-2xl max-w-sm"
        >
          <span className="flex-1 text-sm font-medium text-white">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-white/30 hover:text-white/70 transition-colors text-xs leading-none mt-0.5"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
