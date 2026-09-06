import type { ElementType, ReactNode } from "react";
import { useInView } from "../../hooks/useInView";

interface RevealProps {
  children: ReactNode;
  /** Задержка анимации в миллисекундах для каскадного появления */
  delay?: number;
  /** Направление появления */
  direction?: "up" | "left" | "right" | "none";
  className?: string;
  as?: ElementType;
}

const directionClass: Record<NonNullable<RevealProps["direction"]>, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  none: "",
};

/**
 * Обёртка для плавного появления блока при прокрутке.
 * Использует IntersectionObserver (см. hooks/useInView).
 */
export default function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref}
      className={`reveal ${directionClass[direction]} ${inView ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}