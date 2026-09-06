import type { PeriodStats } from "../../../lib/types";

const DAY_FULL = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

interface StatsGridProps {
  stats: PeriodStats;
}

/** Карточки статистики за выбранный период */
export default function StatsGrid({ stats }: StatsGridProps) {
  const fmtDay = (iso: string) => DAY_FULL.format(new Date(`${iso}T00:00:00`));

  const cards = [
    { emoji: "📈", label: "Среднее выполнение", value: `${stats.avg}%` },
    {
      emoji: "🏆",
      label: "Лучший день",
      value: stats.bestDate ? `${fmtDay(stats.bestDate)} (${stats.bestPercent}%)` : "—",
    },
    {
      emoji: "📉",
      label: "Худший день",
      value: stats.worstDate ? `${fmtDay(stats.worstDate)} (${stats.worstPercent}%)` : "—",
    },
    { emoji: "🔥", label: "Серия дней", value: `${stats.streak} дн` },
    {
      emoji: "✅",
      label: "Всего выполнений",
      value: `${stats.done} из ${stats.total}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="chart-rise rounded-card border border-ink/5 bg-white p-4 shadow-soft">
          <div className="text-2xl" aria-hidden="true">{c.emoji}</div>
          <p className="mt-2 font-display text-xl font-black text-ink">{c.value}</p>
          <p className="mt-0.5 text-[11px] font-bold text-ink-faint">{c.label}</p>
        </div>
      ))}
    </div>
  );
}