import { checkinFor } from "../../hooks/useHabits";
import type { Habit } from "../../lib/types";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Понедельник текущей недели */
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Пн=0
  d.setDate(d.getDate() - day);
  return d;
}

function statusFor(habit: Habit, date: string): { icon: string; cls: string; title: string } {
  const c = checkinFor(habit, date);
  if (c?.done) return { icon: "✅", cls: "text-primary", title: "Выполнено" };
  if ((c?.value ?? 0) > 0) return { icon: "⚠️", cls: "text-accent-dark", title: "Частично" };
  return { icon: "❌", cls: "text-ink-faint", title: "Не выполнено" };
}

interface WeekCalendarProps {
  habits: Habit[];
}

/**
 * Календарь выполнения на неделю (Пн–Вс):
 * в каждой колонке дата и список привычек с индикаторами ✅ / ⚠️ / ❌.
 * Сегодня выделено акцентным цветом. На мобильных — горизонтальный скролл.
 */
export default function WeekCalendar({ habits }: WeekCalendarProps) {
  const today = new Date();
  const todayIso = iso(today);
  const weekStart = mondayOf(today);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto pb-2" aria-label="Выполнение за неделю">
      <div className="grid min-w-[720px] grid-cols-7 gap-2">
        {days.map((day, i) => {
          const key = iso(day);
          const isToday = key === todayIso;
          const allDone =
            habits.length > 0 && habits.every((h) => checkinFor(h, key)?.done);

          return (
            <div
              key={key}
              className={`rounded-card border p-2.5 transition-colors ${
                isToday
                  ? "border-accent bg-accent-soft shadow-soft"
                  : "border-ink/5 bg-white"
              }`}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className={`text-xs font-bold ${isToday ? "text-accent-dark" : "text-ink-faint"}`}
                >
                  {DAY_NAMES[i]}
                </span>
                {isToday && (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-black text-white">
                    сегодня
                  </span>
                )}
              </div>
              <p
                className={`mt-1 font-display text-2xl font-black ${
                  isToday ? "text-accent-dark" : "text-ink"
                }`}
              >
                {day.getDate()}
              </p>

              {/* Привычки дня */}
              <div className="mt-2 space-y-1.5">
                {habits.length === 0 && (
                  <p className="text-xs text-ink-faint">Нет привычек</p>
                )}
                {habits.map((h) => {
                  const s = statusFor(h, key);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center gap-1.5 rounded-btn bg-canvas px-1.5 py-1"
                      title={`${h.name}: ${s.title}`}
                    >
                      <span className="text-sm" aria-hidden="true">
                        {h.emoji}
                      </span>
                      <span className={`text-xs font-bold ${s.cls}`}>{s.icon}</span>
                    </div>
                  );
                })}
              </div>

              {allDone && (
                <p className="mt-2 text-center text-[10px] font-black text-primary">
                  всё готово 🎉
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}