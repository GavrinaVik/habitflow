import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Обёртка поля формы: подпись, само поле, ошибка (красным) и подсказка.
 */
export default function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-red-500" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  );
}