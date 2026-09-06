import { useNavigate } from "react-router-dom";
import { habitStreak } from "../../hooks/useHabits";
import type { Habit } from "../../lib/types";
import { motivationFor, progressLabel } from "../../data/motivation";

interface HabitCardProps {
  habit: Habit;
  /** Открыть модалку отметки (выполнено/частично) */
  onCheckIn: (habit: Habit) => void;
}

/** Статус состояния карточки */
type HabitState = "done" | "partial" | "none";

function stateFor(percent: number): HabitState {
  if (percent >= 100) return "done";
  if (percent > 0) return "partial";
  return "none";
}

/**
 * Карточка привычки: иконка, название, прогресс-бар на сегодня,
 * мотивационная фраза и кнопки «Отметить / Изменить» + «Подробнее».
 */
export default function HabitCard({ habit, onCheckIn }: HabitCardProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const checkin = habit.history.find((h) => h.date === today);
  const value = checkin?.value ?? 0;
  const percent = Math.min(100, Math.round((value / habit.target) * 100));
  const state = stateFor(percent);

  const barClass =
    state === "done" ? "bg-primary" : state === "partial" ? "bg-accent" : "bg-ink/10";
  const streak = habitStreak(habit.history);
  const phrase = motivationFor(percent, `${habit.id}-${value}-${today}`);

  return (
    <article
      className="flex h-full flex-col rounded-card border border-ink/5 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      style={{ borderTop: `3px solid ${habit.color}` }}
    >
      {/* Шапка: иконка + название */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center text-2xl"
            style={{ backgroundColor: `${habit.color}1f`, borderRadius: 14 }}
            aria-hidden="true"
          >
            {habit.emoji}
          </span>
          <div>
            <h3 className="font-display text-lg font-extrabold text-ink">{habit.name}</h3>
            <p className="text-sm text-ink-soft">
              цель — {habit.target} {habit.unit}/день
            </p>
          </div>
        </div>
        {streak > 0 && (
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">
            🔥 {streak} дн
          </span>
        )}
      </div>

      {/* Прогресс */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-black text-ink">
            {value}
            <span className="text-sm font-bold text-ink-faint"> / {habit.target}</span>
          </span>
          <span
            className={`font-display text-xl font-black ${
              state === "done"
                ? "text-primary"
                : state === "partial"
                  ? "text-accent-dark"
                  : "text-ink-faint"
            }`}
          >
            {percent}%
          </span>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Прогресс ${habit.name}`}>
          {percent > 0 && (
            <div className={`habit-progress h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
          )}
        </div>
      </div>

      {/* Статус + мотивация */}
      <div className="mt-4 min-h-[48px]">
        <p
          className={`font-semibold ${
            state === "done" ? "text-primary" : state === "partial" ? "text-accent-dark" : "text-ink-soft"
          }`}
        >
          {progressLabel(percent, value, habit.target)}
        </p>
        <p className="mt-1 text-sm text-ink-faint">{phrase}</p>
      </div>

      {/* Кнопки */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onCheckIn(habit)}
          className={`flex-1 rounded-btn px-4 py-2.5 text-sm font-bold shadow-soft transition-all duration-200 ${
            state === "done"
              ? "bg-canvas text-ink-soft hover:bg-ink/5"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
          data-metrica="goal:habit-checkin"
        >
          {state === "done" ? "✏️ Изменить" : "✅ Отметить"}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/dashboard/habit/${habit.id}`)}
          className="flex-1 rounded-btn bg-canvas px-4 py-2.5 text-sm font-bold text-ink-soft transition-all duration-200 hover:bg-ink/5"
          data-metrica="goal:habit-more"
        >
          📊 Подробнее
        </button>
      </div>
    </article>
  );
}