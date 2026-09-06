import type { ReactNode } from "react";

type Variant = "primary" | "accent" | "violet" | "default";

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const base =
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-soft",
  accent: "bg-accent-soft text-accent-dark",
  violet: "bg-violet-500 text-white shadow-soft",
  default: "bg-canvas text-ink-soft",
};

/**
 * Переиспользуемый бейдж: «Популярный выбор», «Экономия 17%» и т.п.
 */
export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
}