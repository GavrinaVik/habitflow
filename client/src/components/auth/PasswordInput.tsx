import { useState, type FocusEvent } from "react";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Показывать индикатор сложности (для формы регистрации/сброса) */
  showStrength?: boolean;
  "aria-invalid"?: boolean;
}

const inputClasses =
  "w-full rounded-btn border border-ink/10 bg-canvas px-4 py-2.5 pr-11 text-sm outline-none transition-colors focus:border-primary";

/** Оценка сложности пароля: 0..4 */
function strengthScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-zа-яё]/i.test(pw) && /[0-9]/.test(pw)) score += 1;
  if (/[^a-zа-яё0-9]/i.test(pw)) score += 1;
  return score;
}

const strengthMeta = [
  { label: "Слабый", color: "bg-red-400", text: "text-red-500" },
  { label: "Средний", color: "bg-accent", text: "text-accent-dark" },
  { label: "Хороший", color: "bg-primary", text: "text-primary-dark" },
  { label: "Надёжный", color: "bg-green-500", text: "text-green-600" },
];

/**
 * Поле пароля с кнопкой «показать/скрыть» и индикатором сложности.
 */
export default function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  showStrength = false,
  "aria-invalid": ariaInvalid,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const score = strengthScore(value);
  const meta = score > 0 ? strengthMeta[Math.min(score, 4) - 1] : null;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="new-password"
          aria-invalid={ariaInvalid}
          className={inputClasses}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-ink-faint transition-colors hover:text-primary"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        >
          {visible ? "🙈" : "👁"}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-2">
          {/* Шкала сложности */}
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  segment <= score ? meta?.color ?? "bg-accent" : "bg-ink/10"
                }`}
              />
            ))}
          </div>
          {meta && <p className={`mt-1 text-xs font-semibold ${meta.text}`}>{meta.label}</p>}
        </div>
      )}
    </div>
  );
}