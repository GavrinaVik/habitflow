import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Увеличить ширину (для форм привычки) */
  wide?: boolean;
}

/** Базовая модалка: затемнение, клик по фону закрывает, анимация появления */
export default function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`animate-pop relative w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-card bg-white p-6 shadow-lift`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-black tracking-tight text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-btn text-lg text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}