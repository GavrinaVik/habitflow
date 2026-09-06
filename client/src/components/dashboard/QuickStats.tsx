import { checkinFor, habitStreak } from "../../hooks/useHabits";
import type { Habit } from "../../lib/types";

interface QuickStatsProps {
  habits: Habit[];
}

/** Четыре карточки быстрой статистики за сегодня */
export default function QuickStats({ habits }: QuickStatsProps) {
  const today = new Date().toISOString().slice(0, 10);

  const doneToday = habits.filter((h) => checkinFor(h, today)?.done).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, habitStreak(h.history)), 0);
  const avgProgress = habits.length
    ? Math.round(
        habits.reduce((sum, h) => {
          const c = checkinFor(h, today);
          return sum + (c ? Math.min(100, (c.value / h.target) * 100) : 0);
        }, 0) / habits.length
      )
    : 0;

  const cards = [
    {
      emoji: "✅",
      title: "Выполнено сегодня",
      value: `${doneToday} из ${habits.length}`,
      hint: "привычек сегодня",
    },
    {
      emoji: "🔥",
      title: "Серия дней",
      value: `${bestStreak} дн`,
      hint: bestStreak > 0 ? "не останавливайся!" : "пора начинать!",
    },
    {
      emoji: "📈",
      title: "Общий прогресс",
      value: `${avgProgress}%`,
      hint: avgProgress >= 80 ? "отличный темп!" : "есть куда расти",
    },
    {
      emoji: "🏅",
      title: "Бейджей получено",
      value: "5",
      hint: "и это только начало!",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="rounded-card border border-ink/5 bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="text-2xl" aria-hidden="true">
            {c.emoji}
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-faint">
            {c.title}
          </p>
          <p className="mt-1 font-display text-3xl font-black text-ink">{c.value}</p>
          <p className="mt-1 text-xs text-ink-soft">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}