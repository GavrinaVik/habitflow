const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899"];

interface ConfettiProps {
  /** Счётчик запусков: каждый новый номер перезапускает анимацию */
  burst: number;
  count?: number;
}

/**
 * Конфетти-анимация для момента полного выполнения.
 * Переиспользует keyframes `confetti-fall` из index.css.
 */
export default function Confetti({ burst, count = 28 }: ConfettiProps) {
  if (burst <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={`${burst}-${i}`}
          className="confetti-piece absolute top-0 h-2.5 w-2.5 rounded-[2px]"
          style={{
            left: `${(i * 137) % 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${(i % 9) * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}