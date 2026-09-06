import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Поднимает карточку при наведении */
  hover?: boolean;
}

const base = "rounded-card bg-white shadow-soft";

/**
 * Переиспользуемая карточка: скругление 12px + мягкая тень.
 */
export default function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`${base} ${hover ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-lift" : ""} ${className}`}
    >
      {children}
    </div>
  );
}