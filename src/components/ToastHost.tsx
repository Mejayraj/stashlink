import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { useToastStore } from "@/lib/toast";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const reduce = useReducedMotion();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 8 }}
            transition={{ duration: reduce ? 0 : 0.12, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-hairline bg-canvas py-2 pl-4 pr-2"
          >
            <span className="text-sm text-ink">{t.message}</span>
            <span className="flex items-center">
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.run();
                    dismiss(t.id);
                  }}
                  className="h-8 rounded-full px-3 text-sm font-bold text-accent hover:bg-surface-card hover:text-accent-pressed"
                >
                  {a.label}
                </button>
              ))}
            </span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="flex size-8 items-center justify-center rounded-full text-ash hover:text-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
