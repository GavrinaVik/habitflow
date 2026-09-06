import type { HabitPeriod } from "../../../lib/types";

interface PeriodTabsProps {
  value: HabitPeriod;
  onChange: (period: HabitPeriod) => void;
  /** Тариф пользователя: "free" | "pro" | "premium" */
  plan: string;
}

const TABS: { id: HabitPeriod; label: string; pro: boolean }[] = [
  { id: "week", label: "Неделя", pro: false },
  { id: "month", label: "Месяц", pro: true },
  { id: "all", label: "Всё время", pro: true },
];

/** Переключатель периода графика. Free видит только «Неделю». */
export default function PeriodTabs({ value, onChange, plan }: PeriodTabsProps) {
  const isPro = plan !== "free";
  return (
    <div role="tablist" aria-label="Период графика" className="inline-flex rounded-btn border border-ink/10 bg-white p-1">
      {TABS.map((t) => {
        const active = value === t.id;
        const locked = t.pro && !isPro;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={locked}
            onClick={() => onChange(t.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-bold transition-all ${
              active
                ? "bg-primary text-white shadow-soft"
                : "text-ink-soft hover:text-ink"
            } ${locked ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {t.label}
            {locked && <span className="ml-1 text-[10px]" aria-hidden="true">🔒</span>}
          </button>
        );
      })}
    </div>
  );
}