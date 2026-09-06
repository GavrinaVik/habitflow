import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "outline" | "accent" | "light" | "glass";
type Size = "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Роут внутри приложения (рендерит Link из react-router) */
  to?: string;
  /** Внешняя ссылка (рендерит <a>) */
  href?: string;
  className?: string;
  /** Атрибут для целей Я.Метрики */
  "data-metrica"?: string;
  type?: "button" | "submit";
  onClick?: MouseEventHandler<HTMLElement>;
  ariaLabel?: string;
  /** Показывает спиннер и блокирует кнопку */
  loading?: boolean;
  disabled?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-btn font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-soft hover:bg-primary-dark hover:shadow-lift hover:scale-[1.02]",
  secondary: "bg-ink text-white shadow-soft hover:bg-ink/90 hover:shadow-lift",
  outline:
    "border border-ink/10 bg-white text-ink hover:border-primary/40 hover:text-primary",
  // Акцентный фиолетовый (#8B5CF6) — для выделенного тарифа Pro
  accent:
    "bg-violet-500 text-white shadow-soft hover:bg-violet-600 hover:shadow-lift hover:scale-[1.02]",
  // Белая кнопка для ярких градиентных секций (hero)
  light:
    "bg-white text-primary shadow-soft hover:bg-accent-soft hover:text-accent-dark hover:shadow-lift hover:scale-[1.02]",
  // Прозрачная кнопка для ярких градиентных секций (hero)
  glass:
    "border border-white/40 bg-white/10 text-white backdrop-blur hover:border-white/70 hover:bg-white/20",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/**
 * Переиспользуемая кнопка. Варианты:
 * primary/fill, secondary (тёмная), outline (светлые секции),
 * accent (фиолетовый для Pro), light/glass (для градиентного фона).
 * Поддерживает роуты (to), внешние ссылки (href) и обработчик (onClick).
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  className = "",
  "data-metrica": dataMetrica,
  type = "button",
  onClick,
  ariaLabel,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className} ${
    loading || disabled ? "pointer-events-none opacity-70" : ""
  }`;

  // Спиннер вместо текста при загрузке
  const content = loading ? <Spinner /> : children;

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        data-metrica={dataMetrica}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-busy={loading}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} data-metrica={dataMetrica} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      data-metrica={dataMetrica}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={loading || disabled}
    >
      {content}
    </button>
  );
}